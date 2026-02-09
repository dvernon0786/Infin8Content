/**
 * Workflow step ordering for Intent Engine
 * Uses canonical constants to ensure consistency
 */

import { 
  WORKFLOW_STEP_ORDER, 
  getStepIndex as canonicalGetStepIndex,
  hasPassedStep as canonicalHasPassedStep,
  isAtOrPastStep as canonicalIsAtOrPastStep
} from '@/lib/constants/intent-workflow-steps'

export type WorkflowStep = typeof WORKFLOW_STEP_ORDER[number]

/**
 * Get the index of a workflow step in the ordering
 */
export function getStepIndex(step: string): number {
  return canonicalGetStepIndex(step)
}

/**
 * Check if a workflow has progressed past a given step
 */
export function hasPassedStep(currentStep: string, targetStep: string): boolean {
  return canonicalHasPassedStep(currentStep, targetStep)
}

/**
 * Check if a workflow is at or past a given step
 */
export function isAtOrPastStep(currentStep: string, targetStep: string): boolean {
  return canonicalIsAtOrPastStep(currentStep, targetStep)
}
