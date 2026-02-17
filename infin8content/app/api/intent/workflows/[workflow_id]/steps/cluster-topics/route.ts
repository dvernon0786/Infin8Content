/**
 * Topic Clustering API Endpoint
 * Story 36.2: Cluster Keywords into Hub-and-Spoke Structure
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/cluster-topics
 * Triggers semantic clustering of filtered keywords into hub-and-spoke topic model
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { inngest } from '@/lib/inngest/client'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'

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
    if (currentState !== 'step_6_clustering') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: currentState,
        cached: true
      })
    }

    // 4️⃣ STRICT FSM GUARD
    if (!WorkflowFSM.canTransition(currentState as any, 'CLUSTERING_START')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_6_clustering. Current state: ${currentState}` 
        },
        { status: 409 }
      )
    }

    // Log audit action
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_TOPIC_CLUSTERING_STARTED,
      details: {
        workflow_id: workflowId,
        current_state: currentState
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // 5️⃣ INNGEST EVENT DISPATCH (async trigger)
    // Worker will handle FSM transition via guardAndStart()
    await inngest.send({
      name: 'intent.step6.clustering',
      data: { workflowId }
    })

    // 6️⃣ RETURN IMMEDIATE 202 ACCEPTED
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: 'step_6_clustering', // Still in idle until worker processes
      status: 'triggered',
      message: 'Topic clustering triggered. Check workflow state for progress.'
    }, { status: 202 })

  } catch (error) {
    console.error('Topic clustering failed:', error)

    // Log error audit action
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_TOPIC_CLUSTERING_FAILED,
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
      { error: 'Topic clustering failed' },
      { status: 500 }
    )
  }
}
