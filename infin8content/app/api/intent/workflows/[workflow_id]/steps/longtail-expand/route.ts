/**
 * Long-Tail Keyword Expansion API Endpoint
 * Story 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model)
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/longtail-expand
 * Triggers long-tail keyword expansion for seed keywords in a workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { logIntentActionAsync } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  expandSeedKeywordsToLongtails,
  type ExpansionSummary
} from '@/lib/services/intent-engine/longtail-keyword-expander'

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

    // 1️⃣ AUTH: Already handled above
    
    // 2️⃣ FETCH WORKFLOW (READ ONLY)
    const supabase = createServiceRoleClient()
    const { data: workflow, error } = await supabase
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', currentUser.org_id)
      .single() as { data: { id: string; state: string; organization_id: string } | null; error: any }

    if (error || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const currentState = workflow.state

    // 3️⃣ IDEMPOTENCY CASE
    // If not exactly at this step — return success safely (future-proof)
    if (currentState !== 'step_4_longtails') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: currentState,
        cached: true
      })
    }

    // 4️⃣ STRICT FSM GUARD
    if (!WorkflowFSM.canTransition(currentState as any, 'LONGTAILS_COMPLETED')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_4_longtails. Current state: ${currentState}` 
        },
        { status: 409 }
      )
    }

    // Log action start
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_LONGTAIL_KEYWORDS_STARTED,
        details: {
          workflow_id: workflowId,
          workflow_status: workflow.state
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow start:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[LongtailExpand] Starting long-tail expansion for workflow ${workflowId}`)

    // 5️⃣ EXECUTE BUSINESS LOGIC
    const startTime = Date.now()
    const expansionResult = await expandSeedKeywordsToLongtails(workflowId, userId)
    const duration = Date.now() - startTime

    console.log(`[LongtailExpand] Completed expansion in ${duration}ms`)

    // Validate completion within 5 minutes (300,000ms)
    if (duration > 300000) {
      console.warn(`[LongtailExpand] Expansion exceeded 5-minute timeout: ${duration}ms`)
      // Don't fail the request, but log the warning
    }

    // 6️⃣ FSM TRANSITION (ONLY STATE CHANGE POINT)
    const nextState = await WorkflowFSM.transition(
      workflowId,
      'LONGTAILS_COMPLETED',
      { userId: currentUser.id }
    )

    // 7️⃣ RETURN AUTHORITATIVE NEXT STATE
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: nextState,
      data: {
        seeds_processed: expansionResult.seeds_processed,
        longtails_created: expansionResult.total_longtails_created,
        duration_ms: duration
      }
    })

  } catch (error) {
    console.error('[LongtailExpand] Expansion failed:', error)

    // Log error
    if (organizationId && userId) {
      try {
        await logActionAsync({
          orgId: organizationId,
          userId: userId,
          action: AuditAction.WORKFLOW_LONGTAIL_KEYWORDS_FAILED,
          details: {
            workflow_id: workflowId,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
      } catch (logError) {
        console.error('Failed to log workflow error:', logError)
      }
    }

    // Check if it's a validation error vs system error
    if (error instanceof Error) {
      if (error.message.includes('No seed keywords found')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No seed keywords found for expansion',
            message: 'Please ensure seed keywords have been extracted before expanding to long-tails'
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Workflow not found') || error.message.includes('Invalid workflow state')) {
        return NextResponse.json(
          { 
            success: false,
            error: error.message
          },
          { status: 400 }
        )
      }
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Long-tail keyword expansion failed. Please try again.'
      },
      { status: 500 }
    )
  }
}
