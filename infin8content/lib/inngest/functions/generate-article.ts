import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { runContentPlannerAgent } from '@/lib/services/article-generation/content-planner-agent'
import { runResearchAgent } from '@/lib/services/article-generation/research-agent'
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent'
import { ArticleAssembler } from '@/lib/services/article-generation/article-assembler'
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
      key: 'event.data.organizationId'
    }
  },
  { event: 'article/generate' },
  async ({ event, step }: any) => {
    const { articleId } = event.data
    const supabase = createServiceRoleClient()

    /* -------------------------------------------------- */
    /* 1. Load Article & Organization context            */
    /* -------------------------------------------------- */

    const { article, organization, workflow } = await step.run('load-context', async () => {
      // Load Article
      const { data: artData, error: artError } = await supabase
        .from('articles')
        .select(`
          id,
          organization_id:org_id,
          status,
          intent_workflow_id,
          keyword,
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

      if (article.status === 'completed' || article.status === 'failed') {
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
        .eq('id', article.intent_workflow_id)
        .single()

      return { article, organization: orgData, workflow: wfData }
    })

    if ((article as any).skipped) return { success: true, skipped: true }

    // 🔒 TERMINAL STATE LOCK: Move to 'generating' if not already there
    await step.run('transition-to-generating', async () => {
      if (article.status === 'generating') return

      const { error } = await supabase
        .from('articles')
        .update({ status: 'generating', updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .eq('status', 'queued')

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
      }

      /* -------------------------------------------------- */
      /* Article Assembly (LIFECYCLE HARDENING)            */
      /* -------------------------------------------------- */

      // 🏗️ ARTICLE ASSEMBLY & SNAPSHOT PROJECTION
      // 🔒 AUTHORITY: The worker now explicitly manages the 'generating' -> 'completed' transition.
      // 📂 INVARIANT: The Assembler MUST persist the snapshot projection BEFORE the 
      // terminal status update to ensure the UI reads from a completed projection.
      await step.run('assemble-article', async () => {
        const assembler = new ArticleAssembler()

        // 1. Collate sections and write JSONB snapshot projection
        await assembler.assemble({
          articleId,
          organizationId: article.organization_id
        })

        // 2. 🔒 TERMINAL STATE LOCK: Explicitly mark article as completed
        const { error: completionError, data } = await supabase
          .from('articles')
          .update({
            status: 'completed',
            generation_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', articleId)
          .eq('status', 'generating') // 🔒 ATOMIC GUARD: Only complete if still in 'generating'
          .select('id')

        if (completionError) throw completionError
        if (!data || data.length === 0) {
          throw new Error(`Terminal update failed: Article ${articleId} status was not 'generating' during completion.`)
        }

        console.log(`[Worker] Article ${articleId} generation lifecycle COMPLETED successfully.`)
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
      })

      throw pipelineError
    }

    /* -------------------------------------------------- */
    /* Mark article complete                             */
    /* -------------------------------------------------- */

    await step.run('complete-article', async () => {
      // CANONICAL COMPLETION: Check if all articles are done and mark workflow terminal
      const workflowId = (event.data as any).workflowId
      if (workflowId) {
        await checkAndCompleteWorkflow(supabase, workflowId)
      }
    })

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

    // Check if all articles are completed
    const { data: incompleteArticles } = await supabase
      .from('articles')
      .select('id')
      .eq('intent_workflow_id', workflowId)
      .neq('status', 'completed')

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
