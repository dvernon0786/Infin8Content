/**
 * Competitor Analysis API Endpoint
 * Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
 * Triggers seed keyword extraction for competitor URLs in a workflow
 * 
 * Uses the new workflow state engine with legal transition enforcement
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
import type { SeedExtractor } from '@/lib/services/intent-engine/seed-extractor.interface'
import { DeterministicFakeExtractor } from '@/lib/services/intent-engine/deterministic-fake-extractor'
import { 
  transitionWorkflow, 
  getWorkflowState 
} from '@/lib/services/workflow-engine/transition-engine'
import { WorkflowState } from '@/types/workflow-state'
import { getWorkflowCompetitors } from '@/lib/services/competitor-workflow-integration'
import { enforceICPGate, enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'

// Pure dependency injection factory - no global state
function createExtractor(): SeedExtractor {
  // In test mode, inject fake extractor
  // In production, use real extractor wrapper
  if (process.env.NODE_ENV === 'test') {
    return new DeterministicFakeExtractor()
  }
  
  // Real extractor wrapper for production
  return {
    async extract(request: ExtractSeedKeywordsRequest) {
      return extractSeedKeywords(request)
    },
    getExtractorType() {
      return 'dataforseo-real'
    }
  }
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

    // Get current workflow state
    const currentState = await getWorkflowState(workflowId, organizationId)
    
    if (!currentState) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // STATE ENGINE ENFORCEMENT: Only allow from COMPETITOR_PENDING
    if (currentState !== WorkflowState.COMPETITOR_PENDING) {
      const errorMessage = currentState === WorkflowState.COMPETITOR_COMPLETED
        ? 'Cannot re-run competitor analysis after completion. Please create a new workflow.'
        : `Workflow must be in COMPETITOR_PENDING state, currently in ${currentState}`
      
      return NextResponse.json(
        {
          error: 'ILLEGAL_TRANSITION',
          message: errorMessage,
          current_state: currentState
        },
        { status: 409 }
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
          current_state: currentState
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

    // Insert additional competitors into organization_competitors first
    let extraFormatted: CompetitorData[] = []

    for (const url of newCompetitors) {
      if (typeof url !== 'string' || url.trim().length === 0) continue

      const cleanUrl = url.trim()

      const { data, error } = await supabase
        .from('organization_competitors')
        .upsert({
          organization_id: organizationId,
          url: cleanUrl,
          domain: cleanUrl,
          is_active: true,
          created_by: userId
        }, {
          onConflict: 'organization_id,url'
        })
        .select('id, url, domain, is_active')
        .single() as { data: { id: string; url: string; domain: string; is_active: boolean } | null; error: any }

      if (error || !data) {
        console.error('Failed to insert additional competitor:', error)
        continue
      }

      extraFormatted.push({
        id: data.id,
        url: data.url,
        domain: data.domain,
        is_active: data.is_active
      })
    }

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

    // STATE ENGINE: Transition to processing state first
    // This prevents concurrent processing and ensures clean state machine
    const processingResult = await transitionWorkflow({
      workflowId,
      organizationId,
      from: WorkflowState.COMPETITOR_PENDING,
      to: WorkflowState.COMPETITOR_PROCESSING
    })

    if (!processingResult.success) {
      // Another request won the race or illegal transition
      console.log(`[CompetitorAnalyze] Failed to transition to processing: ${processingResult.error}`)
      return NextResponse.json(
        { 
          error: processingResult.error || 'TRANSITION_FAILED',
          message: 'Failed to start competitor analysis. Workflow may already be processing.',
          workflow_id: workflowId
        },
        { status: 409 } // Conflict - another request won the race
      )
    }

    // Extract seed keywords from competitors using dependency injection
    const extractionRequest: ExtractSeedKeywordsRequest = {
      competitors: allCompetitors,
      organizationId,
      workflowId, // Critical: Pass workflowId for proper persistence and retry tracking
      maxSeedsPerCompetitor: 25, // Increased from 3 for richer data collection
      locationCode: 2840, // US default
      languageCode: 'en',
      timeoutMs: 600000 // 10 minutes
    }

    const extractor = createExtractor()
    console.log(`[CompetitorAnalyze] Using extractor: ${extractor.getExtractorType()}`)
    
    const result = await extractor.extract(extractionRequest)

    // API LAYER: Always succeed if extraction API worked (pure data collection)
    // We no longer fail on 0 keywords - human curation happens in Step 3
    console.log(`[CompetitorAnalyze] Extraction completed: ${result.total_keywords_created} keywords from ${allCompetitors.length} competitors`)

    // TRANSITION AFTER SUCCESS: Only transition after side effects complete
    // This ensures state machine purity - if state says "COMPLETED", work is actually done
    const completedResult = await transitionWorkflow({
      workflowId,
      organizationId,
      from: WorkflowState.COMPETITOR_PROCESSING,
      to: WorkflowState.COMPETITOR_COMPLETED
    })
    
    if (!completedResult.success) {
      // Another request already transitioned this workflow
      // Keywords were already extracted, return success anyway
      console.log(`[CompetitorAnalyze] Workflow already completed (concurrent request won race)`)
      return NextResponse.json({
        success: true,
        message: 'Competitor analysis already completed by concurrent request',
        workflow_id: workflowId
      })
    }

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
        await transitionWorkflow({
          workflowId,
          organizationId,
          from: WorkflowState.COMPETITOR_PROCESSING,
          to: WorkflowState.COMPETITOR_FAILED
        })
        
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
