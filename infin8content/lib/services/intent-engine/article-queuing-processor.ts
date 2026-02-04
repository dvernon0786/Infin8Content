/**
 * Article Queuing Processor Service
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * Queues approved subtopics for article generation by:
 * 1. Reading approved keywords (article_status = 'ready')
 * 2. Creating article records with full intent context
 * 3. Triggering Planner Agent via Inngest
 * 4. Updating workflow status to step_9_articles
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { 
  RetryPolicy, 
  retryWithPolicy,
  classifyErrorType
} from './retry-utils'

export const ARTICLE_QUEUING_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 8000
}

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
  status: string
}

export interface ArticleQueueingResult {
  workflow_id: string
  articles_created: number
  articles: Array<{
    id: string
    keyword: string
    status: string
  }>
  errors: string[]
}

/**
 * Queue approved subtopics for article generation
 * 
 * @param workflowId - The workflow ID to queue articles for
 * @returns Result with created articles and any errors
 */
export async function queueApprovedSubtopicsForArticles(
  workflowId: string
): Promise<ArticleQueueingResult> {
  return retryWithPolicy(
    () => queueApprovedSubtopicsForArticlesImpl(workflowId),
    ARTICLE_QUEUING_RETRY_POLICY,
    'article-queuing'
  )
}

/**
 * Internal implementation of article queuing
 */
async function queueApprovedSubtopicsForArticlesImpl(
  workflowId: string
): Promise<ArticleQueueingResult> {
  const supabase = await createServiceRoleClient()
  const errors: string[] = []
  const createdArticles: Array<{ id: string; keyword: string; status: string }> = []

  try {
    // Fetch workflow context
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, organization_id, icp_document, competitor_urls, status')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const typedWorkflow = workflow as unknown as WorkflowContext

    // Validate workflow is at correct step
    if (typedWorkflow.status !== 'step_8_approval') {
      throw new Error(
        `Invalid workflow state: expected step_8_approval, got ${typedWorkflow.status}`
      )
    }

    // Fetch approved keywords (article_status = 'ready')
    const { data: approvedKeywords, error: keywordError } = await supabase
      .from('keywords')
      .select('id, keyword, subtopics, cluster_info')
      .eq('organization_id', typedWorkflow.organization_id)
      .eq('article_status', 'ready')
      .order('created_at', { ascending: true })

    if (keywordError) {
      throw new Error(`Failed to fetch approved keywords: ${keywordError.message}`)
    }

    if (!approvedKeywords || approvedKeywords.length === 0) {
      console.warn(`[ArticleQueuing] No approved keywords found for workflow ${workflowId}`)
      // Update workflow status even if no articles
      await updateWorkflowStatus(supabase, workflowId, 'step_9_articles')
      return {
        workflow_id: workflowId,
        articles_created: 0,
        articles: [],
        errors: []
      }
    }

    console.log(
      `[ArticleQueuing] Found ${approvedKeywords.length} approved keywords for workflow ${workflowId}`
    )

    // Validate article count limit
    if (approvedKeywords.length > 50) {
      throw new Error(
        `Too many approved keywords: ${approvedKeywords.length} exceeds limit of 50 articles per workflow`
      )
    }

    // Create articles for each approved keyword
    for (const keyword of approvedKeywords) {
      try {
        const typedKeyword = keyword as unknown as ApprovedKeyword

        // Check if article already exists (idempotency)
        const { data: existingArticle, error: existingError } = await supabase
          .from('articles')
          .select('id, keyword, status')
          .eq('intent_workflow_id', workflowId)
          .eq('keyword_id', typedKeyword.id)
          .single()

        if (existingArticle && !existingError) {
          const typedExisting = existingArticle as unknown as { id: string; keyword: string; status: string }
          console.log(
            `[ArticleQueuing] Article already exists for keyword "${typedKeyword.keyword}" (${typedExisting.id}), skipping`
          )
          createdArticles.push(typedExisting)
          continue
        }

        // Create article record
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .insert({
            keyword: typedKeyword.keyword,
            keyword_id: typedKeyword.id,
            intent_workflow_id: workflowId,
            organization_id: typedWorkflow.organization_id,
            status: 'queued',
            subtopic_data: typedKeyword.subtopics || [],
            cluster_info: typedKeyword.cluster_info || {},
            icp_context: typedWorkflow.icp_document ? { document: typedWorkflow.icp_document } : {},
            competitor_context: typedWorkflow.competitor_urls ? { urls: typedWorkflow.competitor_urls } : {},
            created_by: null, // Will be set by trigger if needed
            created_at: new Date().toISOString()
          })
          .select('id, keyword, status')
          .single()

        if (articleError || !article) {
          const errorMsg = `Failed to create article for keyword "${typedKeyword.keyword}": ${articleError?.message || 'Unknown error'}`
          console.error(`[ArticleQueuing] ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        const typedArticle = article as unknown as { id: string; keyword: string; status: string }

        console.log(
          `[ArticleQueuing] Created article ${typedArticle.id} for keyword "${typedKeyword.keyword}"`
        )

        // Trigger Planner Agent via Inngest (required - must succeed)
        let plannerTriggered = false
        try {
          await inngest.send({
            name: 'article.generate.planner',
            data: {
              article_id: typedArticle.id,
              workflow_id: workflowId,
              organization_id: typedWorkflow.organization_id,
              keyword: typedKeyword.keyword,
              subtopics: typedKeyword.subtopics || [],
              icp_context: typedWorkflow.icp_document ? { document: typedWorkflow.icp_document } : {},
              cluster_info: typedKeyword.cluster_info || {}
            }
          })
          console.log(`[ArticleQueuing] Triggered Planner Agent for article ${typedArticle.id}`)
          plannerTriggered = true
        } catch (inngestError) {
          const errorMsg = `Failed to trigger Planner Agent for article ${typedArticle.id}: ${inngestError instanceof Error ? inngestError.message : 'Unknown error'}`
          console.error(`[ArticleQueuing] ${errorMsg}`)
          errors.push(errorMsg)
          // Mark article as failed if Planner trigger fails
          await supabase
            .from('articles')
            .update({ status: 'planner_failed' })
            .eq('id', typedArticle.id)
          // Don't add to createdArticles - this is a failed article
          continue
        }

        // Only add to createdArticles if Planner was successfully triggered
        if (plannerTriggered) {
          createdArticles.push(typedArticle)
        }
      } catch (keywordError) {
        const errorMsg = `Error processing keyword: ${keywordError instanceof Error ? keywordError.message : 'Unknown error'}`
        console.error(`[ArticleQueuing] ${errorMsg}`)
        errors.push(errorMsg)
        // Continue with next keyword
      }
    }

    // Update workflow status to step_9_articles
    await updateWorkflowStatus(supabase, workflowId, 'step_9_articles')

    console.log(
      `[ArticleQueuing] Completed: ${createdArticles.length} articles created, ${errors.length} errors`
    )

    return {
      workflow_id: workflowId,
      articles_created: createdArticles.length,
      articles: createdArticles,
      errors
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[ArticleQueuing] Fatal error: ${errorMsg}`)
    throw error
  }
}

/**
 * Update workflow status
 */
async function updateWorkflowStatus(
  supabase: ReturnType<typeof createServiceRoleClient>,
  workflowId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('intent_workflows')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)

  if (error) {
    throw new Error(`Failed to update workflow status: ${error.message}`)
  }

  console.log(`[ArticleQueuing] Updated workflow ${workflowId} status to ${status}`)
}
