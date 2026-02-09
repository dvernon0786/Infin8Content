/**
 * Workflow step ordering for Intent Engine
 * Imports all canonical definitions from single source of truth
 */

import { 
  WORKFLOW_STEP_ORDER,
  getStepIndex,
  hasPassedStep,
  isAtOrPastStep,
  type WorkflowState
} from '@/lib/constants/intent-workflow-steps'

export type WorkflowStep = typeof WORKFLOW_STEP_ORDER[number]

// Re-export canonical functions for backward compatibility
export { getStepIndex, hasPassedStep, isAtOrPastStep }
