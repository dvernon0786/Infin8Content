/**
 * Workflow State Enum - Clean Unified Contract
 * 
 * Single source of truth for workflow progression
 * No processing states - only user-visible steps
 * All transitions are atomic and deterministic
 */

export enum WorkflowState {
  // Global States
  CREATED = 'CREATED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',

  // Step 1 - ICP Generation
  step_1_icp = 'step_1_icp',

  // Step 2 - Competitor Analysis
  step_2_competitors = 'step_2_competitors',

  // Step 3 - Seed Review (Human Action)
  step_3_seeds = 'step_3_seeds',

  // Step 4 - Longtail Expansion
  step_4_longtails = 'step_4_longtails',

  // Step 5 - Keyword Filtering
  step_5_filtering = 'step_5_filtering',

  // Step 6 - Clustering
  step_6_clustering = 'step_6_clustering',

  // Step 7 - Validation
  step_7_validation = 'step_7_validation',

  // Step 8 - Subtopics
  step_8_subtopics = 'step_8_subtopics',

  // Step 9 - Articles
  step_9_articles = 'step_9_articles'
}

/**
 * Legal Transition Matrix - Clean Step-by-Step Progression
 * 
 * Simple linear progression with retry capability
 * No processing states - only step advancement
 */
export const legalTransitions: Record<WorkflowState, WorkflowState[]> = {
  // Global Transitions
  [WorkflowState.CREATED]: [WorkflowState.step_1_icp],
  [WorkflowState.CANCELLED]: [], // Terminal state
  [WorkflowState.COMPLETED]: [], // Terminal state

  // Linear Step Progression
  [WorkflowState.step_1_icp]: [WorkflowState.step_2_competitors],
  [WorkflowState.step_2_competitors]: [WorkflowState.step_3_seeds],
  [WorkflowState.step_3_seeds]: [WorkflowState.step_4_longtails],
  [WorkflowState.step_4_longtails]: [WorkflowState.step_5_filtering],
  [WorkflowState.step_5_filtering]: [WorkflowState.step_6_clustering],
  [WorkflowState.step_6_clustering]: [WorkflowState.step_7_validation],
  [WorkflowState.step_7_validation]: [WorkflowState.step_8_subtopics],
  [WorkflowState.step_8_subtopics]: [WorkflowState.step_9_articles],
  [WorkflowState.step_9_articles]: [WorkflowState.COMPLETED]
}

/**
 * Helper function to check if transition is legal
 */
export function isLegalTransition(from: WorkflowState, to: WorkflowState): boolean {
  return legalTransitions[from]?.includes(to) || false
}

/**
 * Helper function to get all possible next states
 */
export function getNextStates(current: WorkflowState): WorkflowState[] {
  return legalTransitions[current] || []
}

/**
 * Helper function to check if state is terminal
 */
export function isTerminalState(state: WorkflowState): boolean {
  return getNextStates(state).length === 0
}

/**
 * Helper function to get step number from state
 */
export function getStepNumber(state: WorkflowState): number {
  const match = state.match(/step_(\d+)/)
  return match ? parseInt(match[1]) : 0
}

/**
 * Helper function to check if state is a step
 */
export function isStepState(state: WorkflowState): boolean {
  return state.startsWith('step_')
}
