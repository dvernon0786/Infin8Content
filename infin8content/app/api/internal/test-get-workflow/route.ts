/**
 * Internal Test Endpoint: Get Workflow State
 * Returns current workflow state for E2E test validation
 * 
 * GET /api/internal/test-get-workflow?id={workflow_id}
 * Returns workflow with all step states
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('id')

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflow_id parameter required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Get workflow with all step data
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select(`
        id,
        name,
        organization_id,
        status,
        current_step,
        created_at,
        updated_at,
        step_0_initial_at,
        step_1_icp_completed_at,
        step_1_icp_error_message,
        step_2_competitor_completed_at,
        step_2_competitor_error_message,
        step_3_seeds_completed_at,
        step_4_clustering_ready_at,
        step_5_filtering_completed_at,
        step_6_clustering_completed_at,
        step_7_validation_completed_at,
        step_8_linking_completed_at,
        step_9_queuing_completed_at
      `)
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Get keyword count for this workflow
    const { count: keywordCount, error: keywordError } = await supabase
      .from('keywords')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', workflowId)

    const keywordData = keywordError ? { count: 0, error: keywordError.message } : { count: keywordCount || 0 }

    return NextResponse.json({
      workflow: workflow,
      keywords: keywordData
    })

  } catch (error: any) {
    console.error('[TestGetWorkflow] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
