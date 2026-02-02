/**
 * Queue Articles API Endpoint
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/queue-articles
 * Queues approved subtopics for article generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import {
  queueApprovedSubtopicsForArticles,
  type ArticleQueueingResult
} from '@/lib/services/intent-engine/article-queuing-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  const { workflow_id } = await params
  const workflowId = workflow_id
  let organizationId: string | undefined
  let userId: string | undefined

  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    organizationId = currentUser.org_id
    userId = currentUser.id

    // Verify workflow exists and belongs to user's organization
    const supabase = await createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, status, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Type assertion for workflow data
    const typedWorkflow = workflow as unknown as { id: string; status: string; organization_id: string }

    // Check if workflow is in correct state for article queuing
    if (typedWorkflow.status !== 'step_8_approval') {
      return NextResponse.json(
        {
          error: 'Invalid workflow state',
          message: `Workflow must be in step_8_approval state, currently in ${typedWorkflow.status}`
        },
        { status: 400 }
      )
    }

    // Log action start
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_ARTICLE_QUEUING_STARTED,
        details: {
          workflow_id: workflowId,
          workflow_status: typedWorkflow.status
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow start:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[QueueArticles] Starting article queuing for workflow ${workflowId}`)

    // Execute article queuing
    const startTime = Date.now()
    const queueingResult = await queueApprovedSubtopicsForArticles(workflowId)
    const duration = Date.now() - startTime

    console.log(`[QueueArticles] Completed queuing in ${duration}ms`)

    // Log completion
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_ARTICLE_QUEUING_COMPLETED,
        details: {
          workflow_id: workflowId,
          articles_created: queueingResult.articles_created,
          errors_count: queueingResult.errors.length,
          duration_ms: duration
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow completion:', logError)
      // Continue anyway - logging is non-blocking
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        workflow_id: workflowId,
        workflow_status: 'step_9_articles',
        articles_created: queueingResult.articles_created,
        articles: queueingResult.articles,
        errors: queueingResult.errors,
        duration_ms: duration
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[QueueArticles] Error: ${errorMessage}`)

    // Log error
    if (organizationId && userId) {
      try {
        await logActionAsync({
          orgId: organizationId,
          userId: userId,
          action: AuditAction.WORKFLOW_ARTICLE_QUEUING_FAILED,
          details: {
            workflow_id: workflowId,
            error: errorMessage
          },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
      } catch (logError) {
        console.error('Failed to log error:', logError)
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
