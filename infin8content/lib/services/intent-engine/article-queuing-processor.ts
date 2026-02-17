/**
 * Article Queuing Processor Service - FSM Hardened Version
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * Queues approved subtopics for article generation using ONLY FSM transitions.
 * Never directly mutates intent_workflows table.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { WorkflowState } from '@/lib/fsm/workflow-events'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'

export interface ApprovedKeyword {
  id: string
  keyword: string
  subtopics: Array<{
    title: string
    type: string
    keywords: string[]
  }>
  cluster_info?: {
    hub_keyword_id?: string
    similarity_score?: number
  }
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
 * Queue approved keywords for article generation using ONLY FSM transitions
 * 
 * This function NEVER directly mutates intent_workflows table.
 * All state changes go through WorkflowFSM.transition().
 */
export async function queueArticlesForWorkflow(
  workflowId: string
): Promise<ArticleQueueingResult> {
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error('Authentication required')
  }

  const supabase = createServiceRoleClient()

  // Read workflow state - READ ONLY
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    state: string
    organization_id: string
  }

  // FSM GUARD: Only allow step_9_articles for article queuing
  if (workflow.state !== 'step_9_articles') {
    throw new Error(
      `Workflow must be at step_9_articles for article queuing, current state: ${workflow.state}` 
    )
  }

  // Validate user belongs to the same organization as the workflow
  if (workflow.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: workflow belongs to different organization')
  }

  // Fetch approved keywords ready for article queueing
  const keywordsResult = await supabase
    .from('keywords')
    .select('id, keyword, subtopics, cluster_info')
    .eq('workflow_id', workflowId)
    .eq('article_status', 'ready')

  if (keywordsResult.error) {
    throw new Error('Failed to fetch approved keywords')
  }

  const keywords = (keywordsResult.data || []) as unknown as Array<{
    id: string
    keyword: string
    subtopics: any
    cluster_info: any
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
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .insert({
          keyword_id: keyword.id,
          workflow_id: workflowId,
          organization_id: workflow.organization_id,
          keyword: keyword.keyword,
          subtopics: keyword.subtopics,
          cluster_info: keyword.cluster_info,
          status: 'queued',
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, keyword, status')
        .single()

      if (articleError) {
        console.error(`Failed to create article for keyword "${keyword.keyword}":`, articleError)
        continue
      }

      if (article) {
        const typedArticle = article as unknown as { id: string; keyword: string; status: string }
        // Update keyword article_status to 'queued'
        const { error: updateError } = await supabase
          .from('keywords')
          .update({
            article_status: 'queued',
            updated_at: new Date().toISOString()
          })
          .eq('id', keyword.id)
          .eq('article_status', 'ready')

        if (updateError) {
          console.error(`Failed to update keyword status for "${keyword.keyword}":`, updateError)
          continue
        }

        createdArticles.push({
          id: typedArticle.id,
          keyword: typedArticle.keyword,
          status: typedArticle.status
        })
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
    actorId: currentUser.id,
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

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error('Authentication required')
  }

  const supabase = createServiceRoleClient()

  // Read workflow details - READ ONLY
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id, icp_document, competitor_urls')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    state: string
    organization_id: string
    icp_document: any
    competitor_urls: any
  }

  // Validate user belongs to the same organization as the workflow
  if (workflow.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: workflow belongs to different organization')
  }

  return {
    id: workflow.id,
    organization_id: workflow.organization_id,
    icp_document: workflow.icp_document,
    competitor_urls: workflow.competitor_urls,
    state: workflow.state
  }
}
