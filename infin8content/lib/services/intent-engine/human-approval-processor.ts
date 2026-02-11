/**
 * Human Approval Processor Service
 * Story 37.3: Implement Human Approval Gate (Workflow-Level)
 * 
 * This service handles the final human approval logic for workflows
 * before they are eligible for article generation.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { type WorkflowState, assertValidWorkflowState } from '@/lib/constants/intent-workflow-steps'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction, AuditActionType } from '@/types/audit'

const CANONICAL_RESET_MAP: Record<string, WorkflowState> = {
  1: 'step_1_icp',
  2: 'step_2_competitors',
  3: 'step_3_keywords',
  4: 'step_4_longtails',
  5: 'step_5_filtering',
  6: 'step_6_clustering',
  7: 'step_7_validation',
};

export interface HumanApprovalRequest {
  decision: 'approved' | 'rejected'
  feedback?: string
  reset_to_step?: number // 1–7, required if rejected
}

export interface HumanApprovalResponse {
  success: boolean
  approval_id: string
  workflow_status: string
  message: string
}

export interface WorkflowSummary {
  workflow_id: string
  status: string
  organization_id: string
  created_at: string
  updated_at: string
  icp_document: any
  competitor_analysis: any
  seed_keywords: any[]
  longtail_keywords: any[]
  topic_clusters: any[]
  validation_results: any[]
  approved_keywords: any[]
  summary_statistics: {
    total_keywords: number
    seed_keywords_count: number
    longtail_keywords_count: number
    topic_clusters_count: number
    approved_keywords_count: number
  }
}

/**
 * Process human approval for a workflow
 * 
 * @param workflowId - The workflow ID to approve
 * @param approvalRequest - The approval decision and metadata
 * @param headers - Request headers for audit logging (optional)
 * @returns Approval response with status
 */
