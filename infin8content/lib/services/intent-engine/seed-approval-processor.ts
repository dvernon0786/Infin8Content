/**
 * Seed Approval Processor Service
 * Story 35.3: Approve Seed Keywords Before Expansion
 * 
 * This service handles the governance logic for approving seed keywords
 * before they are eligible for long-tail expansion.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

export interface SeedApprovalRequest {
  decision: 'approved' | 'rejected'
  feedback?: string
  approved_keyword_ids?: string[] // Optional subset for partial approval
}

export interface SeedApprovalResponse {
  success: boolean
  approval_id: string
  workflow_status: 'step_3_seeds'
  message: string
}

/**
 * Process seed keyword approval for a workflow
 * 
 * @param workflowId - The workflow ID to approve seeds for
 * @param approvalRequest - The approval decision and metadata
 * @param headers - Request headers for audit logging (optional)
 * @returns Approval response with status
 */
export async function processSeedApproval(
  workflowId: string,
  approvalRequest: SeedApprovalRequest,
  headers?: Headers
): Promise<SeedApprovalResponse> {
  const { decision, feedback, approved_keyword_ids } = approvalRequest

  // Validate input
  if (!workflowId) {
    throw new Error('Workflow ID is required')
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

  // Validate workflow exists and is at correct step
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, status, organization_id')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    status: string
    organization_id: string
  }

  // Validate workflow is at step_3_seeds
  if (workflow.status !== 'step_3_seeds') {
    throw new Error('Workflow must be at step_3_seeds for seed approval')
  }

  // Validate user belongs to the same organization as the workflow
  if (workflow.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: workflow belongs to different organization')
  }

  // Validate approved_keyword_ids if provided for approved decisions
  if (decision === 'approved' && approved_keyword_ids) {
    if (!Array.isArray(approved_keyword_ids) || approved_keyword_ids.length === 0) {
      throw new Error('Approved keyword IDs must be a non-empty array when provided')
    }

    // Validate UUID format for each keyword ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    for (const keywordId of approved_keyword_ids) {
      if (!uuidRegex.test(keywordId)) {
        throw new Error(`Invalid keyword ID format: ${keywordId}`)
      }
    }
  }

  // Create or update approval record (idempotent)
  const approvalData = {
    workflow_id: workflowId,
    approval_type: 'seed_keywords',
    decision,
    approver_id: currentUser.id,
    feedback: feedback || null,
    approved_items: decision === 'approved' && approved_keyword_ids ? approved_keyword_ids : null,
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
  const auditAction = decision === 'approved' 
    ? AuditAction.WORKFLOW_SEED_KEYWORDS_APPROVED 
    : AuditAction.WORKFLOW_SEED_KEYWORDS_REJECTED

  logActionAsync({
    orgId: currentUser.org_id,
    userId: currentUser.id,
    action: auditAction,
    details: {
      workflow_id: workflowId,
      approved_keyword_ids: approved_keyword_ids || null,
      feedback: feedback || null,
    },
    ipAddress: headers ? extractIpAddress(headers) : null,
    userAgent: headers ? extractUserAgent(headers) : null,
  })

  // Return success response
  const message = decision === 'approved' 
    ? 'Seed keywords approved successfully'
    : 'Seed keywords rejected successfully'

  return {
    success: true,
    approval_id: approval.id,
    workflow_status: 'step_3_seeds', // Status unchanged - this is a governance gate
    message,
  }
}

/**
 * Check if seed keywords are approved for a workflow
 * 
 * @param workflowId - The workflow ID to check
 * @returns True if seeds are approved, false otherwise
 */
export async function areSeedsApproved(workflowId: string): Promise<boolean> {
  if (!workflowId) {
    return false
  }

  const supabase = await createServiceRoleClient()

  const approvalResult = await supabase
    .from('intent_approvals')
    .select('decision')
    .eq('workflow_id', workflowId)
    .eq('approval_type', 'seed_keywords')
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
 * Get approved seed keyword IDs for a workflow
 * 
 * @param workflowId - The workflow ID to get approved keywords for
 * @returns Array of approved keyword IDs, or empty array if not approved
 */
export async function getApprovedSeedKeywordIds(workflowId: string): Promise<string[]> {
  if (!workflowId) {
    return []
  }

  const supabase = await createServiceRoleClient()

  const approvalResult = await supabase
    .from('intent_approvals')
    .select('decision, approved_items')
    .eq('workflow_id', workflowId)
    .eq('approval_type', 'seed_keywords')
    .single()

  if (approvalResult.error || !approvalResult.data) {
    return []
  }

  const approval = approvalResult.data as unknown as {
    decision: string
    approved_items: string[] | null
  }

  if (approval.decision !== 'approved') {
    return []
  }

  // If approved_items is null, it means all seeds are approved (full approval)
  // In this case, the caller should fetch all seeds for the workflow
  if (!approval.approved_items) {
    return [] // Empty array signals "all seeds approved"
  }

  // Return the specific approved keyword IDs
  return approval.approved_items as string[]
}
