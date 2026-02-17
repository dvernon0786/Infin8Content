/**
 * Keyword Filter API Endpoint
 * Story 36.1: Filter Keywords for Quality and Relevance
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/filter-keywords
 * Triggers mechanical filtering of long-tail keywords for quality and relevance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  filterKeywords,
  getOrganizationFilterSettings,
  type FilterResult
} from '@/lib/services/intent-engine/keyword-filter'
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'
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
    if (currentState !== 'step_5_filtering') {
      return NextResponse.json({
        success: true,
        workflow_id: workflowId,
        workflow_state: currentState,
        cached: true
      })
    }

    // 4️⃣ STRICT FSM GUARD
    if (!WorkflowFSM.canTransition(currentState as any, 'FILTERING_COMPLETED')) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_5_filtering. Current state: ${currentState}` 
        },
        { status: 409 }
      )
    }

    // Log start of keyword filtering
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_KEYWORD_FILTERING_STARTED,
      details: {
        workflow_id: workflowId
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // 5️⃣ EXECUTE BUSINESS LOGIC
    // Get organization filter settings
    const filterOptions = await getOrganizationFilterSettings(organizationId)

    // Set timeout for 1 minute as per requirements
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Keyword filtering timeout')), 60000)
    })

    // Perform keyword filtering
    const filterPromise = filterKeywords(workflowId, organizationId, filterOptions)

    // Race between filtering and timeout
    const filterResult = await Promise.race([filterPromise, timeoutPromise]) as FilterResult

    // Update workflow metadata
    const { error: updateError } = await supabase
      .from('intent_workflows')
      .update({
        filtered_keywords_count: filterResult.filtered_keywords_count
      })
      .eq('id', workflowId)

    if (updateError) {
      throw new Error(`Failed to update workflow metadata: ${updateError.message}`)
    }

    // 6️⃣ FSM TRANSITION (ONLY STATE CHANGE POINT)
    const nextState = await WorkflowFSM.transition(
      workflowId,
      'FILTERING_COMPLETED',
      { userId: currentUser.id }
    )

    // 7️⃣ RETURN AUTHORITATIVE NEXT STATE
    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      workflow_state: nextState,
      filter_result: filterResult
    })

  } catch (error) {
    console.error('Keyword filtering failed:', error)

    // Log error
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_KEYWORD_FILTERING_FAILED,
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
      if (error.message === 'Keyword filtering timeout') {
        return NextResponse.json(
          { error: 'Keyword filtering timeout - operation took longer than 1 minute' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('Invalid workflow state')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during keyword filtering' },
      { status: 500 }
    )
  }
}
