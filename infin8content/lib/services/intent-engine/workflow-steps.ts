/**
 * Workflow step ordering for Intent Engine
 * Used by gate validators to determine workflow progression
 */

export const WORKFLOW_STEP_ORDER = [
  'step_1_icp',
  'step_2_competitors',
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation',
  'step_8_approval',
  'step_9_articles'
] as const

export type WorkflowStep = typeof WORKFLOW_STEP_ORDER[number]

/**
 * Get the index of a workflow step in the ordering
 */
export function getStepIndex(step: string): number {
  return WORKFLOW_STEP_ORDER.indexOf(step as WorkflowStep)
}

/**
 * Check if a workflow has progressed past a given step
 */
export function hasPassedStep(currentStep: string, targetStep: string): boolean {
  return getStepIndex(currentStep) > getStepIndex(targetStep)
}

/**
 * Check if a workflow is at or past a given step
 */
export function isAtOrPastStep(currentStep: string, targetStep: string): boolean {
  return getStepIndex(currentStep) >= getStepIndex(targetStep)
}
