/**
 * API Route: Subtopic Approval
 * Story 37-2: Review and Approve Subtopics Before Article Generation
 * 
 * POST /api/keywords/[keyword_id]/approve-subtopics
 * 
 * This endpoint handles the approval/rejection of subtopics for a specific keyword.
 * It requires admin authentication and updates the keyword's article_status accordingly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processSubtopicApproval, SubtopicApprovalRequest } from '@/lib/services/keyword-engine/subtopic-approval-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: { keyword_id: string } }
) {
  try {
    const keywordId = params.keyword_id

    // Parse request body
    const body = await request.json() as SubtopicApprovalRequest

    // Validate request body
    if (!body.decision || !['approved', 'rejected'].includes(body.decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Process the approval
    const result = await processSubtopicApproval(keywordId, body, request.headers)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      decision: result.decision,
      keyword_id: result.keyword_id,
      article_status: result.article_status,
      message: result.message
    })

  } catch (error) {
    console.error('Subtopic approval error:', error)
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Admin access required')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('Keyword not found')) {
        return NextResponse.json(
          { error: 'Keyword not found' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('Subtopics must be complete')) {
        return NextResponse.json(
          { error: 'Subtopics must be complete before approval' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('Decision must be either')) {
        return NextResponse.json(
          { error: 'Invalid decision. Must be "approved" or "rejected"' },
          { status: 400 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
