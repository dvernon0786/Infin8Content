/**
 * Inngest Workflow Transition Guard
 * Delegates to FSM - single source of truth
 */

import { assertValidWorkflowState } from '@/lib/constants/intent-workflow-steps'
import { WorkflowFSM } from '@/lib/fsm/workflow-fsm'
import type { WorkflowState } from '@/lib/fsm/workflow-events'

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

  // For all other transitions, FSM is the only authority
  // Since we don't have the event here, we use basic linear validation
  // Full validation happens in WorkflowFSM.transition() with proper events
  const currentState = currentStatus as WorkflowState
  const nextState = nextStatus as WorkflowState
  
  // Simple linear progression check - FSM handles full validation
  const stepOrder: WorkflowState[] = [
    'step_1_icp',
    'step_2_competitors',
    'step_3_seeds',
    'step_4_longtails',
    'step_5_filtering',
    'step_6_clustering',
    'step_7_validation',
    'step_8_subtopics',
    'step_9_articles'
  ]
  
  const currentIndex = stepOrder.indexOf(currentState)
  const nextIndex = stepOrder.indexOf(nextState)
  
  // Only allow next step in sequence
  if (nextIndex !== currentIndex + 1) {
    throw new Error(
      `🚨 Illegal workflow transition: ${currentStatus} → ${nextStatus}. ` +
      `FSM enforces linear progression only.`
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
