import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'
import { runResearchAgent } from '@/lib/services/article-generation/research-agent'
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent'
import { ArticleAssembler } from '@/lib/services/article-generation/article-assembler'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'
import type { ArticleSection, ResearchPayload, ContentDefaults } from '@/types/article'

// B-4 Required: Retry wrapper with exponential backoff (matches existing retryWithBackoff)
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
    id: 'article/generate', // PRESERVED: Same function ID as original
    concurrency: {
      limit: 1,
      key: 'event.data.organizationId'
    }
  },
  { event: 'article/generate' }, // PRESERVED: Same event name
  async ({ event, step }: any) => {
    const { articleId } = event.data
    const supabase = createServiceRoleClient()

    /* -------------------------------------------------- */
    /* Load article                                      */
    /* -------------------------------------------------- */

    const article = await step.run('load-article', async () => {
      const { data, error } = await supabase
        .from('articles' as any)
        .select('id, org_id, status')
        .eq('id', articleId)
        .limit(1)

      if (error) {
        console.error('Article query error:', error)
        throw error
      }

      const row = data?.[0]
      if (!row) {
        console.error('❌❌❌ [Worker] Article NOT FOUND in database:', articleId)
        throw new Error(`Article ${articleId} not found`)
      }

      // Type guard to ensure we have the expected data structure
      const articleData = row as unknown as { id: string; org_id: string; status: string }

      // 🔴 PRODUCTION HARDENING: Idempotency against duplicate events
      // 🚨 AUDIT FIX: Adding 'failed' to terminal states to prevent retry loops
      if (articleData.status === 'completed' || articleData.status === 'failed') {
        return { skipped: true }
      }

      // 🔴 STRUCTURAL CORRECTION: The API now owns the 'queued' -> 'generating' transition.
      // We must assert that the article is already in the 'generating' state.
      if (articleData.status !== 'generating') {
        throw new Error(`Invalid article state: ${articleData.status}. Expected 'generating'.`)
      }

      return articleData
    })

    if ((article as any).skipped) return { success: true, skipped: true }

    /* -------------------------------------------------- */
    /* Load organization context                         */
    /* -------------------------------------------------- */

    const organization = await step.run('load-organization', async () => {
      const orgId = (article as any).org_id

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, content_defaults')
        .eq('id', orgId)
        .limit(1)

      if (error) {
        console.error('Org query error:', error)
        throw error
      }

      const row = data?.[0]
      if (!row) {
        throw new Error(`Organization ${orgId} not found`)
      }

      return row
    })

    /* -------------------------------------------------- */
    /* Load sections                                     */
    /* -------------------------------------------------- */

    const sections = await step.run('load-sections', async () => {
      const { data, error } = await supabase
        .from('article_sections')
        .select('*')
        .eq('article_id', articleId)
        .order('section_order')

      if (error || !data) throw new Error('Failed to load sections')

      // 🔴 REQUIRED FIX 2: Explicit section ordering assertion
      const sectionsArray = data as unknown as ArticleSection[]
      sectionsArray.sort((a, b) => a.section_order - b.section_order)
      return sectionsArray
    })

    const completedSections: ArticleSection[] = []

    /* -------------------------------------------------- */
    /* Sequential section processing (B-4 CORE)          */
    /* -------------------------------------------------- */

    try {
      for (const section of sections) {
        if (section.status === 'completed') {
          completedSections.push(section)
          continue
        }

        try {
          // ---- Research (B-2) - SEQUENTIAL with exactly-once persistence
          const research = await step.run(
            `research-${section.section_order}`,
            async () => {
              await supabase
                .from('article_sections')
                .update({ status: 'researching' })
                .eq('id', section.id)

              // 🔴 REQUIRED FIX 3: Research persistence inside retry block
              const researchResult = await withRetries(async () =>
                runResearchAgent({
                  sectionHeader: section.section_header,
                  sectionType: section.section_type,
                  priorSections: completedSections, // B-4: Context accumulation
                  organizationContext: organization,
                })
              )

              // Convert to ResearchPayload format and persist immediately
              const researchPayload = {
                queries: researchResult.queries,
                results: researchResult.results,
                total_searches: researchResult.totalSearches,
                research_timestamp: new Date().toISOString(),
              } as ResearchPayload

              // Exactly-once persistence - inside retry block
              await supabase
                .from('article_sections')
                .update({
                  research_payload: researchPayload,
                  status: 'researched',
                })
                .eq('id', section.id)

              return researchPayload
            }
          )

          // ---- Writing (B-3) - SEQUENTIAL
          const content = await step.run(
            `write-${section.section_order}`,
            async () => {
              await supabase
                .from('article_sections')
                .update({ status: 'writing' })
                .eq('id', section.id)

              // Use organization content_defaults or fallback
              const organizationDefaults: ContentDefaults = (organization as any).content_defaults || {
                tone: 'professional',
                language: 'en',
                internal_links: true,
                global_instructions: '',
              }

              return await withRetries(async () =>
                runContentWritingAgent({
                  sectionHeader: section.section_header,
                  sectionType: section.section_type,
                  researchPayload: research, // B-4: Pass research from this section
                  priorSections: completedSections, // B-4: Context accumulation
                  organizationDefaults,
                })
              )
            }
          )

          await step.run(`persist-content-${section.section_order}`, async () => {
            await supabase
              .from('article_sections')
              .update({
                content_markdown: content.markdown,
                content_html: content.html,
                status: 'completed',
              })
              .eq('id', section.id)

            // 🔍 DIAGNOSTIC: Log section completion and current article status
            console.log(`[Worker] Section ${section.section_order} (${section.section_header}) completed for article ${articleId}`)

            // 🔍 DIAGNOSTIC: Add a small delay to help with observability in logs
            await new Promise(resolve => setTimeout(resolve, 500));
          })

          // B-4: Add completed section to context for next sections
          completedSections.push({
            ...section,
            content_markdown: content.markdown,
            status: 'completed',
          } as ArticleSection)

        } catch (sectionError) {
          // B-4: Stop pipeline on section failure
          await step.run(`fail-section-${section.section_order}`, async () => {
            await supabase
              .from('article_sections')
              .update({
                status: 'failed',
                error_details: {
                  message: sectionError instanceof Error ? sectionError.message : String(sectionError),
                  failed_at: new Date().toISOString(),
                },
              })
              .eq('id', section.id)
          })

          throw new Error(`Sequential processing stopped: Section ${section.section_order} failed - ${sectionError instanceof Error ? sectionError.message : String(sectionError)}`)
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
          organizationId: (article as any).org_id
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
