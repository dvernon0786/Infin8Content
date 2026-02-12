/**
 * Workflow State Engine - Centralized Deterministic State Machine
 * Handles all workflow transitions with idempotency, atomicity, and versioning
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
  idempotencyKey?: string
}

export interface WorkflowTransitionResult {
  success: boolean
  workflow?: {
    id: string
    current_step: number
    status: string
    version: number
  }
  error?: string
  isDuplicate?: boolean // True if this is a retry of a previous successful transition
}

/**
 * Centralized atomic workflow transition with idempotency support
 * 
 * Pattern:
 * 1. Check idempotency key (if provided) - return cached result if exists
 * 2. Attempt atomic transition with version check
 * 3. Store idempotency key result for future retries
 * 
 * This prevents:
 * - Duplicate state transitions
 * - Duplicate side effects
 * - Cost waste from retry storms
 */
export async function transitionWorkflow(
  request: WorkflowTransitionRequest
): Promise<WorkflowTransitionResult> {
  const supabase = createServiceRoleClient()

  // IDEMPOTENCY CHECK: If client provides idempotency key, check if we've seen it before
  if (request.idempotencyKey) {
    const { data: existingTransition, error: lookupError } = await supabase
      .from('workflow_transitions')
      .select('workflow_id, from_step, to_step, status, created_at')
      .eq('workflow_id', request.workflowId)
      .eq('idempotency_key', request.idempotencyKey)
      .single()

    if (!lookupError && existingTransition) {
      // This is a retry - return the cached result
      console.log(`[WorkflowStateEngine] Idempotency hit: ${request.workflowId} with key ${request.idempotencyKey}`)
      
      // Fetch current workflow state
      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('id, current_step, status, version')
        .eq('id', request.workflowId)
        .single()

      return {
        success: true,
        workflow: workflow as any,
        isDuplicate: true
      }
    }
  }

  // ATOMIC TRANSITION: Only update if workflow is at expected step
  const { data: workflow, error: updateError } = await supabase
    .from('intent_workflows')
    .update({
      current_step: request.toStep,
      status: request.status,
      version: supabase.rpc('increment_version', { workflow_id: request.workflowId }),
      updated_at: new Date().toISOString()
    })
    .eq('id', request.workflowId)
    .eq('organization_id', request.organizationId)
    .eq('current_step', request.fromStep)
    .select('id, current_step, status, version')
    .single()

  if (updateError || !workflow) {
    console.error('[WorkflowStateEngine] Atomic transition failed:', updateError)
    return {
      success: false,
      error: 'TRANSITION_FAILED'
    }
  }

  // STORE IDEMPOTENCY KEY: Record this successful transition for future retries
  if (request.idempotencyKey) {
    const { error: recordError } = await supabase
      .from('workflow_transitions')
      .insert({
        workflow_id: request.workflowId,
        organization_id: request.organizationId,
        idempotency_key: request.idempotencyKey,
        from_step: request.fromStep,
        to_step: request.toStep,
        status: request.status,
        created_at: new Date().toISOString()
      })

    if (recordError) {
      console.warn('[WorkflowStateEngine] Failed to record idempotency key:', recordError)
      // Don't fail the transition if we can't record the key - the transition succeeded
    }
  }

  console.log(`[WorkflowStateEngine] Transition successful: ${request.workflowId} ${request.fromStep} → ${request.toStep}`)

  return {
    success: true,
    workflow: workflow as any,
    isDuplicate: false
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
