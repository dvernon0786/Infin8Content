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
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { enforceICPGate, enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'
import { resolveLocationCode, resolveLanguageCode } from '@/lib/config/dataforseo-geo'

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
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select('id, state')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single() as { data: { id: string; state: string } | null; error: any }
    
    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // UNIFIED ENGINE: Must be in step_2_competitors to proceed
    if (workflow.state !== 'step_2_competitors') {
      const errorMessage = workflow.state === 'step_3_seeds'
        ? 'Cannot re-run competitor analysis after completion. Please create a new workflow.'
        : `Workflow must be in step_2_competitors state, currently in ${workflow.state}`
      
      return NextResponse.json(
        {
          error: 'ILLEGAL_TRANSITION',
          message: errorMessage,
          current_state: workflow.state
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
          current_state: workflow.state
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow start:', logError)
      // Continue anyway - logging is non-blocking
    }

    // Get competitors from request body only (stateless)
    console.log(`[CompetitorAnalyze] Processing competitors for workflow ${workflowId}`)
    const body = await request.json().catch(() => ({}))
    const additionalCompetitors: string[] = body?.additionalCompetitors || []

    // Enforce mandatory 1–3 competitors
    if (additionalCompetitors.length < 1) {
      return NextResponse.json(
        { error: 'MIN_1_COMPETITOR_REQUIRED' },
        { status: 400 }
      )
    }

    if (additionalCompetitors.length > 3) {
      return NextResponse.json(
        { error: 'MAX_3_COMPETITORS_ALLOWED' },
        { status: 400 }
      )
    }

    // Normalize and create runtime competitor objects
    const competitors = additionalCompetitors.map(url => {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}` 
      return {
        id: crypto.randomUUID(), // runtime only
        url: normalizedUrl,
        domain: new URL(normalizedUrl).hostname.replace(/^www\./, ''),
        is_active: true
      }
    })

    console.log(`[CompetitorAnalyze] Processing ${competitors.length} competitors from request body only`)

    // Read user's onboarding keyword settings
    const { data: orgData } = await supabase
      .from('organizations')
      .select('keyword_settings')
      .eq('id', organizationId)
      .single()

    const keywordSettings = (orgData as any)?.keyword_settings || {}

    // Map onboarding region to DataForSEO location code, default to US
    const locationCode = resolveLocationCode(keywordSettings.target_region)

    // Validate language code against supported set, default to English
    const languageCode = resolveLanguageCode(keywordSettings.language_code)

    console.log(`[CompetitorAnalyze] Using location ${locationCode} and language ${languageCode} for region "${keywordSettings.target_region}"`)

    // UNIFIED ENGINE: No processing state needed
    // Work happens synchronously, then advance to next step
    console.log(`[CompetitorAnalyze] Processing competitors for workflow ${workflowId}`)

    // Extract seed keywords from competitors using dependency injection
    const extractionRequest: ExtractSeedKeywordsRequest = {
      competitors: competitors,
      organizationId,
      workflowId, // Critical: Pass workflowId for proper persistence and retry tracking
      maxSeedsPerCompetitor: 25, // Increased from 3 for richer data collection
      locationCode,
      languageCode,
      timeoutMs: 600000 // 10 minutes
    }

    const extractor = createExtractor()
    console.log(`[CompetitorAnalyze] Using extractor: ${extractor.getExtractorType()}`)
    
    const result = await extractor.extract(extractionRequest)

    // API LAYER: Always succeed if extraction API worked (pure data collection)
    // We no longer fail on 0 keywords - human curation happens in Step 3
    console.log(`[CompetitorAnalyze] Extraction completed: ${result.total_keywords_created} keywords from ${competitors.length} competitors`)

    if (result.total_keywords_created === 0) {
      // Stay in step_2_competitors for retry - no FAILED state needed
      return NextResponse.json(
        {
          success: false,
          error: 'NO_KEYWORDS_FOUND',
          message: 'No keywords found from provided competitors. Try adding competitors with stronger SEO presence.'
        },
        { status: 400 }
      )
    }

    // FSM TRANSITION: Advance to next step after successful completion
    try {
      await WorkflowFSM.transition(workflowId, 'COMPETITORS_COMPLETED', { userId: currentUser.id })
      
      console.log(`[CompetitorAnalyze] Successfully advanced to step_3_seeds`)
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to advance workflow',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
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

    // UNIFIED ENGINE: No error state transitions needed
    // Stay in step_2_competitors for retry capability
    console.error(`[CompetitorAnalyze] Error during competitor analysis:`, error)

    // Emit failure analytics event for monitoring
    if (organizationId) {
      emitAnalyticsEvent({
        event_type: 'workflow_step_failed',
        organization_id: organizationId,
        workflow_id: workflowId,
        step: 'step_2_competitors',
        total_attempts: 1,
        final_error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
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
