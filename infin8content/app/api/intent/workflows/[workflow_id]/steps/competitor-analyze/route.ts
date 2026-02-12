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
  type ExtractSeedKeywordsRequest,
  type CompetitorData
} from '@/lib/services/intent-engine/competitor-seed-extractor'
import { getWorkflowCompetitors } from '@/lib/services/competitor-workflow-integration'
import { enforceICPGate, enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'

// Inline workflow status update function for API layer control
async function updateWorkflowStatus(
  workflowId: string,
  organizationId: string,
  status: 'step_2_competitors' | 'failed',
  errorMessage?: string
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (status === 'step_2_competitors') {
    updateData.step_2_competitor_completed_at = new Date().toISOString()
    // Advance to next step (Step 3)
    updateData.current_step = 3
  } else if (status === 'failed') {
    updateData.step_2_competitor_error_message = errorMessage
  }

  const { error } = await supabase
    .from('intent_workflows')
    .update(updateData)
    .eq('id', workflowId)
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to update workflow status: ${error.message}`)
  }

  console.log(`[CompetitorAnalyze] Workflow ${workflowId} status updated to ${status}, current_step advanced to ${updateData.current_step}`)
}

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

    // Create service client for database operations
    const supabase = createServiceRoleClient()

    // 🔒 ENFORCE COMPETITOR GATE - Check if competitors exist
    const { count: competitorCount } = await supabase
      .from('organization_competitors')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (!competitorCount || competitorCount < 1) {
      return NextResponse.json(
        {
          error: 'NO_COMPETITORS_PRESENT',
          message: 'Cannot run competitor analysis without competitors. Please complete onboarding first.',
          competitor_count: competitorCount
        },
        { status: 400 }
      )
    }

    console.log(`[CompetitorAnalyze] Found ${competitorCount} competitors for analysis`)

    // Verify workflow exists and belongs to user's organization
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, status, organization_id, current_step')
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
    const typedWorkflow = workflow as unknown as { id: string; status: string; organization_id: string; current_step: number }

    // ENFORCE STRICT LINEAR PROGRESSION: Only allow step 2 when current_step = 2
    if (typedWorkflow.current_step !== 2) {
      const errorMessage = typedWorkflow.current_step > 2 
        ? 'Cannot re-run Step 2 after clustering has started. Please create a new workflow.'
        : `Workflow must be at step 2 (competitor analysis), currently at step ${typedWorkflow.current_step}`
      
      return NextResponse.json(
        {
          error: 'INVALID_STEP_ORDER',
          message: errorMessage
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
    const workflowCompetitors = await getWorkflowCompetitors(workflowId)

    // Get additional competitors from request body (only NEW ones)
    const body = await request.json().catch(() => ({}))
    const additionalCompetitors: string[] = body?.additionalCompetitors || []

    // Filter out duplicates from existing competitors
    const existingUrls = new Set(workflowCompetitors.map(c => c.url))
    const newCompetitors = additionalCompetitors.filter(url => !existingUrls.has(url))

    // Format workflow competitors to match CompetitorData interface
    const workflowFormatted = workflowCompetitors.map(c => ({
      id: c.id,
      url: c.url,
      domain: c.domain,
      is_active: c.is_active
    }))

    // Format additional competitors
    const extraFormatted = newCompetitors
      .filter((url) => typeof url === 'string' && url.trim().length > 0)
      .map((url) => ({
        id: crypto.randomUUID(),
        url: url.trim(),
        domain: url.trim(),
        is_active: true
      }))

    const allCompetitors: CompetitorData[] = [...workflowFormatted, ...extraFormatted]

    if (allCompetitors.length === 0) {
      return NextResponse.json(
        {
          error: 'No competitors available to analyze.',
          message: 'Please add at least one competitor URL.'
        },
        { status: 400 }
      )
    }

    console.log(`[CompetitorAnalyze] Found ${workflowCompetitors.length} workflow + ${extraFormatted.length} additional = ${allCompetitors.length} total competitors`)

    // Extract seed keywords from competitors
    const extractionRequest: ExtractSeedKeywordsRequest = {
      competitors: allCompetitors,
      organizationId,
      workflowId, // Critical: Pass workflowId for proper persistence and retry tracking
      maxSeedsPerCompetitor: 25, // Increased from 3 for richer data collection
      locationCode: 2840, // US default
      languageCode: 'en',
      timeoutMs: 600000 // 10 minutes
    }

    const result = await extractSeedKeywords(extractionRequest)

    // API LAYER: Always succeed if extraction API worked (pure data collection)
    // We no longer fail on 0 keywords - human curation happens in Step 3
    console.log(`[CompetitorAnalyze] Extraction completed: ${result.total_keywords_created} keywords from ${allCompetitors.length} competitors`)

    // SUCCESS PATH - Update workflow status and advance step
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
      seed_keywords_created: result.total_keywords_created,
      total_keywords_created: result.total_keywords_created,
      competitors_processed: result.competitors_processed,
      competitors_failed: result.competitors_failed,
      warning: result.competitors_failed > 0 ? `${result.competitors_failed} competitor(s) failed during analysis` : undefined
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
