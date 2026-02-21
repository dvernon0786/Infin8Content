import { NextRequest, NextResponse } from 'next/server'
import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { createServiceRoleClient } from '@/lib/supabase/server'

// ✅ ENTERPRISE: Strict DTO typing
interface ApprovalRow {
  id: string
  workflow_id: string
  approval_type: string
  approved_items: string[]
  created_at: string
}

interface KeywordRow {
  id: string
  keyword: string
  subtopics: any[]
  subtopics_status: string
  article_status: string
}

interface KeywordWithApproval {
  id: string
  keyword: string
  subtopics: any[]
  subtopics_status: string
  article_status: string
  approvalStatus: 'approved' | 'rejected' | 'pending'
  approvedBy: string | null
  approvedAt: string | null
  feedback: string | null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await context.params

    // Server-side workflow validation
    const workflow = await requireWorkflowStepAccess(workflowId, 8)
    
    const supabase = createServiceRoleClient()

    // Fetch keywords with completed subtopics (both seeds and longtails)
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('id, keyword, subtopics, subtopics_status, article_status')
      .eq('workflow_id', workflowId)
      .eq('subtopics_status', 'completed')
      .order('keyword')

    if (keywordsError) throw keywordsError

    // Fetch workflow-level approval record (intent_approvals uses approved_items array)
    const { data: approval, error: approvalError } = await supabase
      .from('intent_approvals')
      .select('approved_items, created_at')
      .eq('workflow_id', workflowId)
      .eq('approval_type', 'subtopics')
      .single()

    if (approvalError && approvalError.code !== 'PGRST116') { // PGRST116 = no rows
      throw approvalError
    }

    const approvedIds = new Set<string>(
      (approval as unknown as ApprovalRow)?.approved_items ?? []
    )

    const keywordsWithApprovals = (keywords ?? []).map((keyword: any) => {
      return {
        id: keyword.id,
        keyword: keyword.keyword,
        subtopics: Array.isArray(keyword.subtopics)
          ? keyword.subtopics
          : [],
        subtopics_status: keyword.subtopics_status,
        article_status: keyword.article_status,
        approvalStatus: approvedIds.has(keyword.id) ? 'approved' : 'pending',
        approvedBy: approvedIds.has(keyword.id) ? 'Human' : null,
        approvedAt: approvedIds.has(keyword.id) ? (approval as unknown as ApprovalRow)?.created_at : null,
        feedback: null, // No feedback column in current schema
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        workflowId: workflow.id,
        workflowState: workflow.state,
        keywords: keywordsWithApprovals,
      },
    })

  } catch (error: any) {
    console.error('Failed to fetch subtopics for review:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Failed to fetch subtopics for review',
      },
      { status: 500 }
    )
  }
}
