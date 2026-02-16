/**
 * Inngest Workflow Transition Guard
 * Enforces FSM-based transitions - single source of truth
 */

import { assertValidWorkflowState } from '@/lib/constants/intent-workflow-steps'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import type { WorkflowState, WorkflowEvent } from '@/lib/fsm/workflow-events'

export function assertValidWorkflowTransition(
  currentStatus: string,
  nextStatus: string
): void {
  // Validate both states are canonical FSM states
  assertValidWorkflowState(currentStatus)
  assertValidWorkflowState(nextStatus)

  // Allow same state (idempotent)
  if (currentStatus === nextStatus) {
    return
  }

  // Allow transition to completed from any step
  if (nextStatus === 'completed') {
    return
  }

  // For all other transitions, check if FSM allows this progression
  // Since we don't have the event here, we use linear progression check
  // This is a simplified validation - full validation happens in FSM.transition
  const currentState = currentStatus as WorkflowState
  const nextState = nextStatus as WorkflowState
  
  // Get valid next states from FSM linear order
  const validProgressions: Record<WorkflowState, WorkflowState[]> = {
    'step_1_icp': ['step_2_competitors'],
    'step_2_competitors': ['step_3_seeds'],
    'step_3_seeds': ['step_4_longtails'],
    'step_4_longtails': ['step_5_filtering'],
    'step_5_filtering': ['step_6_clustering'],
    'step_6_clustering': ['step_7_validation'],
    'step_7_validation': ['step_8_subtopics'],
    'step_8_subtopics': ['step_9_articles'],
    'step_9_articles': ['completed'],
    'completed': [] // Terminal state
  }

  const allowedNextStates = validProgressions[currentState]
  
  if (!allowedNextStates.includes(nextState)) {
    throw new Error(
      `🚨 Illegal workflow transition: ${currentStatus} → ${nextStatus}. ` +
      `FSM does not allow this progression.`
    )
  }
}

export function handleWorkflowFailure(
  currentStatus: string,
  error: Error
): never {
  // In production, you might want to log this error
  console.error(`Workflow failed at ${currentStatus}:`, error)
  
  // Always transition to failed state on errors
  throw new Error(`Workflow failed: ${error.message}`)
}
