/**
 * Seed Keyword Extraction API Endpoint
 * Story 39.2: Enforce Hard Gate - Competitors Required for Seed Keywords
 * 
 * POST /api/intent/workflows/{workflow_id}/steps/seed-extract
 * Transitions workflow from competitor analysis completion to seed keyword readiness
 * This endpoint represents the seed keyword extraction step that requires competitor analysis to be complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import { enforceICPGate, enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'

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
    const icpGateResponse = await enforceICPGate(workflowId, 'seed-extract')
    if (icpGateResponse) {
      return icpGateResponse
    }

    // ENFORCE COMPETITOR GATE - Check if competitor analysis is complete before proceeding
    const competitorGateResponse = await enforceCompetitorGate(workflowId, 'seed-extract')
    if (competitorGateResponse) {
      return competitorGateResponse
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

    // Check if workflow is in correct state for seed extraction
    if (typedWorkflow.status !== 'step_2_competitors') {
      return NextResponse.json(
        {
          error: 'Invalid workflow state',
          message: `Workflow must be in step_2_competitors state, currently in ${typedWorkflow.status}`
        },
        { status: 400 }
      )
    }

    // Log action start
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_SEED_KEYWORDS_APPROVED, // Reusing existing audit action
        details: {
          workflow_id: workflowId,
          workflow_status: typedWorkflow.status,
          action: 'seed_extraction_transition'
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow start:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[SeedExtract] Starting seed extraction transition for workflow ${workflowId}`)

    // Count existing seed keywords to verify they exist
    const { data: seedKeywords, error: seedError } = await supabase
      .from('keywords')
      .select('id')
      .eq('workflow_id', workflowId)
      .eq('organization_id', organizationId)
      .is('parent_seed_keyword_id', null) // Seed keywords have no parent
      .limit(1)

    if (seedError) {
      console.error('Error checking seed keywords:', seedError)
      return NextResponse.json(
        { error: 'Failed to verify seed keywords' },
        { status: 500 }
      )
    }

    if (!seedKeywords || seedKeywords.length === 0) {
      return NextResponse.json(
        {
          error: 'No seed keywords found',
          message: 'Competitor analysis must be completed first to generate seed keywords'
        },
        { status: 400 }
      )
    }

    // Update workflow status to step_3_seeds
    const { error: updateError } = await supabase
      .from('intent_workflows')
      .update({ 
        status: 'step_3_seeds',
        current_step: 4,  // Advance to Step 4
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Error updating workflow status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update workflow status' },
        { status: 500 }
      )
    }

    // Log action completion
    try {
      await logActionAsync({
        orgId: organizationId,
        userId: userId,
        action: AuditAction.WORKFLOW_SEED_KEYWORDS_APPROVED, // Reusing existing audit action
        details: {
          workflow_id: workflowId,
          previous_status: 'step_2_competitors',
          new_status: 'step_3_seeds',
          step_3_seeds_completed_at: new Date().toISOString()
        },
        ipAddress: extractIpAddress(request.headers),
        userAgent: extractUserAgent(request.headers),
      })
    } catch (logError) {
      console.error('Failed to log workflow completion:', logError)
      // Continue anyway - logging is non-blocking
    }

    console.log(`[SeedExtract] Successfully completed seed extraction transition for workflow ${workflowId}`)

    return NextResponse.json({
      success: true,
      data: {
        step_3_seeds_completed_at: new Date().toISOString(),
        previous_status: 'step_2_competitors',
        new_status: 'step_3_seeds'
      }
    })

  } catch (error) {
    // Log error
    console.error(`[SeedExtract] Error during seed extraction:`, error)

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
