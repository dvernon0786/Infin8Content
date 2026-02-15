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

    // Get workflow with clean state
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .select(`
        id,
        name,
        organization_id,
        state,
        created_at,
        updated_at,
        created_by,
        cancelled_at,
        cancelled_by,
        icp_data,
        article_link_count,
        article_linking_started_at,
        article_linking_completed_at
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
