import { NextRequest, NextResponse } from 'next/server'
import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await context.params

    // Enforce Step 8 access
    await requireWorkflowStepAccess(workflowId, 8)

    const supabase = createServiceRoleClient()

    // 1️⃣ Fetch keywords with completed subtopics (both seeds and longtails)
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('id')
      .eq('workflow_id', workflowId)
      .eq('subtopics_status', 'completed')

    if (keywordsError) throw keywordsError
    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'No completed subtopics found.' },
        { status: 400 }
      )
    }

    // 2️⃣ Check approval status from intent_approvals table (uses approved_items array)
    const { data: approval, error: approvalError } = await supabase
      .from('intent_approvals')
      .select('approved_items')
      .eq('workflow_id', workflowId)
      .eq('approval_type', 'subtopics')
      .single()

    if (approvalError && approvalError.code !== 'PGRST116') { // PGRST116 = no rows
      throw approvalError
    }

    const approvedIds = new Set<string>(
      (approval as unknown as { approved_items: string[] })?.approved_items ?? []
    )

    const allApproved = (keywords as unknown as Array<{ id: string }>).every(k => approvedIds.has(k.id))

    if (!allApproved) {
      return NextResponse.json(
        { error: 'All keywords must be approved before completing Step 8.' },
        { status: 400 }
      )
    }

    // 3️⃣ Transition workflow (THIS triggers Step 9)
    console.log('🔍 DEBUG: Starting HUMAN_SUBTOPICS_APPROVED transition for workflow:', workflowId)
    
    const result = await transitionWithAutomation(
      workflowId,
      'HUMAN_SUBTOPICS_APPROVED',
      'system'
    )

    console.log('🔍 DEBUG: TRANSITION RESULT:', JSON.stringify(result, null, 2))

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to transition workflow.' },
        { status: 500 }
      )
    }

    console.log('🔍 DEBUG: Transition successful, emitted event:', result.emittedEvent)

    return NextResponse.json({
      success: true,
      nextState: 'step_9_articles',
      emittedEvent: result.emittedEvent
    })

  } catch (error: any) {
    console.error('Step 8 completion failed:', error)

    return NextResponse.json(
      { error: error?.message ?? 'Failed to complete Step 8' },
      { status: 500 }
    )
  }
}
