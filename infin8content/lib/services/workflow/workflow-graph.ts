/**
 * Workflow State Graph - Production-Grade Finite State Machine
 * 
 * CRITICAL PRODUCTION NOTES:
 * 
 * 1. ENUM is append-only - never remove or reorder values without full data migration
 * 2. Never write string literals for states - always use WorkflowState enum
 * 3. State transitions must be atomic and guarded by advanceWorkflow()
 * 4. Cancellation is allowed from any active state for operational flexibility
 * 5. No backward transitions - FSM is strictly forward-only
 * 
 * State Machine Properties:
 * - States: 11 (9 active + 2 terminal)
 * - Transitions: 20 (10 forward + 10 cancellation paths)
 * - Entry State: step_1_icp (no CREATED zombie state)
 * - Terminal States: COMPLETED, CANCELLED
 * - Deterministic: Single path from entry to completion
 * 
 * Design Philosophy:
 * - Linear progression with optional cancellation
 * - No step skipping or branching complexity
 * - Database-enforced state integrity via ENUM
 * - Race-safe atomic transitions
 */

import { WorkflowState } from '@/types/workflow-state'

/**
 * Formal transition graph defining all legal state transitions
 * Key: Current state
 * Value: Array of allowed next states
 * 
 * Note: No CREATED state - workflows start directly in step_1_icp
 * This eliminates zombie states and ensures clean linear progression
 * 
 * Cancellation allowed from any active state for production flexibility
 */
export const WORKFLOW_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  // Linear Step Progression (with cancellation option)
  [WorkflowState.step_1_icp]: [WorkflowState.step_2_competitors, WorkflowState.CANCELLED],
  [WorkflowState.step_2_competitors]: [WorkflowState.step_3_seeds, WorkflowState.CANCELLED],
  [WorkflowState.step_3_seeds]: [WorkflowState.step_4_longtails, WorkflowState.CANCELLED],
  [WorkflowState.step_4_longtails]: [WorkflowState.step_5_filtering, WorkflowState.CANCELLED],
  [WorkflowState.step_5_filtering]: [WorkflowState.step_6_clustering, WorkflowState.CANCELLED],
  [WorkflowState.step_6_clustering]: [WorkflowState.step_7_validation, WorkflowState.CANCELLED],
  [WorkflowState.step_7_validation]: [WorkflowState.step_8_subtopics, WorkflowState.CANCELLED],
  [WorkflowState.step_8_subtopics]: [WorkflowState.step_9_articles, WorkflowState.CANCELLED],
  [WorkflowState.step_9_articles]: [WorkflowState.COMPLETED, WorkflowState.CANCELLED],
  
  // Terminal States
  [WorkflowState.COMPLETED]: [],    // No transitions from completed
  [WorkflowState.CANCELLED]: []     // No transitions from cancelled
}

/**
 * Terminal states that cannot be transitioned from
 */
export const TERMINAL_STATES: WorkflowState[] = [WorkflowState.COMPLETED, WorkflowState.CANCELLED]

/**
 * Check if a transition is legally allowed
 * 
 * @param currentState - Current workflow state
 * @param nextState - Desired next state
 * @returns true if transition is allowed, false otherwise
 */
export function isLegalTransition(
  currentState: WorkflowState, 
  nextState: WorkflowState
): boolean {
  const allowedNextStates = WORKFLOW_TRANSITIONS[currentState]
  return allowedNextStates.includes(nextState)
}

/**
 * Get all allowed next states for a given current state
 * 
 * @param currentState - Current workflow state
 * @returns Array of allowed next states (empty for terminal states)
 */
export function getAllowedNextStates(currentState: WorkflowState): WorkflowState[] {
  return WORKFLOW_TRANSITIONS[currentState] || []
}

/**
 * Check if a state is terminal (no outgoing transitions)
 * 
 * @param state - Workflow state to check
 * @returns true if state is terminal, false otherwise
 */
export function isTerminalState(state: WorkflowState): boolean {
  return TERMINAL_STATES.includes(state)
}

/**
 * Validate that a state is in the transition graph
 * 
 * @param value - String value to validate
 * @returns true if state exists in graph, false otherwise
 */
export function isValidState(value: string): value is WorkflowState {
  return (Object.values(WorkflowState) as string[]).includes(value)
}

/**
 * Get the complete workflow progression path from start to completion
 * 
 * @returns Array of states in linear progression order
 */
export function getLinearProgressionPath(): WorkflowState[] {
  return [
    WorkflowState.step_1_icp,
    WorkflowState.step_2_competitors, 
    WorkflowState.step_3_seeds,
    WorkflowState.step_4_longtails,
    WorkflowState.step_5_filtering,
    WorkflowState.step_6_clustering,
    WorkflowState.step_7_validation,
    WorkflowState.step_8_subtopics,
    WorkflowState.step_9_articles,
    WorkflowState.COMPLETED
  ]
}

/**
 * Calculate workflow progress percentage
 * 
 * @param currentState - Current workflow state
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(currentState: WorkflowState): number {
  const path = getLinearProgressionPath()
  const currentIndex = path.indexOf(currentState)
  
  if (currentIndex === -1) return 0
  if (currentState === WorkflowState.COMPLETED) return 100
  
  return Math.round(((currentIndex + 1) / path.length) * 100)
}
