/**
 * Canonical Intent Engine Workflow Steps
 * 
 * This is the SINGLE source of truth for all workflow step definitions.
 * All other files should import and derive from this constant.
 * 
 * DO NOT modify step names without updating all dependent systems.
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

export type IntentWorkflowStep = typeof INTENT_WORKFLOW_STEPS[keyof typeof INTENT_WORKFLOW_STEPS]

/**
 * Complete workflow step array in correct order (excluding terminal states)
 */
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

/**
 * All possible workflow states (including terminal states)
 */
export const ALL_WORKFLOW_STATES = [
  ...WORKFLOW_STEP_ORDER,
  INTENT_WORKFLOW_STEPS.COMPLETED,
  INTENT_WORKFLOW_STEPS.FAILED,
] as const

export type WorkflowState = typeof ALL_WORKFLOW_STATES[number]

/**
 * Progress mapping for dashboard display
 */
export const WORKFLOW_PROGRESS_MAP: Record<WorkflowState, number> = {
  [INTENT_WORKFLOW_STEPS.AUTH]: 5,
  [INTENT_WORKFLOW_STEPS.ICP]: 15,
  [INTENT_WORKFLOW_STEPS.COMPETITORS]: 25,
  [INTENT_WORKFLOW_STEPS.KEYWORDS]: 35,
  [INTENT_WORKFLOW_STEPS.LONGTAILS]: 45,
  [INTENT_WORKFLOW_STEPS.FILTERING]: 55,
  [INTENT_WORKFLOW_STEPS.CLUSTERING]: 65,
  [INTENT_WORKFLOW_STEPS.VALIDATION]: 75,
  [INTENT_WORKFLOW_STEPS.SUBTOPICS]: 85,
  [INTENT_WORKFLOW_STEPS.ARTICLES]: 95,
  [INTENT_WORKFLOW_STEPS.COMPLETED]: 100,
  [INTENT_WORKFLOW_STEPS.FAILED]: 0,
} as const

/**
 * Human-readable step descriptions
 */
export const WORKFLOW_STEP_DESCRIPTIONS: Record<WorkflowState, string> = {
  [INTENT_WORKFLOW_STEPS.AUTH]: 'Authentication',
  [INTENT_WORKFLOW_STEPS.ICP]: 'ICP Generation',
  [INTENT_WORKFLOW_STEPS.COMPETITORS]: 'Competitor Analysis',
  [INTENT_WORKFLOW_STEPS.KEYWORDS]: 'Seed Keyword Extraction',
  [INTENT_WORKFLOW_STEPS.LONGTAILS]: 'Long-tail Expansion',
  [INTENT_WORKFLOW_STEPS.FILTERING]: 'Keyword Filtering',
  [INTENT_WORKFLOW_STEPS.CLUSTERING]: 'Topic Clustering',
  [INTENT_WORKFLOW_STEPS.VALIDATION]: 'Cluster Validation',
  [INTENT_WORKFLOW_STEPS.SUBTOPICS]: 'Subtopic Generation',
  [INTENT_WORKFLOW_STEPS.ARTICLES]: 'Article Generation',
  [INTENT_WORKFLOW_STEPS.COMPLETED]: 'Completed',
  [INTENT_WORKFLOW_STEPS.FAILED]: 'Failed',
} as const

/**
 * Helper functions
 */
export function getStepIndex(step: string): number {
  const index = ALL_WORKFLOW_STATES.indexOf(step as WorkflowState)
  return index === -1 ? -1 : index
}

export function hasPassedStep(currentStep: string, targetStep: string): boolean {
  return getStepIndex(currentStep) > getStepIndex(targetStep)
}

export function isAtOrPastStep(currentStep: string, targetStep: string): boolean {
  return getStepIndex(currentStep) >= getStepIndex(targetStep)
}

export function isValidWorkflowStep(step: string): step is WorkflowState {
  return ALL_WORKFLOW_STATES.includes(step as WorkflowState)
}

export function calculateProgress(status: string): number {
  return WORKFLOW_PROGRESS_MAP[status as WorkflowState] || 0
}

export function getStepDescription(status: string): string {
  return WORKFLOW_STEP_DESCRIPTIONS[status as WorkflowState] || 'Unknown'
}
