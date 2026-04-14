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
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'
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
    const { InternalWorkflowFSM } = await import('@/lib/fsm/fsm.internal')
    if (!InternalWorkflowFSM.canTransition(currentState as any, 'LONGTAIL_START')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_4_longtails. Current state: ${currentState}`
        },
        { status: 409 }
      )
    }

    // 5️⃣ APPROVAL VALIDATION
    const { ApprovalGateValidator } = await import('@/lib/workflow/approval/approval-gate-validator')
    const { APPROVAL_THRESHOLDS } = await import('@/lib/constants/approval-thresholds')

    const approvalResult = await ApprovalGateValidator.countApproved(
      workflowId,
      'seeds',
      organizationId!
    )

    const requiredMinimum = APPROVAL_THRESHOLDS['seeds']

    if (approvalResult.approvedCount < requiredMinimum) {
      return NextResponse.json({
        error: 'APPROVAL_REQUIRED',
        entity_type: 'seeds',
        required_minimum: requiredMinimum,
        approved_count: approvalResult.approvedCount,
        remaining_needed: requiredMinimum - approvalResult.approvedCount,
        message: `Approve at least ${requiredMinimum} seed keyword(s) before proceeding.`
      }, { status: 409 })
    }

    // Log action start
    try {
      await logActionAsync({
        orgId: organizationId!,
        userId: userId!,
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
    }

    // 6️⃣ NON-BLOCKING TRIGGER
    const result = await transitionWithAutomation(workflowId, 'LONGTAIL_START', userId!)
    if (!result.success) {
      console.error(`[LongtailExpand] Failed to advance workflow:`, result.error)
    }

    // 7️⃣ RETURN IMMEDIATE 202 ACCEPTED
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: 'step_4_longtails',
      status: 'triggered',
      message: 'Long-tail expansion triggered. Check workflow state for progress.'
    }, { status: 202 })

  } catch (error) {
    console.error('[LongtailExpand] Expansion failed:', error)

    if (organizationId && userId) {
      try {
        await logActionAsync({
          orgId: organizationId!,
          userId: userId!,
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

    if (error instanceof Error) {
      if (error.message.includes('No seed keywords found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'NO_SEED_KEYWORDS',
            message: 'No seed keywords found for expansion'
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Workflow not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'WORKFLOW_NOT_FOUND',
            message: 'Workflow not found'
          },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'SYSTEM_ERROR',
        message: 'Long-tail keyword expansion failed due to a system error'
      },
      { status: 500 }
    )
  }
}
