import { NextRequest, NextResponse } from 'next/server'
import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { createServiceRoleClient } from '@/lib/supabase/server'

// ✅ ENTERPRISE: Strict DTO typing
interface ApprovalRow {
  id: string
  entity_id: string
  decision: 'approved' | 'rejected'
  approver_id: string
  feedback: string | null
  created_at: string
  approver: {
    id: string
    email: string
  } | null
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

    // Fetch keywords with completed subtopics
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('id, keyword, subtopics, subtopics_status, article_status')
      .eq('workflow_id', workflowId)
      .is('parent_seed_keyword_id', 'not null')
      .eq('subtopics_status', 'completed')
      .order('keyword')

    if (keywordsError) throw keywordsError

    // Fetch approval status with user details
    const { data: approvals, error: approvalsError } = await supabase
      .from('intent_approvals')
      .select(`
        id,
        entity_id,
        decision,
        approver_id,
        feedback,
        created_at,
        approver:users (
          id,
          email
        )
      `)
      .eq('workflow_id', workflowId)
      .eq('entity_type', 'keyword')
      .eq('approval_type', 'subtopics')

    if (approvalsError) throw approvalsError

    const approvalMap = new Map<string, {
      decision: 'approved' | 'rejected'
      approvedBy: string | null
      approvedAt: string | null
      feedback: string | null
    }>()

    if (approvals) {
      for (const approval of approvals as any[]) {
        approvalMap.set(approval.entity_id, {
          decision: approval.decision,
          approvedBy: approval.approver?.email ?? approval.approver_id,
          approvedAt: approval.created_at,
          feedback: approval.feedback,
        })
      }
    }

    const keywordsWithApprovals = (keywords ?? []).map((keyword: any) => {
      const approval = approvalMap.get(keyword.id)

      return {
        id: keyword.id,
        keyword: keyword.keyword,
        subtopics: Array.isArray(keyword.subtopics)
          ? keyword.subtopics
          : [],
        subtopics_status: keyword.subtopics_status,
        article_status: keyword.article_status,
        approvalStatus: approval?.decision ?? 'pending',
        approvedBy: approval?.approvedBy ?? null,
        approvedAt: approval?.approvedAt ?? null,
        feedback: approval?.feedback ?? null,
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
