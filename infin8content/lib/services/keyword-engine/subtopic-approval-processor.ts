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
import { transitionWithAutomation } from '@/lib/fsm/unified-workflow-engine'

export interface SubtopicApprovalRequest {
  decision: 'approved' | 'rejected'
  feedback?: string
}

export interface SubtopicApprovalResponse {
  success: boolean
  decision: 'approved' | 'rejected'
  keyword_id: string
  article_status: 'not_started' | 'ready' | 'rejected' | 'in_progress' | 'completed' | 'failed'
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

  // Validate user is organization admin or owner
  if (!['admin', 'owner'].includes(currentUser.role)) {
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
  if (keyword.subtopics_status !== 'completed') {
    throw new Error('Subtopics must be complete before approval')
  }

  // Validate subtopics exist
  if (!keyword.subtopics || keyword.subtopics.length === 0) {
    throw new Error('No subtopics found for approval')
  }

  // Update keyword article_status based on decision
  // Approve -> 'ready' (eligible for generation)
  // Reject  -> 'rejected' (explicit user removal)
  if (decision === 'approved') {
    const keywordUpdateResult = await supabase
      .from('keywords')
      .update({
        article_status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', keywordId)
      .select('id')
      .single()

    if (keywordUpdateResult.error || !keywordUpdateResult.data) {
      console.error('Failed to update keyword status:', keywordUpdateResult.error)
      throw new Error('Failed to update keyword status')
    }
  } else {
    const keywordUpdateResult = await supabase
      .from('keywords')
      .update({
        article_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', keywordId)
      .select('id')
      .single()

    if (keywordUpdateResult.error || !keywordUpdateResult.data) {
      console.error('Failed to mark keyword rejected:', keywordUpdateResult.error)
      throw new Error('Failed to update keyword status')
    }
  }

  // Get workflow_id for approval record
  const { data: workflowRow } = await supabase
    .from('keywords')
    .select('workflow_id')
    .eq('id', keywordId)
    .single() as { data: { workflow_id: string } | null }

  if (!workflowRow?.workflow_id) {
    throw new Error('Workflow not found for keyword')
  }

  // Extract for use throughout this function scope
  const workflowId = workflowRow.workflow_id

  // Get existing approval to merge approved_items
  const { data, error: existingError } = await supabase
    .from('intent_approvals')
    .select('approved_items')
    .eq('workflow_id', workflowId)
    .eq('approval_type', 'subtopics')
    .maybeSingle()

  if (existingError) {
    throw new Error(`Failed to fetch existing approval: ${existingError.message}`)
  }

  const existingApproval = data as { approved_items: string[] } | null
  let approvedItems: string[] = existingApproval?.approved_items ?? []

  // Mutate array properly
  if (decision === 'approved') {
    if (!approvedItems.includes(keywordId)) {
      approvedItems.push(keywordId)
    }
  } else {
    approvedItems = approvedItems.filter(id => id !== keywordId)
  }

  // Create or update approval record (idempotent)
  const approvalData = {
    workflow_id: workflowId,
    approval_type: 'subtopics',
    decision: 'approved', // row represents overall status
    approver_id: currentUser.id,
    feedback: null,
    approved_items: approvedItems,
  }

  const approvalResult = await supabase
    .from('intent_approvals')
    .upsert(approvalData, {
      onConflict: 'workflow_id,approval_type',
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
  // P5: pass workflowId (already resolved above) — not keywordId
  if (decision === 'approved') {
    await checkAndTriggerWorkflowCompletion(workflowId, currentUser.id)
  }

  // Return success response
  const message = decision === 'approved'
    ? 'Subtopics approved successfully'
    : 'Subtopics rejected successfully'

  return {
    success: true,
    decision,
    keyword_id: keywordId,
    article_status: decision === 'approved' ? 'ready' : 'rejected',
    message,
  }
}

/**
 * Get approved keyword IDs from a list of keyword IDs within a specific workflow.
 *
 * NOTE: areSubtopicsApproved() was removed — it queried entity_id/entity_type
 * columns that do not exist on intent_approvals and always returned false.
 *
 * @param workflowId  - The workflow that owns the approval row (required for correct scoping)
 * @param keywordIds  - Candidate keyword IDs to intersect against approved_items
 * @returns Array of keyword IDs present in approved_items for this workflow
 */
export async function getApprovedKeywordIds(
  workflowId: string,
  keywordIds: string[]
): Promise<string[]> {
  if (!workflowId || !keywordIds || keywordIds.length === 0) {
    return []
  }

  const supabase = await createServiceRoleClient()

  const { data } = await supabase
    .from('intent_approvals')
    .select('approved_items')
    .eq('workflow_id', workflowId)
    .eq('approval_type', 'subtopics')
    .single() as { data: { approved_items: string[] } | null }

  if (!data?.approved_items) return []

  const approvedItems = data.approved_items as string[]

  return approvedItems.filter(id => keywordIds.includes(id))
}

/**
 * Deterministically process bulk approval for multiple keywords from Step 8.
 * Overwrites the approved_items array instead of incremental append to prevent race conditions.
 *
 * @param workflowId - The workflow ID
 * @param approvedKeywordIds - Array of approved keyword IDs
 * @param headers - Request headers for audit logging
 */
export async function processBulkSubtopicApproval(
  workflowId: string,
  headers?: Headers
) {
  if (!workflowId) throw new Error('Workflow ID is required')

  const currentUser = await getCurrentUser()
  if (!currentUser?.org_id) throw new Error('Authentication required')
  if (!['admin', 'owner'].includes(currentUser.role)) throw new Error('Admin access required')

  const supabase = await createServiceRoleClient()

  // Single UPDATE — set all non-rejected (still 'not_started') keywords to 'ready'
  const { data: updatedKeywords, error } = await supabase
    .from('keywords')
    .update({
      article_status: 'ready',
      updated_at: new Date().toISOString()
    })
    .eq('workflow_id', workflowId)
    .eq('subtopics_status', 'completed')
    .eq('article_status', 'not_started')
    .select('id')

  if (error) {
    console.error('Failed to bulk approve keywords:', error)
    throw new Error('Failed to bulk approve keywords')
  }

  const approvedCount = updatedKeywords?.length ?? 0

  console.log(`[BulkApprove] Set ${approvedCount} keywords to 'ready' for workflow ${workflowId}`)

  // Audit log
  logActionAsync({
    orgId: currentUser.org_id,
    userId: currentUser.id,
    action: AuditAction.KEYWORD_SUBTOPICS_APPROVED,
    details: { workflow_id: workflowId, count: approvedCount, decision: 'approved_bulk' },
    ipAddress: headers ? extractIpAddress(headers) : null,
    userAgent: headers ? extractUserAgent(headers) : null,
  })

  // Check and trigger step 9
  await checkAndTriggerWorkflowCompletion(workflowId, currentUser.id)

  return { success: true, message: `${approvedCount} keywords approved for article generation` }
}

/**
 * Check if all keywords in the workflow have approved subtopics and trigger Step 9 if ready.
 * 
 * P5: workflowId passed in directly — already resolved in processSubtopicApproval.
 * No additional keyword → workflow_id DB lookup needed.
 * 
 * @param workflowId     - The workflow that owns the keywords (pre-resolved by caller)
 * @param organizationId - The organization ID for row isolation
 * @param userId         - The user ID for audit logging
 */
async function checkAndTriggerWorkflowCompletion(
  workflowId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient()
  const { getWorkflowState } = await import('@/lib/fsm/unified-workflow-engine')
  const currentState = await getWorkflowState(workflowId)

  if (currentState !== 'step_8_subtopics') return

  // Count keywords with completed subtopics that are NOT yet approved ('not_started')
  const { count, error } = await supabase
    .from('keywords')
    .select('id', { count: 'exact', head: true })
    .eq('workflow_id', workflowId)
    .eq('subtopics_status', 'completed')
    .eq('article_status', 'not_started')

  if (error) {
    console.error(`[SubtopicApproval] Error counting pending keywords: ${error.message}`)
    return
  }

  if (count === null || count > 0) {
    console.log(`[SubtopicApproval] ${count} keywords still pending approval`)
    return
  }

  console.log(`[SubtopicApproval] All keywords resolved → triggering step 9`)

  const result = await transitionWithAutomation(workflowId, 'HUMAN_SUBTOPICS_APPROVED', userId)

  if (!result.success) {
    console.error(`[SubtopicApproval] Transition failed: ${result.error}`)
  }
}
