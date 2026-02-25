/**
 * Article Queuing Processor Service - FSM Hardened Version
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * Queues approved subtopics for article generation using ONLY FSM transitions.
 * Never directly mutates intent_workflows table.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'
import { WorkflowState } from '@/lib/fsm/workflow-events'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'
import { AuditAction } from '@/types/audit'

export interface ApprovedKeyword {
  id: string
  keyword: string
  subtopics: Array<{
    title: string
    type: string
    keywords: string[]
  }>
}

export interface WorkflowContext {
  id: string
  organization_id: string
  icp_document?: string
  competitor_urls?: string[]
  state: string
}

export interface ArticleQueueingResult {
  workflow_id: string
  articles_created: number
  articles: Array<{
    id: string
    keyword: string
    status: string
  }>
  workflow_state: WorkflowState
  message: string
}

/**
 * Queue approved keywords for article generation using ONLY unified engine.
 * 
 * This function NEVER directly mutates intent_workflows table.
 * All state changes go through transitionWithAutomation().
 */
export async function queueArticlesForWorkflow(
  workflowId: string
): Promise<ArticleQueueingResult> {
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  // Note: In worker context, we don't validate user session
  // Organization isolation is handled by RLS policies with service role
  // FSM guard is handled by guardAndStart() in worker, not here

  const supabase = createServiceRoleClient()

  // Read workflow state - READ ONLY
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id')
    .eq('id', workflowId)
    .limit(1)

  if (workflowResult.error || !workflowResult.data || workflowResult.data.length === 0) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data[0] as unknown as {
    id: string
    state: string
    organization_id: string
  }

  // Note: In worker context, organization isolation is handled by RLS policies
  // No user session validation needed in background workers

  // Fetch approved keywords ready for article queueing
  const keywordsResult = await supabase
    .from('keywords')
    .select('id, keyword, subtopics')
    .eq('workflow_id', workflowId)
    .eq('article_status', 'not_started')

  if (keywordsResult.error) {
    throw new Error(`Failed to fetch approved keywords: ${keywordsResult.error.message}`)
  }

  const keywords = (keywordsResult.data || []) as unknown as Array<{
    id: string
    keyword: string
    subtopics: any
  }>

  if (!keywords || keywords.length === 0) {
    throw new Error('No approved keywords available for article generation')
  }

  let queuedCount = 0
  const createdArticles: Array<{ id: string; keyword: string; status: string }> = []

  // Queue each approved keyword for article generation
  for (const keyword of keywords) {
    try {
      // Create article record
      const articleResult = await supabase
        .from('articles')
        .insert({
          intent_workflow_id: workflowId,
          org_id: workflow.organization_id,
          keyword: keyword.keyword,
          subtopic_data: keyword.subtopics, // Mapped 'subtopics' to 'subtopic_data'
          target_word_count: 2000,
          status: 'generating',
          created_by: SYSTEM_USER_ID, // Worker context - system actor
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, keyword, status')
        .limit(1)

      const article = articleResult.data?.[0]
      const articleError = articleResult.error

      if (articleError) {
        console.error(`Failed to create article for keyword "${keyword.keyword}":`, articleError)
        continue
      }

      if (article) {
        const typedArticle = article as unknown as { id: string; keyword: string; status: string }

        // 🟠 PRODUCTION HARDENING: Create article sections before generation
        // Each subtopic becomes an article section that the worker can process
        const subtopicArray = (keyword.subtopics || []) as any[]
        const VALID_SECTION_TYPES = ['introduction', 'h2', 'h3', 'conclusion', 'faq']

        if (subtopicArray.length > 0) {
          const sectionRows = subtopicArray.map((subtopic, index) => {
            const sectionType = VALID_SECTION_TYPES.includes(subtopic.type?.toLowerCase())
              ? subtopic.type.toLowerCase()
              : 'h2'

            return {
              article_id: typedArticle.id,
              section_order: index + 1,
              section_header: subtopic.title,
              section_type: sectionType,
              status: 'pending',
              planner_payload: {
                section_header: subtopic.title,
                section_type: sectionType,
                instructions: `Write a high-quality ${sectionType} section about "${subtopic.title}". Include coverage for the following keywords: ${(subtopic.keywords || []).join(', ')}. Maintain a professional tone and ensure technical accuracy.`,
                context_requirements: subtopic.keywords || [],
                estimated_words: 500
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })

          const { error: sectionError } = await supabase
            .from('article_sections')
            .insert(sectionRows)

          if (sectionError) {
            console.error(`Failed to create sections for article ${typedArticle.id}:`, sectionError)
            // Rollback article insertion to prevent ghost articles with no sections
            console.log('[Queue] Rolling back article', typedArticle.id)
            await supabase.from('articles').delete().eq('id', typedArticle.id)
            continue
          }
          console.log('[Queue] Inserted sections count:', sectionRows.length, 'for article:', typedArticle.id)
        } else {
          console.warn(`No subtopics found for keyword "${keyword.keyword}", skipping article creation.`)
          await supabase.from('articles').delete().eq('id', typedArticle.id)
          continue
        }

        // Update keyword article_status to 'in_progress'
        const { error: updateError } = await supabase
          .from('keywords')
          .update({
            article_status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', keyword.id)
          .eq('article_status', 'not_started')

        if (updateError) {
          console.error(`Failed to update keyword status for "${keyword.keyword}":`, updateError)
          // Cleanup article if status update fails
          await supabase.from('articles').delete().eq('id', typedArticle.id)
          continue
        }

        createdArticles.push({
          id: typedArticle.id,
          keyword: typedArticle.keyword,
          status: typedArticle.status
        })
        console.log(`[QueueArticles] Successfully created article ${typedArticle.id} with sections for keyword "${keyword.keyword}"`)
        queuedCount++
      }
    } catch (error) {
      console.error(`Error processing keyword "${keyword.keyword}":`, error)
      continue
    }
  }

  let finalState: WorkflowState = workflow.state as WorkflowState
  let message: string

  // QUEUE LAYER: Only responsible for queuing articles, NOT completing workflow
  // Terminal completion is driven by the article generation pipeline via ProgressService
  message = `Queued ${queuedCount} of ${keywords.length} articles (${keywords.length - queuedCount} failed)`

  // Log audit action
  await logIntentAction({
    organizationId: workflow.organization_id,
    workflowId,
    entityType: 'workflow',
    entityId: workflowId,
    actorId: SYSTEM_USER_ID, // Worker context - system actor
    action: 'WORKFLOW_ARTICLE_QUEUING_COMPLETED' as any,
    details: {
      queued_articles: queuedCount,
      total_keywords: keywords.length,
      failed_articles: keywords.length - queuedCount
    },
  })

  return {
    workflow_id: workflowId,
    articles_created: queuedCount,
    articles: createdArticles,
    workflow_state: finalState,
    message
  }
}

/**
 * Get workflow context for article queuing - READ ONLY
 * 
 * This function NEVER mutates workflow state.
 */
export async function getWorkflowContext(workflowId: string): Promise<WorkflowContext> {
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  const supabase = createServiceRoleClient()

  // Read workflow details - READ ONLY (no auth required in worker context)
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id, icp_document, competitor_urls')
    .eq('id', workflowId)
    .limit(1)

  if (workflowResult.error || !workflowResult.data || workflowResult.data.length === 0) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data[0] as unknown as {
    id: string
    state: string
    organization_id: string
    icp_document: any
    competitor_urls: any
  }

  // Note: In worker context, we don't validate user session
  // Organization isolation is handled by RLS policies with service role

  return {
    id: workflow.id,
    organization_id: workflow.organization_id,
    state: workflow.state,
    icp_document: workflow.icp_document,
    competitor_urls: workflow.competitor_urls
  }
}
