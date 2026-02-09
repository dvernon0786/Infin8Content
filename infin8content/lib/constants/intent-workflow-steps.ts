/**
 * Canonical Intent Engine Workflow Steps
 *
 * ⚠️ SINGLE SOURCE OF TRUTH
 * All workflow step names, ordering, progress, and helpers
 * MUST be defined here and imported everywhere else.
 */

export const INTENT_WORKFLOW_STEPS = {
  AUTH: 'step_0_auth',
  ICP: 'step_1_icp',
  COMPETITORS: 'step_2_competitors',
  KEYWORDS: 'step_3_keywords',
  LONGTAILS: 'step_4_longtails',
  FILTERING: 'step_5_filtering',
  CLUSTERING: 'step_6_clustering',
  VALIDATION: 'step_7_validation',
  SUBTOPICS: 'step_8_subtopics',
  ARTICLES: 'step_9_articles',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

/** Ordered execution steps (non-terminal) */
export const WORKFLOW_STEP_ORDER = [
  INTENT_WORKFLOW_STEPS.AUTH,
  INTENT_WORKFLOW_STEPS.ICP,
  INTENT_WORKFLOW_STEPS.COMPETITORS,
  INTENT_WORKFLOW_STEPS.KEYWORDS,
  INTENT_WORKFLOW_STEPS.LONGTAILS,
  INTENT_WORKFLOW_STEPS.FILTERING,
  INTENT_WORKFLOW_STEPS.CLUSTERING,
  INTENT_WORKFLOW_STEPS.VALIDATION,
  INTENT_WORKFLOW_STEPS.SUBTOPICS,
  INTENT_WORKFLOW_STEPS.ARTICLES,
] as const

/** All valid workflow states (including terminal states) */
export const ALL_WORKFLOW_STATES = [
  ...WORKFLOW_STEP_ORDER,
  INTENT_WORKFLOW_STEPS.COMPLETED,
  INTENT_WORKFLOW_STEPS.FAILED,
] as const

export type WorkflowState = typeof ALL_WORKFLOW_STATES[number]

/** Progress mapping for dashboard */
export const WORKFLOW_PROGRESS_MAP: Record<WorkflowState, number> = {
  step_0_auth: 5,
  step_1_icp: 15,
  step_2_competitors: 25,
  step_3_keywords: 35,
  step_4_longtails: 45,
  step_5_filtering: 55,
  step_6_clustering: 65,
  step_7_validation: 75,
  step_8_subtopics: 85,
  step_9_articles: 95,
  completed: 100,
  failed: 0,
}

/** Human-readable labels */
export const WORKFLOW_STEP_DESCRIPTIONS: Record<WorkflowState, string> = {
  step_0_auth: 'Authentication',
  step_1_icp: 'ICP Generation',
  step_2_competitors: 'Competitor Analysis',
  step_3_keywords: 'Seed Keyword Extraction',
  step_4_longtails: 'Long-tail Expansion',
  step_5_filtering: 'Keyword Filtering',
  step_6_clustering: 'Topic Clustering',
  step_7_validation: 'Cluster Validation',
  step_8_subtopics: 'Subtopic Generation',
  step_9_articles: 'Article Generation',
  completed: 'Completed',
  failed: 'Failed',
}

/** Helper guards */
export function getStepIndex(step: WorkflowState): number {
  return ALL_WORKFLOW_STATES.indexOf(step)
}

export function isAtOrPastStep(current: WorkflowState, target: WorkflowState) {
  return getStepIndex(current) >= getStepIndex(target)
}

export function hasPassedStep(current: WorkflowState, target: WorkflowState) {
  return getStepIndex(current) > getStepIndex(target)
}

export function isValidWorkflowState(value: string): value is WorkflowState {
  return ALL_WORKFLOW_STATES.includes(value as WorkflowState)
}

/** Dashboard helpers */
export function calculateProgress(status: string): number {
  return WORKFLOW_PROGRESS_MAP[status as WorkflowState] || 0
}

export function getStepDescription(status: string): string {
  return WORKFLOW_STEP_DESCRIPTIONS[status as WorkflowState] || 'Unknown'
}

/** Runtime assertion to prevent invalid states */
export function assertValidWorkflowState(
  status: string
): asserts status is WorkflowState {
  if (!ALL_WORKFLOW_STATES.includes(status as WorkflowState)) {
    throw new Error(
      `🚨 Invalid workflow status emitted: ${status}` 
    )
  }
}
