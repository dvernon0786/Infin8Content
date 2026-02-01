/**
 * API Endpoint: Approve Seed Keywords
 * Story 35.3: Approve Seed Keywords Before Expansion
 * 
 * This endpoint provides a governance gate for approving seed keywords
 * before they are eligible for long-tail expansion.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { processSeedApproval } from '@/lib/services/intent-engine/seed-approval-processor'
import { extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { workflow_id: string } }
) {
  try {
    const workflowId = params.workflow_id
    const body = await request.json()

    // Validate request body
    const { decision, feedback, approved_keyword_ids } = body

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

    if (approved_keyword_ids && (!Array.isArray(approved_keyword_ids) || approved_keyword_ids.length === 0)) {
      return NextResponse.json(
        { error: 'Approved keyword IDs must be a non-empty array when provided' },
        { status: 400 }
      )
    }

    // Process approval
    const result = await processSeedApproval(workflowId, {
      decision,
      feedback,
      approved_keyword_ids,
    }, request.headers)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Error in seed approval endpoint:', error)

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
      if (message.includes('must be at step_3_seeds') || 
          message.includes('Workflow not found') ||
          message.includes('Invalid keyword ID format')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      
      // Database errors
      if (message.includes('Failed to process approval')) {
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
