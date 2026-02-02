/**
 * Competitor Analysis API Endpoint
 * Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
 * Triggers seed keyword extraction for competitor URLs in a workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  extractSeedKeywords,
  updateWorkflowStatus,
  type ExtractSeedKeywordsRequest
} from '@/lib/services/intent-engine/competitor-seed-extractor'
import { getWorkflowCompetitors } from '@/lib/services/competitor-workflow-integration'
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
    const gateResponse = await enforceICPGate(workflowId, 'competitor-analyze')
    if (gateResponse) {
      return gateResponse
    }

    // Verify workflow exists and belongs to user's organization
    const supabase = createServiceRoleClient()
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

    // Check if workflow is in correct state for competitor analysis
    if (typedWorkflow.status !== 'step_1_icp' && typedWorkflow.status !== 'step_2_competitors') {
      return NextResponse.json(
        {
          error: 'Invalid workflow state',
          message: `Workflow must be in step_1_icp or step_2_competitors state, currently in ${typedWorkflow.status}`
        },
        { status: 400 }
      )
    }

    // Log action start
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_COMPETITOR_SEED_KEYWORDS_STARTED,
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

    // Load competitors for the workflow
    console.log(`[CompetitorAnalyze] Loading competitors for workflow ${workflowId}`)
    const competitors = await getWorkflowCompetitors(workflowId)

    if (competitors.length === 0) {
      await updateWorkflowStatus(
        workflowId,
        organizationId,
        'failed',
        'No active competitors configured for this organization'
      )

      return NextResponse.json(
        {
          error: 'No competitors found',
          message: 'Organization must have at least one active competitor configured'
        },
        { status: 400 }
      )
    }

    console.log(`[CompetitorAnalyze] Found ${competitors.length} competitors for workflow ${workflowId}`)

    // Extract seed keywords from competitors
    const extractionRequest: ExtractSeedKeywordsRequest = {
      competitors,
      organizationId,
      maxSeedsPerCompetitor: 3,
      locationCode: 2840, // US default
      languageCode: 'en',
      timeoutMs: 600000 // 10 minutes
    }

    const result = await extractSeedKeywords(extractionRequest)

    // Update workflow status to step_2_competitors
    await updateWorkflowStatus(workflowId, organizationId, 'step_2_competitors')

    // Log action completion
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_COMPETITOR_SEED_KEYWORDS_COMPLETED,
        details: {
          workflow_id: workflowId,
          seed_keywords_created: result.total_keywords_created,
          competitors_processed: result.competitors_processed,
          competitors_failed: result.competitors_failed
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow completion:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[CompetitorAnalyze] Successfully completed competitor analysis for workflow ${workflowId}`)

    return NextResponse.json({
      success: true,
      warning: result.competitors_failed > 0 ? `${result.competitors_failed} competitor(s) failed during analysis` : undefined,
      data: {
        seed_keywords_created: result.total_keywords_created,
        step_2_competitor_completed_at: new Date().toISOString(),
        competitors_processed: result.competitors_processed,
        competitors_failed: result.competitors_failed,
        results: result.results
      }
    })
  } catch (error) {
    // Log error
    console.error(`[CompetitorAnalyze] Error during competitor analysis:`, error)

    // Update workflow with error status if we have the necessary IDs
    if (workflowId && organizationId) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      try {
        await updateWorkflowStatus(workflowId, organizationId, 'failed', errorMessage)
        
        // Emit terminal failure analytics event (AC 8)
        emitAnalyticsEvent({
          event_type: 'workflow_step_failed',
          organization_id: organizationId,
          workflow_id: workflowId,
          step: 'step_2_competitors',
          total_attempts: 1,
          final_error_message: errorMessage,
          timestamp: new Date().toISOString()
        })
      } catch (updateError) {
        console.error('Failed to update workflow error status:', updateError)
      }
    }

    // Return error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract seed keywords'
    return NextResponse.json(
      {
        error: 'Seed keyword extraction failed',
        message: errorMessage,
        workflow_id: workflowId
      },
      { status: 500 }
    )
  }
}
