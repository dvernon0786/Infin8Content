/**
 * Keyword Review API Endpoint
 * Transformed from clustering to keyword review for human curation
 * 
 * GET /api/intent/workflows/{workflow_id}/steps/seed-extract
 * Returns paginated keywords for human review and selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import { enforceICPGate, enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'

export async function GET(
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
    const icpGateResponse = await enforceICPGate(workflowId, 'seed-extract')
    if (icpGateResponse) {
      return icpGateResponse
    }

    // ENFORCE COMPETITOR GATE - Check if competitor analysis is complete before proceeding
    const competitorGateResponse = await enforceCompetitorGate(workflowId, 'seed-extract')
    if (competitorGateResponse) {
      return competitorGateResponse
    }

    console.log(`[KeywordReview] Starting keyword review for workflow ${workflowId}`)

    const supabase = createServiceRoleClient()

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Cap at 100
    const search = searchParams.get('search') || ''
    const intentFilter = searchParams.get('intent') || ''
    const languageFilter = searchParams.get('language') || ''
    const minVolume = parseInt(searchParams.get('minVolume') || '0')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('keywords')
      .select(`
        id,
        keyword,
        search_volume,
        cpc,
        competition_level,
        competition_index,
        keyword_difficulty,
        longtail_status,
        subtopics_status,
        article_status,
        detected_language,
        is_foreign_language,
        main_intent,
        is_navigational,
        ai_suggested,
        user_selected,
        decision_confidence,
        selection_source,
        selection_timestamp
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('workflow_id', workflowId)
      .is('parent_seed_keyword_id', null) // Seed keywords only
      .order('search_volume', { ascending: false })

    // Apply filters
    if (search) {
      query = query.ilike('keyword', `%${search}%`)
    }
    if (intentFilter && intentFilter !== 'all') {
      query = query.eq('main_intent', intentFilter)
    }
    if (languageFilter === 'english') {
      query = query.eq('is_foreign_language', false)
    }
    if (languageFilter === 'foreign') {
      query = query.eq('is_foreign_language', true)
    }
    if (minVolume > 0) {
      query = query.gte('search_volume', minVolume)
    }

    // Execute query with pagination
    const { data: keywords, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching keywords:', error)
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedKeywords = keywords?.map((keyword: any) => ({
      ...keyword,
      source: 'Competitor' // Will be enhanced later with join
    })) || []

    // Log action
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_STEP_COMPLETED,
      details: {
        workflow_id: workflowId,
        keywords_count: transformedKeywords.length,
        total_available: count || 0
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({
      success: true,
      data: {
        keywords: transformedKeywords,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Keyword review failed:', error)
    
    // Log failure
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_STEP_FAILED,
        details: {
          workflow_id: workflowId,
          step: 3,
          error: error.message
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
    // --------------------------------------------------
    // 1. AUTHENTICATION
    // --------------------------------------------------
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    organizationId = currentUser.org_id
    userId = currentUser.id

    // --------------------------------------------------
    // 2. INPUT VALIDATION
    // --------------------------------------------------
    const body = await request.json()
    const { selectedKeywordIds } = body

    if (!Array.isArray(selectedKeywordIds) || selectedKeywordIds.length < 2) {
      return NextResponse.json(
        {
          error: 'At least 2 keywords must be selected',
          code: 'INSUFFICIENT_KEYWORDS_SELECTED'
        },
        { status: 400 }
      )
    }

    if (selectedKeywordIds.length > 100) {
      return NextResponse.json(
        {
          error: 'Maximum 100 keywords allowed',
          code: 'TOO_MANY_KEYWORDS_SELECTED'
        },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // --------------------------------------------------
    // 3. VERIFY WORKFLOW EXISTS + CURRENT STATE LOCK
    // --------------------------------------------------
    const { data: workflow, error: workflowFetchError } = await supabase
      .from('intent_workflows')
      .select('id, state')
      .eq('id', workflowId)
      .eq('organization_id', organizationId)
      .single() as { data: { id: string; state: string } | null; error: any }

    if (workflowFetchError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (workflow.state !== 'step_3_seeds') {
      return NextResponse.json(
        {
          error: 'Illegal workflow transition',
          currentState: workflow.state,
          expectedState: 'step_3_seeds'
        },
        { status: 409 }
      )
    }

    // --------------------------------------------------
    // 4. CLEAR PREVIOUS SELECTIONS
    // --------------------------------------------------
    const { error: clearError } = await supabase
      .from('keywords')
      .update({
        user_selected: false,
        selection_source: 'bulk_deselect',
        selection_timestamp: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('workflow_id', workflowId)
      .is('parent_seed_keyword_id', null)

    if (clearError) {
      console.error('Error clearing selections:', clearError)
      throw clearError
    }

    // --------------------------------------------------
    // 5. APPLY NEW SELECTIONS
    // --------------------------------------------------
    const { error: selectError } = await supabase
      .from('keywords')
      .update({
        user_selected: true,
        selection_source: 'user',
        selection_timestamp: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('workflow_id', workflowId)
      .in('id', selectedKeywordIds)

    if (selectError) {
      console.error('Error setting selections:', selectError)
      throw selectError
    }

    // --------------------------------------------------
    // 6. FSM STATE TRANSITION (DETERMINISTIC ENGINE)
    // --------------------------------------------------
    try {
      await WorkflowFSM.transition(workflowId, 'SEEDS_APPROVED', { userId: currentUser.id })
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to advance workflow',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // --------------------------------------------------
    // 7. AUDIT LOGGING
    // --------------------------------------------------
    await logActionAsync({
      orgId: organizationId,
      userId: userId,
      action: AuditAction.WORKFLOW_STEP_COMPLETED,
      details: {
        workflow_id: workflowId,
        step: 3,
        selected_count: selectedKeywordIds.length,
        new_state: 'step_4_longtails'
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // --------------------------------------------------
    // 8. SUCCESS RESPONSE
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      data: {
        keywordsSelected: selectedKeywordIds.length,
        message: 'Step 3 completed successfully',
        nextState: 'step_4_longtails'
      }
    })

  } catch (error: any) {
    console.error('Step 3 POST failed:', error)
    
    // --------------------------------------------------
    // 9. ERROR HANDLING & AUDIT
    // --------------------------------------------------
    if (organizationId && userId) {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_STEP_FAILED,
        details: {
          workflow_id: workflowId,
          step: 3,
          error: error.message
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
