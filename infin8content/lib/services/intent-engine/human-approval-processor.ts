/**
 * Human Approval Processor Service - FSM Hardened Version
 * Story 37.3: Implement Human Approval Gate (Workflow-Level)
 * 
 * This service handles the final human approval logic for workflows
 * using ONLY FSM transitions - no direct database mutations.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import { WorkflowState } from '@/lib/fsm/workflow-events'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

export interface HumanApprovalRequest {
  decision: 'approved' | 'rejected'
  feedback?: string
  reset_to_step?: number // 1–7, required if rejected
}

export interface HumanApprovalResponse {
  success: boolean
  approval_id: string
  workflow_state: WorkflowState
  message: string
}

export interface WorkflowSummary {
  workflow_id: string
  state: WorkflowState
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

const RESET_STEP_MAP: Record<number, WorkflowState> = {
  1: 'step_1_icp',
  2: 'step_2_competitors',
  3: 'step_3_seeds',
  4: 'step_4_longtails',
  5: 'step_5_filtering',
  6: 'step_6_clustering',
  7: 'step_7_validation',
}

/**
 * Process human approval for a workflow using ONLY FSM transitions
 * 
 * This function NEVER directly mutates intent_workflows table.
 * All state changes go through WorkflowFSM.transition().
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

  // Validate workflow exists and is at correct step - READ ONLY
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id, created_at, updated_at, icp_document, competitor_analysis')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    organization_id: string
    created_at: string
    updated_at: string
    icp_document: any
    competitor_analysis: any
    state: string
  }

  // ENFORCE STRICT LINEAR PROGRESSION: Allow human approval at step_8_subtopics or step_8_subtopics_running
  // This handles both manual triggering and cases where automation hasn't started yet
  if (workflow.state !== 'step_8_subtopics' && workflow.state !== 'step_8_subtopics_running') {
    throw new Error(`Workflow must be at step_8_subtopics or step_8_subtopics_running for human approval, current state: ${workflow.state}`)
  }

  // Validate user belongs to the same organization as the workflow
  if (workflow.organization_id !== currentUser.org_id) {
    throw new Error('Access denied: workflow belongs to different organization')
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

  let finalState: WorkflowState

  // FSM TRANSITION: Handle decision through state machine ONLY
  if (decision === 'approved') {
    // Approved: Advance to Step 9 (Article Generation) via FSM
    const result = await WorkflowFSM.transition(workflowId, 'HUMAN_SUBTOPICS_APPROVED', { 
      userId: currentUser.id 
    })
    finalState = result.nextState
  } else if (decision === 'rejected' && reset_to_step) {
    // Rejected: Reset to specified step via FSM
    // 🔁 REGRESSION EXCEPTION: Human approval can reset workflow
    // This is the ONLY place where regression is allowed:
    // - Only admins can trigger via rejection
    // - Only steps 1-7 allowed as reset targets
    // - FSM validates reset targets
    const resetState = RESET_STEP_MAP[reset_to_step]
    const resetResult = await WorkflowFSM.transition(workflowId, 'HUMAN_RESET', { 
      userId: currentUser.id,
      resetTo: resetState
    })
    finalState = resetResult.nextState
  } else {
    throw new Error('Invalid approval decision')
  }

  // Log audit action
  let auditAction: string
  if (decision === 'approved') {
    auditAction = 'WORKFLOW_HUMAN_APPROVAL_APPROVED'
  } else {
    auditAction = 'WORKFLOW_HUMAN_APPROVAL_REJECTED'
  }

  logActionAsync({
    orgId: currentUser.org_id,
    userId: currentUser.id,
    action: auditAction as any,
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
    workflow_state: finalState,
    message,
  }
}

/**
 * Get workflow summary for human review - READ ONLY
 * 
 * This function NEVER mutates workflow state.
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

  // Get workflow details - READ ONLY
  const workflowResult = await supabase
    .from('intent_workflows')
    .select('id, state, organization_id, created_at, updated_at, icp_document, competitor_analysis')
    .eq('id', workflowId)
    .single()

  if (workflowResult.error || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data as unknown as {
    id: string
    state: string
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
    state: workflow.state as WorkflowState,
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
