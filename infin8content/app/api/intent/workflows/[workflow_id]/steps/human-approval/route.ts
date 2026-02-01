/**
 * API Endpoint: Human Approval Decision
 * Story 37.3: Implement Human Approval Gate (Workflow-Level)
 * 
 * This endpoint provides the final governance gate for approving workflows
 * before they are eligible for article generation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { processHumanApproval } from '@/lib/services/intent-engine/human-approval-processor'
import { extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  try {
    const { workflow_id: workflowId } = await params
    const body = await request.json()

    // Validate request body
    const { decision, feedback, reset_to_step } = body

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    if (feedback && typeof feedback !== 'string') {
      return NextResponse.json(
        { error: 'Feedback must be a string' },
        { status: 400 }
      )
    }

    // If rejected, reset_to_step is required and must be between 1 and 7
    if (decision === 'rejected') {
      if (!reset_to_step || typeof reset_to_step !== 'number' || reset_to_step < 1 || reset_to_step > 7) {
        return NextResponse.json(
          { error: 'reset_to_step is required and must be a number between 1 and 7 when rejected' },
          { status: 400 }
        )
      }
    }

    // Process approval
    const result = await processHumanApproval(workflowId, {
      decision,
      feedback,
      reset_to_step,
    }, request.headers)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Error in human approval endpoint:', error)

    // Handle specific error types
    if (error instanceof Error) {
      const message = error.message
      
      // Authentication errors
      if (message.includes('Authentication required')) {
        return NextResponse.json({ error: message }, { status: 401 })
      }
      
      // Authorization errors
      if (message.includes('Admin access required')) {
        return NextResponse.json({ error: message }, { status: 403 })
      }
      
      // Validation errors
      if (message.includes('must be at step_7_subtopics') || 
          message.includes('Workflow not found') ||
          message.includes('reset_to_step is required') ||
          message.includes('Decision must be either')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      
      // Database errors
      if (message.includes('Failed to update workflow') || 
          message.includes('Failed to process approval')) {
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
      }
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
