/**
 * Article-Workflow Linker Service
 * Story 38.3: Link Generated Articles to Intent Workflow
 * 
 * Establishes bidirectional links between generated articles and their originating intent workflow.
 * Maintains workflow state integrity and provides comprehensive audit trails.
 * Processes articles in batches for performance with idempotent design.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logIntentAction } from './intent-audit-logger'
import { AuditAction } from '@/types/audit'

export interface LinkingResult {
  workflow_id: string
  linking_status: 'in_progress' | 'completed' | 'completed_with_failures' | 'failed'
  total_articles: number
  linked_articles: number
  already_linked: number
  failed_articles: number
  workflow_status: string
  processing_time_seconds: number
  details: {
    linked_article_ids: string[]
    failed_article_ids: string[]
    skipped_article_ids: string[]
  }
}

export interface ArticleLinkingData {
  id: string
  intent_workflow_id: string
  subtopic_id?: string
  status: string
  workflow_link_status: string
  linked_at?: string | null
}

export interface WorkflowLinkingCounts {
  total: number
  linked: number
  already_linked: number
  failed: number
}

/**
 * Validates that the user has access to the specified workflow
 */
export async function validateWorkflowAccess(
  userId: string,
  workflowId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  try {
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('organization_id')
      .eq('id', workflowId)
      .single() as any

    if (workflowError || !workflow) {
      return false
    }

    // Get user's organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('auth_user_id', userId)
      .single() as any

    if (userError || !user || user.org_id !== workflow.organization_id) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating workflow access:', error)
    return false
  }
}

/**
 * Validates that the workflow is ready for article linking
 */
export async function validateWorkflowForLinking(workflowId: string): Promise<{
  valid: boolean
  workflow?: any
  error?: string
}> {
  const supabase = createServiceRoleClient()
  
  try {
    const { data: workflow, error } = await supabase
      .from('intent_workflows')
      .select('*')
      .eq('id', workflowId)
      .single() as any

    if (error || !workflow) {
      return { valid: false, error: 'Workflow not found' }
    }

    // Workflow must be at step_9_articles (articles generation phase)
    if (workflow.status !== 'step_9_articles') {
      return { 
        valid: false, 
        error: `Workflow must be at step_9_articles state, current state: ${workflow.status}` 
      }
    }

    return { valid: true, workflow }
  } catch (error) {
    console.error('Error validating workflow for linking:', error)
    return { valid: false, error: 'Failed to validate workflow' }
  }
}

/**
 * Gets completed articles that are ready for linking
 */
export async function getCompletedArticlesForWorkflow(workflowId: string): Promise<ArticleLinkingData[]> {
  const supabase = createServiceRoleClient()
  
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, intent_workflow_id, subtopic_id, status, workflow_link_status, linked_at')
      .eq('intent_workflow_id', workflowId)
      .in('status', ['completed', 'published'])
      .eq('workflow_link_status', 'not_linked')
      .order('created_at', { ascending: false }) as any

    if (error) {
      console.error('Error fetching completed articles:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getCompletedArticlesForWorkflow:', error)
    throw error
  }
}

/**
 * Links a single article to the workflow
 */
