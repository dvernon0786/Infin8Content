/**
 * Workflow State Enum - Single Source of Truth
 * 
 * Replaces current_step + status with deterministic state machine
 * All legal transitions are enforced by the transition engine
 */

export enum WorkflowState {
  // Global States
  CREATED = 'CREATED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',

  // Step 1 - ICP Generation
  ICP_PENDING = 'ICP_PENDING',
  ICP_PROCESSING = 'ICP_PROCESSING',
  ICP_COMPLETED = 'ICP_COMPLETED',
  ICP_FAILED = 'ICP_FAILED',

  // Step 2 - Competitor Analysis
  COMPETITOR_PENDING = 'COMPETITOR_PENDING',
  COMPETITOR_PROCESSING = 'COMPETITOR_PROCESSING',
  COMPETITOR_COMPLETED = 'COMPETITOR_COMPLETED',
  COMPETITOR_FAILED = 'COMPETITOR_FAILED',

  // Step 3 - Seed Review (Human Action)
  SEED_REVIEW_PENDING = 'SEED_REVIEW_PENDING',
  SEED_REVIEW_COMPLETED = 'SEED_REVIEW_COMPLETED',

  // Step 4 - Clustering
  CLUSTERING_PENDING = 'CLUSTERING_PENDING',
  CLUSTERING_PROCESSING = 'CLUSTERING_PROCESSING',
  CLUSTERING_COMPLETED = 'CLUSTERING_COMPLETED',
  CLUSTERING_FAILED = 'CLUSTERING_FAILED',

  // Step 5 - Validation
  VALIDATION_PENDING = 'VALIDATION_PENDING',
  VALIDATION_PROCESSING = 'VALIDATION_PROCESSING',
  VALIDATION_COMPLETED = 'VALIDATION_COMPLETED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Step 6 - Article Generation
  ARTICLE_PENDING = 'ARTICLE_PENDING',
  ARTICLE_PROCESSING = 'ARTICLE_PROCESSING',
  ARTICLE_COMPLETED = 'ARTICLE_COMPLETED',
  ARTICLE_FAILED = 'ARTICLE_FAILED',

  // Step 7 - Publishing
  PUBLISH_PENDING = 'PUBLISH_PENDING',
  PUBLISH_PROCESSING = 'PUBLISH_PROCESSING',
  PUBLISH_COMPLETED = 'PUBLISH_COMPLETED',
  PUBLISH_FAILED = 'PUBLISH_FAILED'
}

/**
 * Legal Transition Matrix - Centralized State Enforcement
 * 
 * This is the single source of truth for all allowed state transitions.
 * Any transition not in this matrix will be rejected.
 */
export const legalTransitions: Record<WorkflowState, WorkflowState[]> = {
  // Global Transitions
  [WorkflowState.CREATED]: [WorkflowState.ICP_PENDING],
  [WorkflowState.CANCELLED]: [], // Terminal state
  [WorkflowState.COMPLETED]: [], // Terminal state

  // ICP Step
  [WorkflowState.ICP_PENDING]: [WorkflowState.ICP_PROCESSING],
  [WorkflowState.ICP_PROCESSING]: [
    WorkflowState.ICP_COMPLETED,
    WorkflowState.ICP_FAILED
  ],
  [WorkflowState.ICP_FAILED]: [WorkflowState.ICP_PROCESSING],
  [WorkflowState.ICP_COMPLETED]: [WorkflowState.COMPETITOR_PENDING],

  // Competitor Analysis Step
  [WorkflowState.COMPETITOR_PENDING]: [WorkflowState.COMPETITOR_PROCESSING],
  [WorkflowState.COMPETITOR_PROCESSING]: [
    WorkflowState.COMPETITOR_COMPLETED,
    WorkflowState.COMPETITOR_FAILED
  ],
  [WorkflowState.COMPETITOR_FAILED]: [WorkflowState.COMPETITOR_PROCESSING],
  [WorkflowState.COMPETITOR_COMPLETED]: [WorkflowState.SEED_REVIEW_PENDING],

  // Seed Review Step (Human Action)
  [WorkflowState.SEED_REVIEW_PENDING]: [WorkflowState.SEED_REVIEW_COMPLETED],
  [WorkflowState.SEED_REVIEW_COMPLETED]: [WorkflowState.CLUSTERING_PENDING],

  // Clustering Step
  [WorkflowState.CLUSTERING_PENDING]: [WorkflowState.CLUSTERING_PROCESSING],
  [WorkflowState.CLUSTERING_PROCESSING]: [
    WorkflowState.CLUSTERING_COMPLETED,
    WorkflowState.CLUSTERING_FAILED
  ],
  [WorkflowState.CLUSTERING_FAILED]: [WorkflowState.CLUSTERING_PROCESSING],
  [WorkflowState.CLUSTERING_COMPLETED]: [WorkflowState.VALIDATION_PENDING],

  // Validation Step
  [WorkflowState.VALIDATION_PENDING]: [WorkflowState.VALIDATION_PROCESSING],
  [WorkflowState.VALIDATION_PROCESSING]: [
    WorkflowState.VALIDATION_COMPLETED,
    WorkflowState.VALIDATION_FAILED
  ],
  [WorkflowState.VALIDATION_FAILED]: [WorkflowState.VALIDATION_PROCESSING],
  [WorkflowState.VALIDATION_COMPLETED]: [WorkflowState.ARTICLE_PENDING],

  // Article Generation Step
  [WorkflowState.ARTICLE_PENDING]: [WorkflowState.ARTICLE_PROCESSING],
  [WorkflowState.ARTICLE_PROCESSING]: [
    WorkflowState.ARTICLE_COMPLETED,
    WorkflowState.ARTICLE_FAILED
  ],
  [WorkflowState.ARTICLE_FAILED]: [WorkflowState.ARTICLE_PROCESSING],
  [WorkflowState.ARTICLE_COMPLETED]: [WorkflowState.PUBLISH_PENDING],

  // Publishing Step
  [WorkflowState.PUBLISH_PENDING]: [WorkflowState.PUBLISH_PROCESSING],
  [WorkflowState.PUBLISH_PROCESSING]: [
    WorkflowState.PUBLISH_COMPLETED,
    WorkflowState.PUBLISH_FAILED
  ],
  [WorkflowState.PUBLISH_FAILED]: [WorkflowState.PUBLISH_PROCESSING],
  [WorkflowState.PUBLISH_COMPLETED]: [WorkflowState.COMPLETED]
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
 * Helper function to check if state is processing
 */
export function isProcessingState(state: WorkflowState): boolean {
  return state.includes('_PROCESSING')
}

/**
 * Helper function to check if state is failed
 */
export function isFailedState(state: WorkflowState): boolean {
  return state.includes('_FAILED')
}

/**
 * Helper function to check if state is completed
 */
export function isCompletedState(state: WorkflowState): boolean {
  return state.includes('_COMPLETED') || state === WorkflowState.COMPLETED
}
