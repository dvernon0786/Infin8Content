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
  queueArticlesForWorkflow,
  type ArticleQueueingResult
} from '@/lib/services/intent-engine/article-queuing-processor'
import { enforceICPGate, enforceSubtopicApprovalGate } from '@/lib/middleware/intent-engine-gate'

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

    // ENFORCE ICP GATE - Check if ICP is complete before proceeding
    const gateResponse = await enforceICPGate(workflowId, 'queue-articles')
    if (gateResponse) {
      return gateResponse
    }

    // ENFORCE SUBTOPIC APPROVAL GATE - Check if subtopics are approved before proceeding
    const subtopicGateResponse = await enforceSubtopicApprovalGate(workflowId, 'queue-articles')
    if (subtopicGateResponse) {
      return subtopicGateResponse
    }

    // Verify workflow exists and belongs to user's organization
    const supabase = await createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // FSM GUARD: Only allow step_9_articles for article queuing
    const typedWorkflow = workflow as unknown as { id: string; state: string; organization_id: string }
    
    // IDEMPOTENCY CASE: Already completed
    if (typedWorkflow.state === 'completed') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: typedWorkflow.state,
        cached: true,
        message: 'Workflow already completed'
      })
    }
    
    if (typedWorkflow.state !== 'step_9_articles') {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be at step_9_articles. Current state: ${typedWorkflow.state}`
        },
        { status: 409 }
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
          workflow_state: typedWorkflow.state
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
    const queueingResult = await queueArticlesForWorkflow(workflowId)
    const duration = Date.now() - startTime

    console.log(`[QueueArticles] Completed queuing in ${duration}ms`)

    // QUEUE LAYER: Only responsible for queuing articles at step 9
    // Terminal completion is driven by the article generation pipeline, not here
    // Verify articles were successfully queued
    if (queueingResult.articles_created === 0) {
      return NextResponse.json(
        {
          error: 'NO_ARTICLES_QUEUED',
          message: 'Cannot proceed with step 9 - no articles were queued for generation'
        },
        { status: 400 }
      )
    }

    // Log completion
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_ARTICLE_QUEUING_COMPLETED,
        details: {
          workflow_id: workflowId,
          articles_created: queueingResult.articles_created,
          workflow_state: queueingResult.workflow_state,
          message: queueingResult.message,
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
        workflow_state: queueingResult.workflow_state,
        articles_created: queueingResult.articles_created,
        articles: queueingResult.articles,
        message: queueingResult.message,
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
