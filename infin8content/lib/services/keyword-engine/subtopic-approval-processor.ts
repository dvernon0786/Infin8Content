/**
 * Subtopic Approval Processor Service
 * Story 37-2: Review and Approve Subtopics Before Article Generation
 * 
 * This service handles the governance logic for approving subtopics
 * for longtail keywords before they are eligible for article generation.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { inngest } from '@/lib/inngest/client'
import { transitionAndTrigger } from '@/lib/fsm/boundary-transition-wrapper'

export interface SubtopicApprovalRequest {
  decision: 'approved' | 'rejected'
  feedback?: string
}

export interface SubtopicApprovalResponse {
  success: boolean
  decision: 'approved' | 'rejected'
  keyword_id: string
  article_status: 'ready' | 'not_started'
  message: string
}

/**
 * Process subtopic approval for a keyword
 * 
 * @param keywordId - The keyword ID to approve subtopics for
 * @param approvalRequest - The approval decision and metadata
 * @param headers - Request headers for audit logging (optional)
 * @returns Approval response with status
 */
export async function processSubtopicApproval(
  keywordId: string,
  approvalRequest: SubtopicApprovalRequest,
  headers?: Headers
): Promise<SubtopicApprovalResponse> {
  const { decision, feedback } = approvalRequest

  // Validate input
  if (!keywordId) {
    throw new Error('Keyword ID is required')
  }

  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Decision must be either "approved" or "rejected"')
  }

  // Get current user and validate authentication
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    throw new Error('Authentication required')
  }

  // Validate user is organization admin
  if (currentUser.role !== 'admin') {
    throw new Error('Admin access required')
  }

  // Create Supabase client
  const supabase = await createServiceRoleClient()

  // Validate keyword exists and belongs to user's organization
  const keywordResult = await supabase
    .from('keywords')
    .select('id, organization_id, longtail_keyword, subtopics, subtopics_status, article_status')
    .eq('id', keywordId)
    .single()

  if (keywordResult.error || !keywordResult.data) {
    throw new Error('Keyword not found')
  }

  const keyword = keywordResult.data as unknown as {
    id: string
    organization_id: string
    longtail_keyword?: string
    subtopics: any[]
    subtopics_status: string
    article_status: string
  }

  // Validate keyword belongs to the same organization as the user
  if (keyword.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: keyword belongs to different organization')
  }

  // Validate subtopics are complete before approval
  if (keyword.subtopics_status !== 'complete') {
    throw new Error('Subtopics must be complete before approval')
  }

  // Validate subtopics exist
  if (!keyword.subtopics || keyword.subtopics.length === 0) {
    throw new Error('No subtopics found for approval')
  }

  // Update keyword article_status based on decision
  const newArticleStatus = decision === 'approved' ? 'ready' : 'not_started'
  
  const keywordUpdateResult = await supabase
    .from('keywords')
    .update({
      article_status: newArticleStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', keywordId)
    .select('id')
    .single()

  if (keywordUpdateResult.error || !keywordUpdateResult.data) {
    console.error('Failed to update keyword status:', keywordUpdateResult.error)
    throw new Error('Failed to update keyword status')
  }

  // Create or update approval record (idempotent)
  const approvalData = {
    entity_id: keywordId,
    entity_type: 'keyword',
    approval_type: 'subtopics',
    decision,
    approver_id: currentUser.id,
    feedback: feedback || null,
  }

  const approvalResult = await supabase
    .from('intent_approvals')
    .upsert(approvalData, {
      onConflict: 'entity_id,entity_type,approval_type',
      ignoreDuplicates: false,
    })
    .select('id')
    .single()

  if (approvalResult.error || !approvalResult.data) {
    console.error('Failed to process approval:', approvalResult.error)
    throw new Error('Failed to process approval')
  }

  const approval = approvalResult.data as unknown as {
    id: string
  }

  // Log audit action
  const auditAction = decision === 'approved' 
    ? AuditAction.KEYWORD_SUBTOPICS_APPROVED 
    : AuditAction.KEYWORD_SUBTOPICS_REJECTED

  logActionAsync({
    orgId: currentUser.org_id,
    userId: currentUser.id,
    action: auditAction,
    details: {
      keyword_id: keywordId,
      longtail_keyword: keyword.longtail_keyword,
      decision,
      feedback: feedback || null,
    },
    ipAddress: headers ? extractIpAddress(headers) : null,
    userAgent: headers ? extractUserAgent(headers) : null,
  })

  // 🔥 WORKFLOW-LEVEL APPROVAL CHECK
  // Check if this was the final keyword approval needed to trigger Step 9
  if (decision === 'approved') {
    await checkAndTriggerWorkflowCompletion(keywordId, currentUser.org_id, currentUser.id)
  }

  // Return success response
  const message = decision === 'approved' 
    ? 'Subtopics approved successfully'
    : 'Subtopics rejected successfully'

  return {
    success: true,
    decision,
    keyword_id: keywordId,
    article_status: newArticleStatus,
    message,
  }
}

/**
 * Check if subtopics are approved for a keyword
 * 
 * @param keywordId - The keyword ID to check
 * @returns True if subtopics are approved, false otherwise
 */
export async function areSubtopicsApproved(keywordId: string): Promise<boolean> {
  if (!keywordId) {
    return false
  }

  const supabase = await createServiceRoleClient()

  const approvalResult = await supabase
    .from('intent_approvals')
    .select('decision')
    .eq('entity_id', keywordId)
    .eq('entity_type', 'keyword')
    .eq('approval_type', 'subtopics')
    .single()

  if (approvalResult.error || !approvalResult.data) {
    return false
  }

  const approval = approvalResult.data as unknown as {
    decision: string
  }

  return approval.decision === 'approved'
}

/**
 * Get approved keyword IDs from a list of keyword IDs
 * 
 * @param keywordIds - Array of keyword IDs to check
 * @returns Array of keyword IDs that have approved subtopics
 */
export async function getApprovedKeywordIds(keywordIds: string[]): Promise<string[]> {
  if (!keywordIds || keywordIds.length === 0) {
    return []
  }

  const supabase = await createServiceRoleClient()

  const approvalResult = await supabase
    .from('intent_approvals')
    .select('entity_id')
    .in('entity_id', keywordIds)
    .eq('entity_type', 'keyword')
    .eq('approval_type', 'subtopics')
    .eq('decision', 'approved')

  if (approvalResult.error || !approvalResult.data) {
    return []
  }

  const approvals = approvalResult.data as unknown as Array<{
    entity_id: string
  }>

  return approvals.map(approval => approval.entity_id)
}

/**
 * Check if all keywords in the workflow have approved subtopics and trigger Step 9 if ready
 * 
 * @param keywordId - The keyword ID that was just approved
 * @param organizationId - The organization ID for validation
 * @param userId - The user ID for audit logging
 */
async function checkAndTriggerWorkflowCompletion(
  keywordId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Get the workflow ID from the keyword
  const { data: keyword } = await supabase
    .from('keywords')
    .select('workflow_id')
    .eq('id', keywordId)
    .single()

  if (!keyword) {
    console.error(`[SubtopicApproval] Cannot find workflow for keyword ${keywordId}`)
    return
  }

  const workflowId = (keyword as any).workflow_id

  // Get current workflow state
  const currentState = await WorkflowFSM.getCurrentState(workflowId)
  
  // Only proceed if workflow is in step_8_subtopics state
  if (currentState !== 'step_8_subtopics') {
    console.log(`[SubtopicApproval] Workflow ${workflowId} not in step_8_subtopics, current: ${currentState}`)
    return
  }

  // Check if ALL keywords in this workflow have approved subtopics
  const { data: allKeywords } = await supabase
    .from('keywords')
    .select('id, subtopics_status')
    .eq('workflow_id', workflowId)
    .eq('organization_id', organizationId)

  if (!allKeywords || allKeywords.length === 0) {
    console.log(`[SubtopicApproval] No keywords found for workflow ${workflowId}`)
    return
  }

  // Get all keyword IDs for this workflow
  const workflowKeywordIds = allKeywords.map(k => (k as any).id)

  // Get approved keyword IDs
  const approvedKeywordIds = await getApprovedKeywordIds(workflowKeywordIds)

  // Check if all keywords have approved subtopics
  const allApproved = workflowKeywordIds.length === approvedKeywordIds.length

  if (!allApproved) {
    console.log(`[SubtopicApproval] Not all keywords approved yet: ${approvedKeywordIds.length}/${workflowKeywordIds.length}`)
    return
  }

  console.log(`🔥🔥🔥 [SubtopicApproval] ALL KEYWORDS APPROVED - Triggering Step 9 for workflow ${workflowId}`)

  // Bulletproof boundary transition - emission guaranteed
  const result = await transitionAndTrigger(
    workflowId,
    'step_8_subtopics',
    'HUMAN_SUBTOPICS_APPROVED',
    userId
  )

  if (!result.success) {
    console.log(`⚠️⚠️⚠️ [SubtopicApproval] Boundary transition failed for ${workflowId}: ${result.error}`)
    return
  }

  console.log(`✅✅✅ [SubtopicApproval] Boundary transition completed for workflow ${workflowId}`)
}
