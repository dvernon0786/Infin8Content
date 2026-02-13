/**
 * Workflow Transition Engine - Centralized State Machine
 * 
 * This is the single source of truth for all workflow state transitions.
 * It enforces legal transitions atomically at the database level.
 * 
 * No endpoint-level guards needed.
 * No manual step checks.
 * No numeric comparisons.
 * 
 * The state engine decides.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { 
  WorkflowState, 
  isLegalTransition, 
  isTerminalState,
  isProcessingState 
} from '@/types/workflow-state'

export interface TransitionRequest {
  workflowId: string
  organizationId: string
  from: WorkflowState
  to: WorkflowState
}

export interface TransitionResult {
  success: boolean
  workflow?: {
    id: string
    state: WorkflowState
  }
  error?: 'ILLEGAL_TRANSITION' | 'TRANSITION_FAILED' | 'ALREADY_IN_STATE'
}

/**
 * Centralized atomic workflow transition with legal state enforcement
 * 
 * Pattern:
 * 1. Check if transition is legal (business rule)
 * 2. Attempt atomic transition with WHERE clause (database lock)
 * 3. Return result with clear error codes
 * 
 * This prevents:
 * - Illegal state transitions
 * - Concurrent requests from advancing simultaneously
 * - State drift and half-states
 * - Manual endpoint guards
 */
export async function transitionWorkflow(
  request: TransitionRequest
): Promise<TransitionResult> {
  const { workflowId, organizationId, from, to } = request

  // LEGALITY CHECK: Business rule enforcement
  if (!isLegalTransition(from, to)) {
    console.warn(`[TransitionEngine] Illegal transition attempted: ${workflowId} ${from} → ${to}`)
    return {
      success: false,
      error: 'ILLEGAL_TRANSITION'
    }
  }

  // TERMINAL STATE CHECK: Cannot transition from terminal states
  if (isTerminalState(from)) {
    console.warn(`[TransitionEngine] Terminal state transition attempted: ${workflowId} ${from} → ${to}`)
    return {
      success: false,
      error: 'ILLEGAL_TRANSITION'
    }
  }

  // SAME STATE CHECK: No-op transitions not allowed
  if (from === to) {
    console.warn(`[TransitionEngine] No-op transition attempted: ${workflowId} ${from}`)
    return {
      success: false,
      error: 'ALREADY_IN_STATE'
    }
  }

  const supabase = createServiceRoleClient()

  // ATOMIC TRANSITION: Only update if workflow is in expected state
  // WHERE clause ensures only one request can advance at a time
  // Pure state machine - no UI field synchronization needed
  const { data: workflow, error: updateError } = await supabase
    .from('intent_workflows')
    .update({
      state: to,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .eq('state', from)
    .select('id, state')
    .single()

  if (updateError) {
    console.error('[TransitionEngine] Database transition failed:', updateError)
    return {
      success: false,
      error: 'TRANSITION_FAILED'
    }
  }

  if (!workflow) {
    // Either workflow doesn't exist, org mismatch, or not in expected state
    // Most likely: concurrent request already transitioned
    console.log(`[TransitionEngine] Transition failed - likely concurrent race: ${workflowId} ${from} → ${to}`)
    return {
      success: false,
      error: 'TRANSITION_FAILED'
    }
  }

  console.log(`[TransitionEngine] Transition successful: ${workflowId} ${from} → ${to}`)

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
): Promise<WorkflowState | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .single<{ state: WorkflowState }>()

  if (error || !data) {
    return null
  }

  return data.state
}

/**
 * Check if workflow can transition to target state
 */
export async function canTransition(
  workflowId: string,
  organizationId: string,
  to: WorkflowState
): Promise<boolean> {
  const currentState = await getWorkflowState(workflowId, organizationId)
  
  if (!currentState) {
    return false
  }

  return isLegalTransition(currentState, to)
}

/**
 * Get all possible next states for a workflow
 */
export async function getNextPossibleStates(
  workflowId: string,
  organizationId: string
): Promise<WorkflowState[]> {
  const currentState = await getWorkflowState(workflowId, organizationId)
  
  if (!currentState) {
    return []
  }

  // Import here to avoid circular dependency
  const { getNextStates } = await import('@/types/workflow-state')
  return getNextStates(currentState)
}

/**
 * Force transition (for admin/recovery operations)
 * Bypasses legal transition checks - use with extreme caution
 */
export async function forceTransition(
  workflowId: string,
  organizationId: string,
  to: WorkflowState
): Promise<TransitionResult> {
  const supabase = createServiceRoleClient()

  const { data: workflow, error: updateError } = await supabase
    .from('intent_workflows')
    .update({
      state: to,
      updated_at: new Date().toISOString()
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)
    .select('id, state')
    .single()

  if (updateError || !workflow) {
    return {
      success: false,
      error: 'TRANSITION_FAILED'
    }
  }

  console.warn(`[TransitionEngine] Force transition applied: ${workflowId} → ${to}`)

  return {
    success: true,
    workflow: workflow as any
  }
}
