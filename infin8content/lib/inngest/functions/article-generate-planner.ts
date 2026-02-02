/**
 * Inngest Handler: Article Generate Planner
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * Orchestrates Planner Agent → Compiler → Database persistence.
 * Event: article.generate.planner
 * 
 * Responsibilities:
 * 1. Load article + context from database
 * 2. Call runPlannerAgent() with structured input
 * 3. Pass output to compilePlannerOutput()
 * 4. Persist compiled output to articles.article_structure
 * 5. Update article status to 'planned'
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { runPlannerAgent, type PlannerInput } from '@/lib/agents/planner-agent'
import { compilePlannerOutput } from '@/lib/agents/planner-compiler'

/**
 * Article Planner Event Data
 */
interface ArticlePlannerEventData {
  article_id: string
  workflow_id: string
  organization_id: string
  keyword: string
  subtopics: Array<{
    title: string
    type: string
    keywords: string[]
  }>
  icp_context?: {
    document?: string
  }
  cluster_info?: {
    hub_keyword_id?: string
    similarity_score?: number
  }
}

/**
 * Article Planner Inngest Function
 */
export const articleGeneratePlanner = inngest.createFunction(
  {
    id: 'article/generate-planner',
    concurrency: { limit: 5 },
  },
  { event: 'article.generate.planner' },
  async ({ event, step }: any) => {
    const eventData = event.data as ArticlePlannerEventData
    const { article_id, workflow_id, organization_id, keyword, subtopics, icp_context, cluster_info } = eventData

    console.log('[ArticlePlanner] Function invoked', {
      article_id,
      workflow_id,
      keyword,
      subtopics: subtopics.length,
    })

    const supabase = await createServiceRoleClient()

    try {
      // Step 1: Load article from database
      const article = await step.run('load-article', async () => {
        console.log('[ArticlePlanner] Step: load-article - Loading article', { article_id })

        const { data, error } = await supabase
          .from('articles')
          .select('id, keyword, status, subtopic_data, icp_context')
          .eq('id', article_id)
          .single()

        if (error || !data) {
          const errorMsg = error?.message || 'Article not found'
          console.error('[ArticlePlanner] Step: load-article - ERROR:', errorMsg)
          throw new Error(`Failed to load article: ${errorMsg}`)
        }

        console.log('[ArticlePlanner] Step: load-article - Success: Article loaded')
        return data as any
      })

      // Step 2: Extract subtopic and build Planner input
      const plannerInput = await step.run('build-planner-input', async () => {
        console.log('[ArticlePlanner] Step: build-planner-input - Building input')

        // Extract first subtopic (primary focus)
        const subtopic = subtopics[0]
        if (!subtopic) {
          throw new Error('No subtopics provided')
        }

        // Parse ICP context
        let icpData = {
          pain_points: [] as string[],
          goals: [] as string[],
          challenges: [] as string[],
        }

        if (icp_context?.document) {
          try {
            // Try to parse ICP document as JSON
            const parsed = typeof icp_context.document === 'string' 
              ? JSON.parse(icp_context.document) 
              : icp_context.document
            
            icpData = {
              pain_points: parsed.pain_points || [],
              goals: parsed.goals || [],
              challenges: parsed.challenges || [],
            }
          } catch {
            // If parsing fails, use defaults
            console.warn('[ArticlePlanner] Step: build-planner-input - Failed to parse ICP document, using defaults')
          }
        }

        const input: PlannerInput = {
          subtopic: {
            title: subtopic.title,
            angle: subtopic.type,
          },
          keyword,
          content_style: 'informative', // Default to informative
          icp: icpData,
        }

        console.log('[ArticlePlanner] Step: build-planner-input - Success: Input built')
        return input
      })

      // Step 3: Run Planner Agent
      const plannerOutput = await step.run('run-planner-agent', async () => {
        console.log('[ArticlePlanner] Step: run-planner-agent - Calling Planner Agent')

        try {
          const output = await runPlannerAgent(plannerInput)
          console.log('[ArticlePlanner] Step: run-planner-agent - Success: Planner output generated')
          return output
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error('[ArticlePlanner] Step: run-planner-agent - ERROR:', errorMsg)
          throw new Error(`Planner Agent failed: ${errorMsg}`)
        }
      })

      // Step 4: Compile Planner Output
      const compiledOutput = await step.run('compile-planner-output', async () => {
        console.log('[ArticlePlanner] Step: compile-planner-output - Compiling output')

        try {
          const compiled = compilePlannerOutput(plannerOutput)
          console.log('[ArticlePlanner] Step: compile-planner-output - Success: Output compiled')
          return compiled
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error('[ArticlePlanner] Step: compile-planner-output - ERROR:', errorMsg)
          throw new Error(`Compiler failed: ${errorMsg}`)
        }
      })

      // Step 5: Persist to Database
      await step.run('persist-to-database', async () => {
        console.log('[ArticlePlanner] Step: persist-to-database - Persisting compiled output')

        const { error: updateError } = await supabase
          .from('articles')
          .update({
            article_structure: compiledOutput,
            status: 'planned',
            updated_at: new Date().toISOString(),
          })
          .eq('id', article_id)

        if (updateError) {
          const errorMsg = updateError.message
          console.error('[ArticlePlanner] Step: persist-to-database - ERROR:', errorMsg)
          throw new Error(`Failed to persist article structure: ${errorMsg}`)
        }

        console.log('[ArticlePlanner] Step: persist-to-database - Success: Article structure persisted')
      })

      console.log('[ArticlePlanner] Article planning completed successfully', {
        article_id,
        sections: compiledOutput.article_structure.length,
      })

      return {
        success: true,
        article_id,
        sections: compiledOutput.article_structure.length,
        status: 'planned',
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[ArticlePlanner] Article planning FAILED', {
        article_id,
        error: errorMsg,
      })

      // Mark article as failed
      await step.run('handle-error', async () => {
        console.log('[ArticlePlanner] Step: handle-error - Marking article as planner_failed')

        const { error: updateError } = await supabase
          .from('articles')
          .update({
            status: 'planner_failed',
            error_details: {
              error_message: errorMsg,
              failed_at: new Date().toISOString(),
              stage: 'planner',
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', article_id)

        if (updateError) {
          console.error('[ArticlePlanner] Step: handle-error - Failed to update article status:', updateError.message)
        } else {
          console.log('[ArticlePlanner] Step: handle-error - Article marked as planner_failed')
        }
      })

      // Rethrow to trigger Inngest retry
      throw error
    }
  }
)
