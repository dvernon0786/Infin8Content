import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { runResearchAgent } from '@/lib/services/article-generation/research-agent'
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent'
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
    concurrency: { limit: 5 }, // PRESERVED: Same concurrency limits
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
        .from('articles')
        .select('id, organization_id, status')
        .eq('id', articleId)
        .single()

      if (error || !data) throw new Error('Article not found')

      // Type guard to ensure we have the expected data structure
      const articleData = data as unknown as { id: string; organization_id: string; status: string }

      // 🔴 REQUIRED FIX 1: Prevent double execution
      if (['completed', 'failed', 'generating'].includes(articleData.status)) {
        return { skipped: true }
      }

      await supabase
        .from('articles')
        .update({ status: 'generating' })
        .eq('id', articleId)

      return articleData
    })

    if ((article as any).skipped) return { success: true, skipped: true }

    /* -------------------------------------------------- */
    /* Load organization context                         */
    /* -------------------------------------------------- */

    const organization = await step.run('load-organization', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, description, content_defaults')
        .eq('id', (article as any).organization_id)
        .single()

      if (error || !data) throw new Error('Organization not found')
      return data
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
    /* Emit pipeline started event                        */
    /* -------------------------------------------------- */

    await step.run('emit-pipeline-started', async () => {
      console.log(`[B-4] Pipeline started for article: ${articleId}`)
    })

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
      await supabase
        .from('articles')
        .update({ status: 'completed' })
        .eq('id', articleId)

      // CANONICAL COMPLETION: Check if all articles are done and mark workflow terminal
      // This is the deterministic moment where workflow completion is triggered
      const workflowId = (event.data as any).workflowId
      if (workflowId) {
        await checkAndCompleteWorkflow(supabase, workflowId)
      }
    })

    /* -------------------------------------------------- */
    /* Emit pipeline completed event                      */
    /* -------------------------------------------------- */

    await step.run('emit-pipeline-completed', async () => {
      console.log(`[B-4] Pipeline completed for article: ${articleId}`)
    })

    return { success: true, articleId }
  }
)

/**
 * Check if all articles for a workflow are completed and mark workflow as terminal
 * 
 * This function is called immediately after an article is marked completed.
 * It checks if all articles in the workflow have status = 'completed'.
 * If so, it transitions the workflow via FSM to completed state.
 * 
 * This is the canonical completion trigger for the workflow state machine.
 * Completion is only driven by the article generation pipeline via FSM transition.
 */
async function checkAndCompleteWorkflow(
  supabase: any,
  workflowId: string
): Promise<void> {
  try {
    // Import FSM for terminal authority
    const { WorkflowFSM } = await import('@/lib/fsm/workflow-fsm')
    
    // Fetch current workflow state (FSM state only)
    const { data: workflow } = await supabase
      .from('intent_workflows')
      .select('state')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      console.warn(`[WorkflowCompletion] Workflow not found: ${workflowId}`)
      return
    }

    // FSM GUARD: Only proceed if workflow is at step_9_articles
    if (workflow.state !== 'step_9_articles') {
      console.log(`[WorkflowCompletion] Workflow ${workflowId} not at step_9_articles (current: ${workflow.state}), skipping completion check`)
      return
    }

    // Check if all articles are completed
    const { data: incompleteArticles } = await supabase
      .from('articles')
      .select('id')
      .eq('intent_workflow_id', workflowId)
      .neq('status', 'completed')

    // If no incomplete articles, complete workflow via FSM transition
    if (!incompleteArticles || incompleteArticles.length === 0) {
      console.log(`[WorkflowCompletion] All articles completed for workflow ${workflowId}, completing via FSM`)

      // SINGLE TERMINAL AUTHORITY: FSM transition only
      await WorkflowFSM.transition(workflowId, 'WORKFLOW_COMPLETED', {
        userId: 'system'
      })
      
      console.log(`[WorkflowCompletion] Workflow ${workflowId} completed via FSM`)
    } else {
      console.log(`[WorkflowCompletion] Workflow ${workflowId} has ${incompleteArticles.length} incomplete articles, not completing yet`)
    }
  } catch (error) {
    console.error(`[WorkflowCompletion] Error checking workflow completion:`, error)
    // Non-blocking: completion check failure should not fail the article generation
  }
}
