/**
 * Workflow Transition Audit Logging
 * Enterprise-grade audit trail for all workflow state transitions
 */

import { WorkflowState } from '@/types/workflow-state'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface WorkflowTransitionAudit {
  workflow_id: string
  organization_id: string
  previous_state: WorkflowState | null
  new_state: WorkflowState
  transition_reason: string
  transitioned_at: string
  user_id?: string
  metadata?: Record<string, any>
}

/**
 * Logs a workflow state transition for enterprise audit compliance
 * Critical for analytics, compliance, and debugging
 */
export async function logWorkflowTransition(transition: WorkflowTransitionAudit): Promise<void> {
  const supabase = createServiceRoleClient()
  
  const { error } = await supabase
    .from('workflow_transition_audit')
    .insert({
      workflow_id: transition.workflow_id,
      organization_id: transition.organization_id,
      previous_state: transition.previous_state,
      new_state: transition.new_state,
      transition_reason: transition.transition_reason,
      transitioned_at: transition.transitioned_at,
      user_id: transition.user_id || null,
      metadata: transition.metadata || {}
    })
  
  if (error) {
    console.error('[WorkflowAudit] Failed to log transition:', error)
    // In production, this should trigger an alert
    // For now, we log but don't fail the transition
  }
}

/**
 * Gets transition history for a specific workflow
 * Used for analytics and debugging
 */
export async function getWorkflowTransitionHistory(
  workflowId: string,
  organizationId: string
): Promise<WorkflowTransitionAudit[]> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('workflow_transition_audit')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('organization_id', organizationId)
    .order('transitioned_at', { ascending: true })
  
  if (error) {
    console.error('[WorkflowAudit] Failed to get transition history:', error)
    return []
  }
  
  return data as WorkflowTransitionAudit[]
}

/**
 * Calculates time spent in each state for analytics
 * Enterprise workflow cores track state duration metrics
 */
export async function getStateDurations(
  workflowId: string,
  organizationId: string
): Promise<{ state: WorkflowState; durationMs: number }[]> {
  const transitions = await getWorkflowTransitionHistory(workflowId, organizationId)
  const durations: { state: WorkflowState; durationMs: number }[] = []
  
  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i]
    const nextTransition = transitions[i + 1]
    
    if (nextTransition) {
      const startTime = new Date(transition.transitioned_at).getTime()
      const endTime = new Date(nextTransition.transitioned_at).getTime()
      durations.push({
        state: transition.new_state,
        durationMs: endTime - startTime
      })
    }
  }
  
  return durations
}

/**
 * Gets funnel analytics for organization workflows
 * Enterprise systems track drop-off per step
 */
export async function getWorkflowFunnelAnalytics(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<{ step: number; count: number; dropoffRate: number }[]> {
  const supabase = createServiceRoleClient()
  
  // Get all workflows in the date range
  const { data: workflows, error: workflowsError } = await supabase
    .from('intent_workflows')
    .select('id, state, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  
  if (workflowsError || !workflows) {
    console.error('[WorkflowAudit] Failed to get workflows for funnel:', workflowsError)
    return []
  }
  
  // Import here to avoid circular dependency
  const { getStepFromState } = await import('./workflow-progression')
  
  // Count workflows per step
  const stepCounts = new Map<number, number>()
  workflows.forEach(workflow => {
    const step = getStepFromState(workflow.state)
    stepCounts.set(step, (stepCounts.get(step) || 0) + 1)
  })
  
  // Calculate drop-off rates
  const totalWorkflows = workflows.length
  const funnel = Array.from(stepCounts.entries())
    .map(([step, count]) => ({
      step,
      count,
      dropoffRate: totalWorkflows > 0 ? (totalWorkflows - count) / totalWorkflows : 0
    }))
    .sort((a, b) => a.step - b.step)
  
  return funnel
}

/**
 * Enhanced transition function with audit logging
 * Wraps the existing transition engine with enterprise audit
 */
export async function transitionWithAudit(
  workflowId: string,
  organizationId: string,
  fromState: WorkflowState,
  toState: WorkflowState,
  reason: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  // Import transition engine
  const { transitionWorkflow } = await import('./transition-engine')
  
  // Perform the transition
  const result = await transitionWorkflow(workflowId, organizationId, fromState, toState)
  
  if (result.success) {
    // Log the transition for audit
    await logWorkflowTransition({
      workflow_id: workflowId,
      organization_id: organizationId,
      previous_state: fromState,
      new_state: toState,
      transition_reason: reason,
      transitioned_at: new Date().toISOString(),
      user_id: userId,
      metadata: metadata
    })
  }
  
  return result
}
