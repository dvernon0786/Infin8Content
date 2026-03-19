import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { runContentPlannerAgent } from '@/lib/services/article-generation/content-planner-agent'
import { runResearchAgent } from '@/lib/services/article-generation/research-agent'
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent'
import { ArticleAssembler } from '@/lib/services/article-generation/article-assembler'
import { generateArticleImage, getSectionImagePurpose } from '@/lib/services/image-generation/image-generation-agent'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'
import type {
  Article,
  ArticleSection,
  ResearchPayload,
  ContentDefaults,
  ArticlePlannerOutput,
  SectionPlannerOutput
} from '@/types/article'

// B-4 Required: Retry wrapper with exponential backoff
async function withRetries<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let error: any
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      error = e
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000))
      }
    }
  }
  throw error
}

export const generateArticle = inngest.createFunction(
  {
    id: 'article/generate',
    concurrency: {
      limit: 1,
      key: 'event.data.articleId'
    }
  },
  { event: 'article/generate' },
  async ({ event, step }: any) => {
    const { articleId } = event.data
    const supabase = createServiceRoleClient()

    /* -------------------------------------------------- */
    /* 1. Load Article & Organization context            */
    /* -------------------------------------------------- */

    const { article, organization, workflow, orgId } = await step.run('load-context', async () => {
      // Load Article
      const { data: artData, error: artError } = await supabase
        .from('articles')
        .select(`
          id,
          organization_id:org_id,
          status,
          intent_workflow_id,
          keyword,
          title,
          subtopic_data,
          article_plan,
          generation_config
        `)
        .eq('id', articleId)
        .single()

      if (artError) {
        console.error(`[Worker] Supabase error loading article ${articleId}:`, artError)
        throw new Error(`Database error: ${artError.message}`)
      }

      if (!artData) throw new Error(`Article ${articleId} not found`)
      const article = artData as unknown as Article

      // NB_COMPLETE_RETRY FIX: Allow 'completed' articles to flow through steps
      // so post-completion logic (images, workflow terminal) can be retried if it fails.
      // Inngest handles idempotency of successful steps automatically.
      if (article.status === 'failed') {
        return { skipped: true } as any
      }

      // Load Organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', article.organization_id)
        .single()

      if (orgError || !orgData) throw new Error(`Organization ${article.organization_id} not found`)

      // Load Workflow for ICP context (Phase 6 req)
      const { data: wfData } = await supabase
        .from('intent_workflows')
        .select('icp_analysis')
        .eq('id', (article.intent_workflow_id as string))
        .single()

      return { article, organization: orgData, workflow: wfData, orgId: (artData as any).org_id }
    })

    if ((article as any).skipped) return { success: true, skipped: true }

    // 🔒 TERMINAL STATE LOCK: Move to 'processing' if not already there
    await step.run('ensure-processing-status', async () => {
      if (article.status === 'processing') return

      const { error } = await supabase
        .from('articles')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .in('status', ['queued', 'draft', 'failed'])

      if (error) throw new Error(`Status transition failed: ${error.message}`)
    })

    /* -------------------------------------------------- */
    /* 2. Snapshot Generation Config                     */
    /* -------------------------------------------------- */

    const generationConfig = await step.run('snapshot-config', async () => {
      // If already snapshotted, return it
      if (article.generation_config) return article.generation_config as ContentDefaults

      // Otherwise, snapshot now for determinism (Phase 5, Step 3)
      const config = {
        ...(organization.content_defaults as ContentDefaults),
        // Safety default: emojis off unless explicitly enabled by user
        add_emojis: (organization.content_defaults as ContentDefaults)?.add_emojis ?? false,
      }

      await supabase
        .from('articles')
        .update({ generation_config: config })
        .eq('id', articleId)

      return config
    })

    /* -------------------------------------------------- */
    /* 3. Run Content Planner Agent                      */
    /* -------------------------------------------------- */

    const plan = await step.run('run-planner', async () => {
      // Determinism: If plan already exists, skip
      if (article.article_plan) {
        // 🔒 BACKFILL: Ensure title is always set even on retry paths
        if (!article.title && (article.article_plan as ArticlePlannerOutput).article_title) {
          await supabase
            .from('articles')
            .update({ title: (article.article_plan as ArticlePlannerOutput).article_title })
            .eq('id', articleId)
        }
        return article.article_plan as ArticlePlannerOutput
      }

      const icpText = [
        `Business Description:\n${organization.business_description || ''}`,
        workflow?.icp_analysis
          ? `ICP Analysis:\n${JSON.stringify(workflow.icp_analysis, null, 2)}`
          : ''
      ].filter(Boolean).join('\n\n')

      const plannerOutput = await runContentPlannerAgent({
        targetKeyword: (article as any).keyword || (article as any).target_keyword || 'unknown',
        subtopicData: (article as any).subtopic_data || [],
        organizationContext: {
          name: organization.name,
          description: organization.business_description || '',
          icpText
        },
        generationConfig: generationConfig
      })

      // Update article with top-level plan
      const topLevelPlan: ArticlePlannerOutput = {
        article_title: plannerOutput.article_title,
        content_style: plannerOutput.content_style,
        target_keyword: plannerOutput.target_keyword,
        semantic_keywords: plannerOutput.semantic_keywords,
        total_estimated_words: plannerOutput.total_estimated_words,
        article_structure: plannerOutput.article_structure // Store structure for reseed persistence
      }

      await supabase
        .from('articles')
        .update({
          article_plan: topLevelPlan,
          title: plannerOutput.article_title  // 🔒 FIX: Persist title so assembler finds it
        })
        .eq('id', articleId)

      return plannerOutput
    })

    /* -------------------------------------------------- */
    /* 3.5 Generate Cover Image                         */
    /* -------------------------------------------------- */

    await step.run('generate-cover-image', async () => {
      // Idempotency: skip if already generated
      const { data: existing } = await supabase
        .from('articles')
        .select('cover_image_url')
        .eq('id', articleId)
        .single()

      if ((existing as any)?.cover_image_url) {
        console.log('[ImageAgent] Cover image already exists, skipping.')
        return (existing as any).cover_image_url
      }

      try {
        const result = await generateArticleImage({
          prompt: (plan as any).article_title,
          purpose: 'cover',
          articleTitle: (plan as any).article_title,
          keyword: (article as any).keyword || '',
          articleId,
          imageStyle: (generationConfig as any).image_style,
          brandColor: (generationConfig as any).brand_color,
        })

        await supabase
          .from('articles')
          .update({ cover_image_url: result.url })
          .eq('id', articleId)

        console.log(`[ImageAgent] Cover image saved for article ${articleId}`)
        return result.url
      } catch (err) {
        // Non-fatal — article completes without cover image
        console.warn('[ImageAgent] Cover image generation failed (non-fatal):', err)
        return null
      }
    })

    /* -------------------------------------------------- */
    /* 4. Transactional Reseed (HARDENED)                */
    /* -------------------------------------------------- */

    const sections = await step.run('reseed-sections', async () => {
      const { data: existingSections } = await supabase
        .from('article_sections')
        .select('id')
        .eq('article_id', articleId)
        .not('planner_output', 'is', null)

      // 🛡️ STRUCTURAL INTEGRITY GUARD:
      // Only skip if count matches exactly what the planner intended.
      if (existingSections && existingSections.length === (plan as any).article_structure.length) {
        const { data } = await supabase.from('article_sections').select('*').eq('article_id', articleId).order('section_order')
        return data as unknown as ArticleSection[]
      }

      console.log(`[Worker] Reseeding sections for ${articleId}. Reason: Count mismatch or first run.`)

      // 🔒 ATOMIC TRANSACTION: Use the new reseed_sections RPC
      const sectionPayload = (plan as any).article_structure.map((s: SectionPlannerOutput, i: number) => ({
        section_order: i + 1,
        section_header: s.header,
        section_type: s.section_type,
        planner_output: s
      }))

      const { error: rpcError } = await supabase.rpc('reseed_sections', {
        p_article_id: articleId,
        p_sections: sectionPayload
      })

      if (rpcError) throw new Error(`Atomic reseed failed: ${rpcError.message}`)

      const { data: inserted, error: fetchError } = await supabase
        .from('article_sections')
        .select('*')
        .eq('article_id', articleId)
        .order('section_order')

      if (fetchError || !inserted) throw new Error('Failed to fetch reseeded sections')

      return inserted as unknown as ArticleSection[]
    })

    /* -------------------------------------------------- */
    /* 5. Generation Pipeline Loop                       */
    /* -------------------------------------------------- */

    const completedSections: ArticleSection[] = []

    try {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        const position = i === 0 ? 'first' : i === sections.length - 1 ? 'final' : 'middle'

        try {
          // ---- Research Agent (Agent 2)
          const research = await step.run(`research-${section.section_order}`, async () => {
            // Idempotency: skip Tavily if research already exists (e.g., from retry)
            const { data: cached } = await supabase
              .from('article_sections')
              .select('research_payload')
              .eq('id', section.id)
              .single() as any

            if (cached?.research_payload) {
              console.log(`[ResearchAgent] Using cached research for section ${section.section_order}, skipping Tavily.`)
              return cached.research_payload as any
            }

            // Update status
            await supabase.from('article_sections').update({ status: 'researching' }).eq('id', section.id)

            const result = await withRetries(() => runResearchAgent({
              sectionHeader: section.section_header,
              sectionType: section.section_type,
              researchQuestions: (section.planner_output as any).research_questions || [],
              supportingPoints: (section.planner_output as any).supporting_points || [],
              priorSectionsSummary: completedSections.map(s => `${s.section_header} (${s.section_type})`).join('\n'),
              organizationContext: {
                name: organization.name,
                description: organization.business_description || ''
              }
            }))

            await supabase.from('article_sections').update({
              research_payload: result,
              status: 'researched'
            }).eq('id', section.id)

            return result
          })

          // ---- Writing Agent (Agent 3)
          const content = await step.run(`write-${section.section_order}`, async () => {
            await supabase.from('article_sections').update({ status: 'writing' }).eq('id', section.id)

            const result = await withRetries(() => runContentWritingAgent({
              sectionHeader: section.section_header,
              sectionType: section.section_type,
              researchPayload: research,
              plannerOutput: section.planner_output as any,
              articlePlan: plan as any,
              position,
              generationConfig,
              priorContentMarkdown: completedSections
                .filter(s => s.content_markdown?.trim())  // 🔒 Guard before map to prevent "null" strings
                .map(s => `## ${s.section_header}\n\n${s.content_markdown}`)
                .join('\n\n'),
              organizationContext: {
                name: organization.name,
                description: organization.business_description || ''
              }
            }))

            await supabase.from('article_sections').update({
              content_markdown: result.markdown,
              content_html: result.html,
              status: 'completed'
            }).eq('id', section.id)

            return result
          })

          // Build context for next loop
          completedSections.push({
            ...section,
            content_markdown: content.markdown,
            status: 'completed'
          } as ArticleSection)

        } catch (sectionError) {
          console.error(`[Worker] Section ${section.id} failed:`, sectionError)

          // Mark section as failed so the article can still "complete" with missing pieces
          await step.run(`mark-section-failed-${section.section_order}`, async () => {
            await supabase
              .from('article_sections')
              .update({
                status: 'failed',
                error_details: {
                  message: sectionError instanceof Error ? sectionError.message : String(sectionError),
                  failed_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', section.id)
          })

          continue // 🔥 CRITICAL: Proceed to next section instead of crashing the whole loop
        }

        // 🔒 IMAGE PIPELINE DECOUPLED (BUG 4 Fix)
        // Image generation has been moved to the post-assembly worker to prevent
        // Riverflow (4.2min/step) from timing out the main text generation pipeline.
        // It now fires after 'complete-article' below.
      }

      /* -------------------------------------------------- */
      /* Article Assembly (LIFECYCLE HARDENING)            */
      /* -------------------------------------------------- */

      

      // ─── GEO / AEO Enrichment ─────────────────────────────────────────────
      await step.run('enrich-geo-aeo', async () => {
        try {
          const { runGeoAeoEnrichment } = await import('@/lib/services/article-generation/geo-aeo-enrichment')
          const result = await runGeoAeoEnrichment({
            articleId,
            targetKeyword: (article as any).keyword || '',
            supabase,
          })
          console.log('[GeoAeoEnrichment] Result:', result)
          return result
        } catch (err) {
          console.error('[GeoAeoEnrichment] Non-fatal error, continuing:', err)
          return { skipped: true }
        }
      })
      // ─── End GEO / AEO Enrichment ─────────────────────────────────────────

      // ─── Internal Linking Injection ───────────────────────────────────────
      await step.run('internal-linking', async () => {
        // Respect the generation config flag — skip if disabled for this org
        if (!generationConfig.internal_links) {
          console.log('[Worker] Internal linking disabled in generation config — skipping')
          return { skipped: true, reason: 'disabled_in_config' }
        }

        const { runInternalLinking } = await import(
          '@/lib/services/article-generation/internal-linking-service'
        )

        const result = await runInternalLinking({
          articleId,
          orgId: orgId ?? event.data.organizationId,
          currentKeyword: plan.target_keyword,
          maxLinks: generationConfig.num_internal_links ?? 5,
          supabase,
        })

        console.log(
          `[Worker] Internal linking: injected=${result.linksInjected} sections=${result.sectionsUpdated} skipped=${result.skipped}${result.reason ? ` reason=${result.reason}` : ''}`
        )

        return result
      })
      // ─── End Internal Linking Injection ─────────────────────────────────

      // 🏗️ ARTICLE ASSEMBLY & SNAPSHOT PROJECTION
      // 🔒 AUTHORITY: The worker now explicitly manages the 'processing' -> 'completed' transition.
      // 📂 INVARIANT: The Assembler MUST persist the snapshot projection BEFORE the 
      // terminal status update to ensure the UI reads from a completed projection.
      await step.run('assemble-article', async () => {
        // 🔒 NB_RETRY_REGRESSION FIX: Skip assembly if already completed
        const { data: latest } = await supabase.from('articles').select('status').eq('id', articleId).single()
        if ((latest as any)?.status === 'completed') return

        const assembler = new ArticleAssembler()

        // 1. Collate sections and write JSONB snapshot projection
        await assembler.assemble({
          articleId,
          organizationId: orgId ?? event.data.organizationId
        })
      })

      // ─── Schema Markup Generation ─────────────────────────────────────────
      await step.run('generate-schema-markup', async () => {
        try {
          const { generateSchemaMarkup } = await import('@/lib/services/article-generation/schema-generator')
          const result = await generateSchemaMarkup({
            articleId,
            orgId: orgId ?? event.data.organizationId,
            supabase,
          } as any)
          console.log('[SchemaMarkup] Result:', result)
          return result
        } catch (err) {
          console.error('[SchemaMarkup] Non-fatal error, continuing:', err)
          return { skipped: true }
        }
      })
      // ─── End Schema Markup Generation ────────────────────────────────────

      // ─── SEO Scoring ──────────────────────────────────────────────────────
      await step.run('score-seo-final', async () => {
        try {
          const { scoreSEO } = await import('@/lib/services/article-generation/seo-scoring-service')
          const result = await scoreSEO({
            articleId,
            orgId: orgId ?? event.data.organizationId,
            supabase,
          } as any)
          console.log('[SEOScore] Result:', result)
          return result
        } catch (err) {
          console.error('[SEOScore] Non-fatal error, continuing:', err)
          return { skipped: true }
        }
      })
      // ─── End SEO Scoring ─────────────────────────────────────────────────

      await step.run('mark-completed', async () => {
        // 🔒 NB_MARK_COMPLETED_THROW FIX: skip if already completed
        const { data: latest } = await supabase
          .from('articles')
          .select('status')
          .eq('id', articleId)
          .single()
        if ((latest as any)?.status === 'completed') return

        const { error: completionError, data } = await supabase
          .from('articles')
          .update({
            status: 'completed',
            generation_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', articleId)
          .eq('status', 'processing') // 🔒 ATOMIC GUARD
          .select('id')

        if (completionError) throw completionError

        if (!data || data.length === 0) {
          // Re-read to distinguish race condition from genuine failure
          const { data: latestStatus } = await supabase
            .from('articles')
            .select('status')
            .eq('id', articleId)
            .single()

          if ((latestStatus as any)?.status === 'completed') {
            console.log(`[Worker] Article ${articleId} already completed by concurrent process — idempotent skip.`)
            return  // ✅ FIX: explicit return — prevents fall-through to success log below
          }

          throw new Error(
            `Terminal update failed: Article ${articleId} is in status '${(latestStatus as any)?.status ?? 'unknown'}', expected 'processing'.`
          )
        }

        console.log(`[Worker] Article ${articleId} generation lifecycle COMPLETED successfully.`)
      })

      /* -------------------------------------------------- */
      /* Article Post-Completion (Workflow & Images)       */
      /* -------------------------------------------------- */
      // 🔒 NB_COMPLETE_RETRY FIX: Move inside try block. If Inngest retries here, 
      // the status guard at top allows it, and Inngest handles step idempotency.
      await step.run('complete-article', async () => {
        // CANONICAL COMPLETION: Check if all articles are done and mark workflow terminal
        const workflowId = (event.data as any).workflowId
        if (workflowId) {
          await checkAndCompleteWorkflow(supabase, workflowId)
        }

        // 🎨 TRIGGER IMAGE PIPELINE (BUG 4 Fix)
        // BUG G FIX: Idempotency Key
        await inngest.send({
          name: 'article/images.generate',
          id: `images-${articleId}`,
          data: { articleId }
        })
      })
    } catch (pipelineError) {
      // Mark article as failed
      await step.run('mark-article-failed', async () => {
        await supabase
            .from('articles')
            .update({
              status: 'failed',
              error_details: {
                message: pipelineError instanceof Error ? pipelineError.message : String(pipelineError),
                failed_at: new Date().toISOString(),
              },
            })
            .eq('id', articleId)
              .in('status', ['processing', 'queued', 'draft']) // 🔒 NB_FAIL_GUARD FIX: Prevent overwriting 'completed'
      })

      throw pipelineError
    }

    /* -------------------------------------------------- */
    /* Mark article complete                             */
    /* -------------------------------------------------- */


    return { success: true, articleId }
  }
)

/**
 * Check if all articles for a workflow are completed and mark workflow as terminal
 */
async function checkAndCompleteWorkflow(
  supabase: any,
  workflowId: string
): Promise<void> {
  try {
    // Import unified engine for terminal authority
    const { transitionWithAutomation } = await import('@/lib/fsm/unified-workflow-engine')

    // Fetch current workflow state (FSM state only)
    const { data: workflowData, error } = await supabase
      .from('intent_workflows')
      .select('state')
      .eq('id', workflowId)
      .limit(1)

    if (error) {
      console.error('Workflow query error:', error)
      return
    }

    const workflow = workflowData?.[0]
    if (!workflow) return

    // FSM GUARD
    if (
      workflow.state !== 'step_9_articles' &&
      workflow.state !== 'step_9_articles_running' &&
      workflow.state !== 'step_9_articles_queued'
    ) return

    // Check if all articles are completed — only in-flight articles block completion
    const { data: incompleteArticles } = await supabase
      .from('articles')
      .select('id')
      .eq('intent_workflow_id', workflowId)
      .in('status', ['queued', 'processing'])

    // PRODUCTION HARDENING: Verify at least one article exists before completing
    const { data: allArticles } = await supabase
      .from('articles')
      .select('id')
      .eq('intent_workflow_id', workflowId)
      .limit(1)

    if (!allArticles || allArticles.length === 0) return

    // If no incomplete articles, complete workflow via FSM transition
    if (!incompleteArticles || incompleteArticles.length === 0) {
      console.log(`[WorkflowCompletion] Workflow ${workflowId} successfully transitioned to completed`)
      await transitionWithAutomation(workflowId, 'WORKFLOW_COMPLETED', SYSTEM_USER_ID)
    }
  } catch (error) {
    console.error(`[WorkflowCompletion] Error:`, error)
  }
}

/**
 * Post-Assembly Image Generation Pipeline (BUG 4)
 * Handles slow section image generation (Riverflow) without blocking text completion.
 */
export const generateArticleImages = inngest.createFunction(
  {
    id: 'article/images.generate',
    concurrency: {
      limit: 2, // Allow some parallelism for images
      key: 'event.data.articleId'
    }
  },
  { event: 'article/images.generate' },
  async ({ event, step }: any) => {
    const { articleId } = event.data
    const supabase = createServiceRoleClient()

    // 1. Load Article and Sections
    const { article, sections } = await step.run('load-image-context', async () => {
      const { data: artData } = await supabase
        .from('articles')
        .select('id, title, keyword, article_plan, generation_config, org_id')
        .eq('id', articleId)
        .single()

      const { data: secData } = await supabase
        .from('article_sections')
        .select('*')
        .eq('article_id', articleId)
        .order('section_order')

      return { article: artData, sections: secData }
    })

    if (!article || !sections) return { error: 'Context not found' }

    // BUG B / NB4 FIX: Defensive fallbacks for null plan/config
    const plan = (article.article_plan as any) ?? {}
    const generationConfig = (article.generation_config as any) ?? {}

    // 2. Generate Section Images
    for (const section of sections) {
      const purpose = getSectionImagePurpose(
        section.section_type,
        section.section_order,
        section.section_header
      )

      if (!purpose) continue

      await step.run(`generate-image-section-${section.section_order}`, async () => {
        // Skip if already exists
        if (section.section_image_url) return section.section_image_url

        try {
          const result = await generateArticleImage({
            prompt: section.section_header,
            purpose,
            articleTitle: plan.article_title,
            keyword: article.keyword || '',
            articleId,
            imageStyle: generationConfig.image_style,
            brandColor: generationConfig.brand_color,
          }, `section-${section.section_order}`)

          await supabase
            .from('article_sections')
            .update({ section_image_url: result.url })
            .eq('id', section.id)

          return result.url
        } catch (err) {
          console.warn(`[ImageWorker] Section ${section.section_order} image failed:`, err)
          return null
        }
      })
    }

    // 3. Final Assembly Update
    // 🏗️ Re-run the assembler to inject the now-present image URLs into the JSONB snapshot
    await step.run('final-image-assembly', async () => {
      const assembler = new ArticleAssembler()
      await assembler.assemble({
        articleId,
        organizationId: (article as any).org_id,
        allowReassembly: true   // ← bypass status guard for post-completion injection
      })
    })

    return { success: true }
  }
)
