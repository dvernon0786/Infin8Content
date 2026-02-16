/**
 * Inngest Workflow Transition Guard
 * Enforces linear progression and prevents illegal state transitions
 */

import {
  WORKFLOW_STEP_ORDER,
  assertValidWorkflowState
} from '@/lib/constants/intent-workflow-steps'
import type { WorkflowState } from '@/lib/fsm/workflow-events'

export function assertValidWorkflowTransition(
  currentStatus: string,
  nextStatus: string
): void {
  // Validate both states are canonical
  assertValidWorkflowState(currentStatus)
  assertValidWorkflowState(nextStatus)

  // Allow terminal state (completed) from any step
  if (nextStatus === 'completed') {
    return
  }

  // Allow same state (idempotent)
  if (currentStatus === nextStatus) {
    return
  }

  const currentIndex = WORKFLOW_STEP_ORDER.indexOf(currentStatus as any)
  const nextIndex = WORKFLOW_STEP_ORDER.indexOf(nextStatus as any)

  // Enforce linear progression (only next step allowed)
  if (nextIndex !== currentIndex + 1) {
    throw new Error(
      `🚨 Illegal workflow transition: ${currentStatus} → ${nextStatus}. ` +
      `Expected: ${WORKFLOW_STEP_ORDER[currentIndex + 1] || 'completed'}`
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
