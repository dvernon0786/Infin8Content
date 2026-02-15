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
import { advanceWorkflow, WorkflowTransitionError } from '@/lib/services/workflow/advanceWorkflow'
import { WorkflowState } from '@/types/workflow-state'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  expandSeedKeywordsToLongtails,
  type ExpansionSummary
} from '@/lib/services/intent-engine/longtail-keyword-expander'
import { enforceICPGate, enforceSeedApprovalGate } from '@/lib/middleware/intent-engine-gate'

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
    const icpGateResponse = await enforceICPGate(workflowId, 'longtail-expand')
    if (icpGateResponse) {
      return icpGateResponse
    }

    // ENFORCE SEED APPROVAL GATE - Check if seed keywords are approved before proceeding
    const seedGateResponse = await enforceSeedApprovalGate(workflowId, 'longtail-expand')
    if (seedGateResponse) {
      return seedGateResponse
    }

    // Verify workflow exists and belongs to user's organization
    const supabase = createServiceRoleClient()
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, state, organization_id')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single() as { data: { id: string; state: WorkflowState; organization_id: string } | null, error: any }

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // FSM GUARD: Only allow longtail expansion when in step_4_longtails state
    if (workflow.state !== WorkflowState.step_4_longtails) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_4_longtails state. Current state: ${workflow.state}` 
        },
        { status: 400 }
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
          current_state: workflow.state
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow start:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[LongtailExpand] Starting long-tail expansion for workflow ${workflowId}`)

    // Execute long-tail keyword expansion
    const startTime = Date.now()
    const expansionResult = await expandSeedKeywordsToLongtails(workflowId)
    const duration = Date.now() - startTime

    console.log(`[LongtailExpand] Completed expansion in ${duration}ms`)

    // Validate completion within 5 minutes (300,000ms)
    if (duration > 300000) {
      console.warn(`[LongtailExpand] Expansion exceeded 5-minute timeout: ${duration}ms`)
      // Don't fail the request, but log the warning
    }

    // Advance workflow state - ONLY mutation point
    try {
      await advanceWorkflow({
        workflowId,
        organizationId,
        expectedState: WorkflowState.step_4_longtails,
        nextState: WorkflowState.step_5_filtering
      })
    } catch (error: any) {
      if (error instanceof WorkflowTransitionError) {
        console.error(`[LongtailExpand] Workflow transition failed: ${error.message}`)
        return NextResponse.json(
          { error: 'Workflow transition failed', details: error.message },
          { status: 409 }
        )
      }
      throw error
    }

    // Log completion
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_LONGTAIL_KEYWORDS_COMPLETED,
        details: {
          workflow_id: workflowId,
          seeds_processed: expansionResult.seeds_processed,
          longtails_created: expansionResult.total_longtails_created,
          duration_ms: duration
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow completion:', logError)
      // Continue anyway - logging is non-blocking
    }

    // Emit analytics event
    emitAnalyticsEvent({
      event_type: 'longtail_expansion_completed',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      workflow_id: workflowId,
      seeds_processed: expansionResult.seeds_processed,
      longtails_created: expansionResult.total_longtails_created,
      duration_ms: duration,
      sources: ['related', 'suggestions', 'ideas', 'autocomplete']
    })

    // Return success response
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      previous_state: WorkflowState.step_4_longtails,
      new_state: WorkflowState.step_5_filtering,
      data: {
        seeds_processed: expansionResult.seeds_processed,
        longtails_created: expansionResult.total_longtails_created
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

      // Log Intent audit trail entry (Story 37.4)
      try {
        logIntentActionAsync({
          organizationId,
          workflowId,
          entityType: 'workflow',
          entityId: workflowId,
          actorId: userId,
          action: AuditAction.WORKFLOW_STEP_FAILED,
          details: {
            step: 'step_4_longtails',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
      } catch (intentLogError) {
        console.error('Failed to log intent audit entry:', intentLogError)
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