export async function linkSingleArticle(
  articleId: string, 
  workflowId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean, error?: string }> {
  const supabase = createServiceRoleClient()
  
  try {
    // Mark as linking first
    const { error: updateError } = await supabase
      .from('articles')
      .update({ 
        workflow_link_status: 'linking',
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId)
      .eq('workflow_link_status', 'not_linked') as any

    if (updateError) {
      throw updateError
    }

    // Complete the linking
    const { error: finalError } = await supabase
      .from('articles')
      .update({ 
        workflow_link_status: 'linked',
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId)
      .eq('workflow_link_status', 'linking') as any

    if (finalError) {
      throw finalError
    }

    // Log successful linking
    await logIntentAction({
      organizationId,
      workflowId,
      entityType: 'article',
      entityId: articleId,
      actorId: userId,
      action: AuditAction.WORKFLOW_ARTICLE_LINKED,
      details: { linking_result: 'success' },
    })

    return { success: true }
  } catch (error) {
    console.error(`Error linking article ${articleId}:`, error)
    
    // Mark as failed
    try {
      await supabase
        .from('articles')
        .update({ 
          workflow_link_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId) as any
    } catch (markError) {
      console.error('Error marking article as failed:', markError)
    }

    // Log failed linking
    await logIntentAction({
      organizationId,
      workflowId,
      entityType: 'article',
      entityId: articleId,
      actorId: userId,
      action: AuditAction.WORKFLOW_ARTICLE_LINK_FAILED,
      details: { 
        linking_result: 'failed',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      },
    })

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Updates workflow link counts and status
 */
export async function updateWorkflowLinkCounts(
  workflowId: string, 
  counts: WorkflowLinkingCounts,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    const updateData: any = {
      article_link_count: counts.linked,
      updated_at: new Date().toISOString()
    }

    // If linking is complete, update status and completion timestamp
    if (counts.linked > 0 && counts.failed === 0 && counts.already_linked === 0) {
      updateData.status = 'step_10_completed'
      updateData.article_linking_completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('intent_workflows')
      .update(updateData)
      .eq('id', workflowId) as any

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating workflow link counts:', error)
    throw error
  }
}

/**
 * Main function to link articles to workflow
 */
export async function linkArticlesToWorkflow(
  workflowId: string,
  userId: string
): Promise<LinkingResult> {
  const startTime = Date.now()
  
  try {
    // Validate workflow state
    const { valid, workflow, error } = await validateWorkflowForLinking(workflowId)
    if (!valid || !workflow) {
      throw new Error(error || 'Workflow validation failed')
    }

    // Mark linking as started
    const supabase = createServiceRoleClient()
    await supabase
      .from('intent_workflows')
      .update({ 
        article_linking_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId) as any

    // Log linking start
    await logIntentAction({
      organizationId: workflow.organization_id,
      workflowId,
      entityType: 'workflow',
      entityId: workflowId,
      actorId: userId,
      action: AuditAction.WORKFLOW_ARTICLES_LINKING_STARTED,
      details: { total_articles_to_link: 'unknown' },
    })

    // Get articles ready for linking
    const articles = await getCompletedArticlesForWorkflow(workflowId)
    
    // Get already linked articles count
    const { data: alreadyLinkedData } = await supabase
      .from('articles')
      .select('id')
      .eq('intent_workflow_id', workflowId)
      .eq('workflow_link_status', 'linked') as any
    
    const alreadyLinkedCount = alreadyLinkedData?.length || 0

    const result: LinkingResult = {
      workflow_id: workflowId,
      linking_status: 'in_progress',
      total_articles: articles.length + alreadyLinkedCount,
      linked_articles: 0,
      already_linked: alreadyLinkedCount,
      failed_articles: 0,
      workflow_status: workflow.status,
      processing_time_seconds: 0,
      details: {
        linked_article_ids: [],
        failed_article_ids: [],
        skipped_article_ids: []
      }
    }

    // Process articles in batches of 10 (parallel within each batch)
    const batchSize = 10
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (article) => {
        const linkResult = await linkSingleArticle(article.id, workflowId, userId, workflow.organization_id)
        
        if (linkResult.success) {
          result.linked_articles++
          result.details.linked_article_ids.push(article.id)
        } else {
          result.failed_articles++
          result.details.failed_article_ids.push(article.id)
        }
        
        return linkResult
      })
      
      await Promise.all(batchPromises)
    }

    // Update workflow counts
    const counts: WorkflowLinkingCounts = {
      total: result.total_articles,
      linked: result.linked_articles,
      already_linked: result.already_linked,
      failed: result.failed_articles
    }
    
    await updateWorkflowLinkCounts(workflowId, counts, userId)

    // Get final workflow status
    const { data: finalWorkflow } = await supabase
      .from('intent_workflows')
      .select('status')
      .eq('id', workflowId)
      .single() as any

    result.workflow_status = finalWorkflow?.status || workflow.status
    result.linking_status = result.failed_articles > 0 ? 'completed_with_failures' : 'completed'
    result.processing_time_seconds = (Date.now() - startTime) / 1000

    // Log completion
    await logIntentAction({
      organizationId: workflow.organization_id,
      workflowId,
      entityType: 'workflow',
      entityId: workflowId,
      actorId: userId,
      action: AuditAction.WORKFLOW_ARTICLES_LINKING_COMPLETED,
      details: {
        total_articles: result.total_articles,
        linked_articles: result.linked_articles,
        failed_articles: result.failed_articles,
        processing_time_seconds: result.processing_time_seconds
      },
    })

    return result
  } catch (error) {
    console.error('Error in linkArticlesToWorkflow:', error)
    
    const processingTime = (Date.now() - startTime) / 1000
    
    // Log failure
    await logIntentAction({
      organizationId: '', // Will be filled if we can get workflow
      workflowId,
      entityType: 'workflow',
      entityId: workflowId,
      actorId: userId,
      action: AuditAction.WORKFLOW_ARTICLES_LINKING_FAILED,
      details: {
        error_details: error instanceof Error ? error.message : 'Unknown error',
        processing_time_seconds: processingTime
      },
    })

    throw error
  }
}
