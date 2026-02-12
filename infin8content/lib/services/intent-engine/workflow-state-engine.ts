/**
 * Workflow State Engine - Centralized Atomic State Machine
 * Handles all workflow transitions with database-level atomicity
 * 
 * This is the single source of truth for workflow state progression.
 * All steps must use this engine for transitions.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface WorkflowTransitionRequest {
  workflowId: string
  organizationId: string
  fromStep: number
  toStep: number
  status: string
}

export interface WorkflowTransitionResult {
  success: boolean
  workflow?: {
    id: string
    current_step: number
    status: string
  }
  error?: string
}

/**
 * Centralized atomic workflow transition
 * 
 * Pattern:
 * 1. Attempt atomic transition with WHERE clause
 * 2. If 0 rows updated → another request won the race
 * 3. If 1 row updated → you won the race, execute side effects
 * 
 * This prevents:
 * - Concurrent requests from advancing simultaneously
 * - Race conditions in state progression
 */
export async function transitionWorkflow(
  request: WorkflowTransitionRequest
): Promise<WorkflowTransitionResult> {
  const supabase = createServiceRoleClient()

  // ATOMIC TRANSITION: Only update if workflow is at expected step
  // WHERE clause ensures only one request can advance at a time
  const { data: workflow, error: updateError } = await supabase
    .from('intent_workflows')
    .update({
      current_step: request.toStep,
      status: request.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', request.workflowId)
    .eq('organization_id', request.organizationId)
    .eq('current_step', request.fromStep)
    .select('id, current_step, status')
    .single()

  if (updateError || !workflow) {
    console.error('[WorkflowStateEngine] Atomic transition failed:', updateError)
    return {
      success: false,
      error: 'TRANSITION_FAILED'
    }
  }

  console.log(`[WorkflowStateEngine] Transition successful: ${request.workflowId} ${request.fromStep} → ${request.toStep}`)

  return {
    success: true,
    workflow: workflow as any
  }
}

/**
 * Get current workflow state
 */
export async function getWorkflowState(
  workflowId: string,
  organizationId: string
) {
  const supabase = createServiceRoleClient()

  const { data: workflow, error } = await supabase
    .from('intent_workflows')
    .select('id, current_step, status, version, created_at, updated_at')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, workflow }
}

/**
 * Validate workflow is in expected state
 */
export async function validateWorkflowStep(
  workflowId: string,
  organizationId: string,
  expectedStep: number
): Promise<{ valid: boolean; currentStep?: number; error?: string }> {
  const supabase = createServiceRoleClient()

  const { data: workflow, error } = await supabase
    .from('intent_workflows')
    .select('current_step')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .single()

  if (error) {
    return { valid: false, error: 'Workflow not found' }
  }

  if ((workflow as any).current_step !== expectedStep) {
    return {
      valid: false,
      currentStep: (workflow as any).current_step,
      error: `Workflow is at step ${(workflow as any).current_step}, expected ${expectedStep}`
    }
  }

  return { valid: true, currentStep: expectedStep }
}
