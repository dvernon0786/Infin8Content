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
import { advanceWorkflow, WorkflowTransitionError } from '@/lib/services/workflow/advanceWorkflow'
import { WorkflowState } from '@/types/workflow-state'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  filterKeywords,
  getOrganizationFilterSettings,
  type FilterResult
} from '@/lib/services/intent-engine/keyword-filter'
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'

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
    const gateResponse = await enforceICPGate(workflowId, 'filter-keywords')
    if (gateResponse) {
      return gateResponse
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

    // FSM GUARD: Only allow keyword filtering when in step_5_filtering state
    if (workflow.state !== WorkflowState.step_5_filtering) {
      return NextResponse.json(
        {
          error: 'INVALID_STATE',
          message: `Workflow must be in step_5_filtering state. Current state: ${workflow.state}` 
        },
        { status: 400 }
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

    // Advance workflow state - ONLY mutation point
    try {
      await advanceWorkflow({
        workflowId,
        organizationId,
        expectedState: WorkflowState.step_5_filtering,
        nextState: WorkflowState.step_6_clustering
      })
    } catch (error: any) {
      if (error instanceof WorkflowTransitionError) {
        console.error(`[FilterKeywords] Workflow transition failed: ${error.message}`)
        return NextResponse.json(
          { error: 'Workflow transition failed', details: error.message },
          { status: 409 }
        )
      }
      throw error
    }

    // Log completion of keyword filtering
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_KEYWORD_FILTERING_COMPLETED,
      details: {
        workflow_id: workflowId,
        total_keywords: filterResult.total_keywords,
        filtered_keywords_count: filterResult.filtered_keywords_count,
        removal_breakdown: filterResult.removal_breakdown
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // Emit analytics event
    emitAnalyticsEvent({
      event_type: 'workflow.keyword_filtering.completed',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      workflow_id: workflowId,
      total_keywords: filterResult.total_keywords,
      filtered_keywords_count: filterResult.filtered_keywords_count
    })

    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      previous_state: WorkflowState.step_5_filtering,
      new_state: WorkflowState.step_6_clustering,
      data: {
        filter_result: filterResult
      }
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
