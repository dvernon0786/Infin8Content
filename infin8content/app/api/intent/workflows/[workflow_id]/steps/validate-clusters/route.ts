/**
 * Cluster Validation API Endpoint
 * Story 36.3: Validate Cluster Coherence and Structure
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/validate-clusters
 * Validates hub-and-spoke keyword clusters for structural correctness and semantic coherence
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'

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
    if (currentState !== 'step_7_validation') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: currentState,
        cached: true
      })
    }

    // 4️⃣ STRICT FSM GUARD
    // For validation, we need to check if transition is allowed
    // Use internal FSM for validation since unified engine doesn't export canTransition
    const { InternalWorkflowFSM } = await import('@/lib/fsm/fsm.internal')
    if (!InternalWorkflowFSM.canTransition(currentState as any, 'VALIDATION_START')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_7_validation. Current state: ${currentState}` 
        },
        { status: 409 }
      )
    }

    // Log audit action
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_CLUSTER_VALIDATION_STARTED,
      details: {
        workflow_id: workflowId,
        current_state: currentState
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // 5️⃣ UNIFIED TRANSITION (async trigger)
    // This automatically emits the required event
    const result = await transitionWithAutomation(workflowId, 'VALIDATION_START', userId)
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to advance workflow',
          message: result.error || 'Unknown error'
        },
        { status: 500 }
      )
    }

    // 6️⃣ RETURN IMMEDIATE 202 ACCEPTED
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: 'step_7_validation', // Still in idle until worker processes
      status: 'triggered',
      message: 'Cluster validation triggered. Check workflow state for progress.'
    }, { status: 202 })

  } catch (error) {
    console.error('Cluster validation failed:', error)

    // Log error audit action
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_CLUSTER_VALIDATION_FAILED,
        details: {
          workflow_id: workflowId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    }

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Workflow not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Cluster validation failed' },
      { status: 500 }
    )
  }
}
