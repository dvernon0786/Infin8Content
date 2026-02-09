/**
 * API Endpoint: Workflow Summary for Human Approval
 * Story 37.3: Implement Human Approval Gate (Workflow-Level)
 * 
 * This endpoint provides a complete, read-only summary of the workflow
 * for human review before making an approval decision.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { getWorkflowSummary } from '@/lib/services/intent-engine/human-approval-processor'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  try {
    const { workflow_id: workflowId } = await params

    // Get workflow summary
    const summary = await getWorkflowSummary(workflowId)

    return NextResponse.json(summary, { status: 200 })

  } catch (error) {
    console.error('Error in workflow summary endpoint:', error)

    // Handle specific error types
    if (error instanceof Error) {
      const message = error.message
      
      // Authentication errors
      if (message.includes('Authentication required')) {
        return NextResponse.json({ error: message }, { status: 401 })
      }
      
      // Authorization errors
      if (message.includes('Access denied')) {
        return NextResponse.json({ error: message }, { status: 403 })
      }
      
      // Validation errors
      if (message.includes('Workflow not found') ||
          message.includes('Workflow ID is required')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
