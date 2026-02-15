/**
 * Formal Workflow Transition Graph
 * 
 * Single source of truth for all allowed state transitions.
 * This defines the finite state machine rules for the workflow engine.
 * 
 * Rules:
 * - Only forward progression (no backwards transitions)
 * - No step skipping
 * - Terminal states (completed, cancelled) have no outgoing transitions
 * - Each state has exactly one or zero valid next states
 */

import { WorkflowState } from '@/types/workflow-state'

/**
 * Formal transition graph defining all legal state transitions
 * Key: Current state
 * Value: Array of allowed next states
 * 
 * Note: No CREATED state - workflows start directly in step_1_icp
 * This eliminates zombie states and ensures clean linear progression
 */
export const WORKFLOW_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  // Linear Step Progression (no CREATED state)
  [WorkflowState.step_1_icp]: [WorkflowState.step_2_competitors],
  [WorkflowState.step_2_competitors]: [WorkflowState.step_3_seeds],
  [WorkflowState.step_3_seeds]: [WorkflowState.step_4_longtails],
  [WorkflowState.step_4_longtails]: [WorkflowState.step_5_filtering],
  [WorkflowState.step_5_filtering]: [WorkflowState.step_6_clustering],
  [WorkflowState.step_6_clustering]: [WorkflowState.step_7_validation],
  [WorkflowState.step_7_validation]: [WorkflowState.step_8_subtopics],
  [WorkflowState.step_8_subtopics]: [WorkflowState.step_9_articles],
  [WorkflowState.step_9_articles]: [WorkflowState.COMPLETED],
  
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
 * @param state - Workflow state to validate
 * @returns true if state exists in graph, false otherwise
 */
export function isValidState(state: string): state is WorkflowState {
  return Object.keys(WORKFLOW_TRANSITIONS).includes(state)
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
