/**
 * Cancel Workflow API Endpoint
 * MVP Implementation - Clean, safe, fail-closed cancellation
 * 
 * POST /api/intent/workflows/[workflow_id]/cancel
 * 
 * Cancels a running workflow by setting it to 'failed' status
 * Records audit trail and prevents resumption
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { logIntentActionAsync } from '@/lib/services/intent-engine/intent-audit-logger'
import { AuditAction } from '@/types/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  const { workflow_id } = await params
  const workflowId = workflow_id
  let organizationId: string | undefined

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

    // Check user role (only owner/admin can cancel)
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    // Verify workflow exists and belongs to user's organization
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, status, organization_id, name')
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
    const typedWorkflow = workflow as unknown as { 
      id: string; 
      status: string; 
      organization_id: string;
      name: string;
    }

    // Validate workflow can be cancelled (not already terminal)
    if (typedWorkflow.status === 'completed' || typedWorkflow.status === 'failed') {
      return NextResponse.json(
        { 
          error: 'Cannot cancel workflow',
          message: `Workflow is already ${typedWorkflow.status}`
        },
        { status: 400 }
      )
    }

    // Store previous status for audit
    const previousStatus = typedWorkflow.status

    // Cancel the workflow - set to failed with cancellation metadata
    const { error: updateError } = await supabase
      .from('intent_workflows')
      .update({
        status: 'failed',
        cancelled_at: new Date().toISOString(),
        cancelled_by: currentUser.id,
        workflow_data: {
          cancel_reason: 'cancelled_by_user',
          cancelled_at: new Date().toISOString(),
          cancelled_by: currentUser.id,
          previous_status: previousStatus
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .eq('status', typedWorkflow.status) // Ensure idempotent - only if still same status

    if (updateError) {
      console.error('Failed to cancel workflow:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel workflow' },
        { status: 500 }
      )
    }

    // Log the cancellation action
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: currentUser.id,
        action: AuditAction.WORKFLOW_CANCELLED,
        details: {
          workflow_id: workflowId,
          workflow_name: typedWorkflow.name,
          previous_status: previousStatus,
          new_status: 'failed'
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow cancellation:', logError)
      // Don't fail the request if logging fails
    }

    // Log the Intent audit trail entry (Story 37.4)
    try {
      logIntentActionAsync({
        organizationId: organizationId,
        workflowId: workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: currentUser.id,
        action: AuditAction.WORKFLOW_CANCELLED,
        details: {
          workflow_name: typedWorkflow.name,
          previous_status: previousStatus,
          cancel_reason: 'cancelled_by_user',
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (intentLogError) {
      console.error('Failed to log intent audit entry:', intentLogError)
      // Don't fail the request if intent logging fails
    }

    console.log(`[Workflow-Cancel] Workflow ${workflowId} cancelled by user ${currentUser.id}`)

    return NextResponse.json({
      success: true,
      status: 'failed',
      workflow_id: workflowId,
      cancelled_at: new Date().toISOString(),
      cancelled_by: currentUser.id
    })

  } catch (error) {
    console.error(`[Workflow-Cancel] Error cancelling workflow ${workflowId}:`, error)
    return NextResponse.json(
      {
        error: 'Failed to cancel workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
