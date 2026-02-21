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
  { params }: { params: { id: string } }
) {
  try {
    const { id: workflowId } = await params
    
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

    // Create approval lookup map with safe typing
    const approvalMap = new Map()
    if (Array.isArray(approvals) && approvals.length > 0) {
      approvals.forEach(approval => {
        const approvalRecord = approval as unknown as ApprovalRow
        approvalMap.set(approvalRecord.entity_id, {
          id: approvalRecord.id,
          decision: approvalRecord.decision,
          approvedBy: approvalRecord.approver?.email || approvalRecord.approver_id, // ✅ User-friendly email
          approvedAt: approvalRecord.created_at,
          feedback: approvalRecord.feedback
        })
      })
    }

    // Compose DTO with joined data and safe typing
    const keywordsWithApprovals: KeywordWithApproval[] = (Array.isArray(keywords) && keywords.length > 0 ? keywords : []).map(keyword => {
      const keywordRecord = keyword as unknown as KeywordRow
      const approval = approvalMap.get(keywordRecord.id)
      
      return {
        id: keywordRecord.id,
        keyword: keywordRecord.keyword,
        subtopics: keywordRecord.subtopics,
        subtopics_status: keywordRecord.subtopics_status,
        article_status: keywordRecord.article_status,
        approvalStatus: approval?.decision || 'pending',
        approvedBy: approval?.approvedBy || null,
        approvedAt: approval?.approvedAt || null,
        feedback: approval?.feedback || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        workflowId: workflow.id,
        workflowState: workflow.state,
        keywords: keywordsWithApprovals
      }
    })

  } catch (error: any) {
    console.error('Failed to fetch subtopics for review:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch subtopics for review' 
      },
      { status: error.status || 500 }
    )
  }
}
