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
  article_status: 'not_started' | 'in_progress' | 'completed' | 'failed'
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
  const newArticleStatus = 'not_started'

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
  const { data: existingApproval } = await supabase
    .from('intent_approvals')
    .select('approved_items')
    .eq('workflow_id', workflowId)
    .eq('approval_type', 'subtopics')
    .single() as { data: { approved_items: string[] } | null }

  let approvedItems: string[] = []

  if (existingApproval?.approved_items) {
    approvedItems = existingApproval.approved_items as string[]
  }

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
    await checkAndTriggerWorkflowCompletion(workflowId, currentUser.org_id, currentUser.id)
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
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Get current workflow state
  // Use unified engine to maintain architectural closure
  const { getWorkflowState } = await import('@/lib/fsm/unified-workflow-engine')
  const currentState = await getWorkflowState(workflowId)

  console.log(`🔍 [SubtopicApproval] Workflow ${workflowId} current state: ${currentState}`)

  // Only proceed if workflow is in step_8_subtopics state
  if (currentState !== 'step_8_subtopics') {
    console.log(`❌ [SubtopicApproval] Workflow ${workflowId} not in step_8_subtopics, current: ${currentState}`)
    return
  }

  console.log(`✅ [SubtopicApproval] Workflow ${workflowId} state check passed: step_8_subtopics`)

  // Check if ALL keywords with completed subtopics in this workflow have been approved
  const { data: allKeywords, error: keywordsError } = await supabase
    .from('keywords')
    .select('id, subtopics_status')
    .eq('workflow_id', workflowId)
    .eq('organization_id', organizationId)
    .eq('subtopics_status', 'completed') // Only keywords with completed subtopics

  if (keywordsError) {
    console.error(`❌ [SubtopicApproval] Database error fetching keywords: ${keywordsError.message}`)
    return
  }

  if (!allKeywords || allKeywords.length === 0) {
    console.log(`❌ [SubtopicApproval] No keywords with completed subtopics found for workflow ${workflowId}`)
    return
  }

  console.log(`✅ [SubtopicApproval] Found ${allKeywords.length} keywords with completed subtopics`)

  // Get all keyword IDs for this workflow
  const workflowKeywordIds = allKeywords.map(k => (k as any).id)

  // P2: pass workflowId so query is scoped to the correct approval row
  const approvedKeywordIds = await getApprovedKeywordIds(workflowId, workflowKeywordIds)

  console.log(`🔍 [SubtopicApproval] Approval check: ${approvedKeywordIds.length}/${workflowKeywordIds.length} approved`)

  // Check if all keywords have approved subtopics
  const allApproved = workflowKeywordIds.length === approvedKeywordIds.length

  if (!allApproved) {
    console.log(`❌ [SubtopicApproval] Not all keywords approved yet: ${approvedKeywordIds.length}/${workflowKeywordIds.length}`)
    console.log(`🔍 [SubtopicApproval] Unapproved keywords: ${workflowKeywordIds.filter(id => !approvedKeywordIds.includes(id))}`)
    return
  }

  console.log(`🔥🔥🔥 [SubtopicApproval] ALL KEYWORDS APPROVED - Triggering Step 9 for workflow ${workflowId}`)

  // Unified transition - automatic event emission guaranteed
  const result = await transitionWithAutomation(
    workflowId,
    'HUMAN_SUBTOPICS_APPROVED',
    userId
  )

  console.log(`🔍 [SubtopicApproval] Transition result:`, result)

  if (!result.success) {
    console.log(`❌❌❌ [SubtopicApproval] Unified transition failed for ${workflowId}: ${result.error}`)
    console.log(`🔍 [SubtopicApproval] Transition details:`, JSON.stringify(result, null, 2))
    return
  }

  console.log(`✅✅✅ [SubtopicApproval] Unified transition completed for workflow ${workflowId}`)
  console.log(`🔍 [SubtopicApproval] Transition result details:`, JSON.stringify(result, null, 2))
}