export async function processHumanApproval(
  workflowId: string,
  approvalRequest: HumanApprovalRequest,
  headers?: Headers
): Promise<HumanApprovalResponse> {
  const { decision, feedback, reset_to_step } = approvalRequest

  // Validate input
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Decision must be either "approved" or "rejected"')
  }

  // If rejected, reset_to_step is required and must be between 1 and 7
  if (decision === 'rejected') {
    if (!reset_to_step || reset_to_step < 1 || reset_to_step > 7) {
      throw new Error('reset_to_step is required and must be between 1 and 7 when rejected')
    }
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
    .select('*')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    status: string
    organization_id: string
    created_at: string
    updated_at: string
    icp_document: any
    competitor_analysis: any
    current_step: number
  }

  // ENFORCE STRICT LINEAR PROGRESSION: Only allow step 8 when current_step = 8
  if (workflow.current_step !== 8) {
    throw new Error(`Workflow must be at step 8 (human approval), currently at step ${workflow.current_step}`)
  }

  // Validate user belongs to the same organization as the workflow
  if (workflow.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: workflow belongs to different organization')
  }

  // Start the approval process by setting workflow to step_8_subtopics
  const updateResult = await supabase
    .from('intent_workflows')
    .update({ 
      status: 'step_8_subtopics',
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)

  if (updateResult.error) {
    console.error('Failed to update workflow status:', updateResult.error)
    throw new Error('Failed to update workflow status')
  }

  // Create or update approval record (idempotent)
  const approvalData = {
    workflow_id: workflowId,
    approval_type: 'human_approval',
    decision,
    approver_id: currentUser.id,
    feedback: feedback || null,
    reset_to_step: decision === 'rejected' ? reset_to_step : null,
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

  // Update workflow status based on decision
  let finalStatus: WorkflowState
  if (decision === 'approved') {
    finalStatus = 'step_9_articles'
  } else {
    if (!reset_to_step || !CANONICAL_RESET_MAP[reset_to_step.toString()]) {
      throw new Error('Invalid reset_to_step: must be 1-7')
    }
    finalStatus = CANONICAL_RESET_MAP[reset_to_step.toString()]
    assertValidWorkflowState(finalStatus)
  }

  // Update workflow to final status
  const updateData: any = { 
    status: finalStatus,
    updated_at: new Date().toISOString()
  }
  
  // CANONICAL TRANSITION: Update current_step based on decision
  if (decision === 'approved') {
    // Approved: Advance to Step 9 (Article Generation)
    updateData.current_step = 9
  } else if (decision === 'rejected' && reset_to_step) {
    // 
    // 🔁 REGRESSION EXCEPTION: Human approval can reset workflow
    // 
    // This is the ONLY place where regression is allowed:
    // - Only admins can trigger via rejection
    // - Only steps 1-7 allowed as reset targets
    // - Must update both current_step and status consistently
    // 
    // All other steps 1-7,9: No regression allowed
    //
    updateData.current_step = reset_to_step
  }
  
  const finalUpdateResult = await supabase
    .from('intent_workflows')
    .update(updateData)
    .eq('id', workflowId)

  if (finalUpdateResult.error) {
    console.error('Failed to update workflow to final status:', finalUpdateResult.error)
    throw new Error('Failed to update workflow to final status')
  }

  // Log audit action
  let auditAction: AuditActionType
  if (decision === 'approved') {
    auditAction = AuditAction.WORKFLOW_HUMAN_APPROVAL_APPROVED
  } else {
    auditAction = AuditAction.WORKFLOW_HUMAN_APPROVAL_REJECTED
  }

  logActionAsync({
    orgId: currentUser.org_id,
    userId: currentUser.id,
    action: auditAction,
    details: {
      workflow_id: workflowId,
      decision,
      feedback: feedback || null,
      reset_to_step: decision === 'rejected' ? reset_to_step : null,
    },
    ipAddress: headers ? extractIpAddress(headers) : null,
    userAgent: headers ? extractUserAgent(headers) : null,
  })

  // Return success response
  const message = decision === 'approved' 
    ? 'Workflow approved successfully'
    : `Workflow rejected and reset to step ${reset_to_step}`

  return {
    success: true,
    approval_id: approval.id,
    workflow_status: finalStatus,
    message,
  }
}

/**
 * Get workflow summary for human review
 * 
 * @param workflowId - The workflow ID to summarize
 * @returns Complete workflow summary
 */
export async function getWorkflowSummary(workflowId: string): Promise<WorkflowSummary> {
  if (!workflowId) {
    throw new Error('Workflow ID is required')
  }

  // Get current user and validate authentication
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    throw new Error('Authentication required')
  }

  // Create Supabase client
  const supabase = await createServiceRoleClient()

  // Get workflow details
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('*')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    status: string
    organization_id: string
    created_at: string
    updated_at: string
    icp_document: any
    competitor_analysis: any
  }

  // Validate user belongs to the same organization as the workflow
  if (workflow.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: workflow belongs to different organization')
  }

  // Get seed keywords
  const seedKeywordsResult = await supabase
    .from('keywords')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('keyword_type', 'seed')
    .order('created_at', { ascending: true })

  const seedKeywords = seedKeywordsResult.data || []

  // Get longtail keywords
  const longtailKeywordsResult = await supabase
    .from('keywords')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('keyword_type', 'longtail')
    .order('created_at', { ascending: true })

  const longtailKeywords = longtailKeywordsResult.data || []

  // Get topic clusters
  const topicClustersResult = await supabase
    .from('topic_clusters')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: true })

  const topicClusters = topicClustersResult.data || []

  // Get validation results
  const validationResultsResult = await supabase
    .from('cluster_validation_results')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: true })

  const validationResults = validationResultsResult.data || []

  // Get approved keywords (those ready for article generation)
  const approvedKeywordsResult = await supabase
    .from('keywords')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('article_status', 'ready')
    .order('created_at', { ascending: true })

  const approvedKeywords = approvedKeywordsResult.data || []

  // Calculate summary statistics
  const summaryStatistics = {
    total_keywords: seedKeywords.length + longtailKeywords.length,
    seed_keywords_count: seedKeywords.length,
    longtail_keywords_count: longtailKeywords.length,
    topic_clusters_count: topicClusters.length,
    approved_keywords_count: approvedKeywords.length,
  }

  return {
    workflow_id: workflowId,
    status: workflow.status,
    organization_id: workflow.organization_id,
    created_at: workflow.created_at,
    updated_at: workflow.updated_at,
    icp_document: workflow.icp_document,
    competitor_analysis: workflow.competitor_analysis,
    seed_keywords: seedKeywords,
    longtail_keywords: longtailKeywords,
    topic_clusters: topicClusters,
    validation_results: validationResults,
    approved_keywords: approvedKeywords,
    summary_statistics: summaryStatistics,
  }
}

/**
 * Check if human approval is required for a workflow
 * 
 * @param workflowId - The workflow ID to check
 * @returns True if human approval is required, false otherwise
 */
export async function isHumanApprovalRequired(workflowId: string): Promise<boolean> {
  if (!workflowId) {
    return false
  }

  const supabase = await createServiceRoleClient()

  const workflowResult = await supabase
    .from('intent_workflows')
    .select('status')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    return false
  }

  const workflow = workflowResult.data as unknown as {
    status: string
  }

  return workflow.status === 'step_8_subtopics'
}

/**
 * Get human approval status for a workflow
 * 
 * @param workflowId - The workflow ID to check
 * @returns Approval status or null if not found
 */
export async function getHumanApprovalStatus(workflowId: string): Promise<{
  decision: string
  approver_id: string
  feedback: string | null
  reset_to_step: number | null
  created_at: string
} | null> {
  if (!workflowId) {
    return null
  }

  const supabase = await createServiceRoleClient()

  const approvalResult = await supabase
    .from('intent_approvals')
    .select('decision, approver_id, feedback, reset_to_step, created_at')
    .eq('workflow_id', workflowId)
    .eq('approval_type', 'human_approval')
    .single()

  if (approvalResult.error || !approvalResult.data) {
    return null
  }

  return approvalResult.data as unknown as {
    decision: string
    approver_id: string
    feedback: string | null
    reset_to_step: number | null
    created_at: string
  }
}
