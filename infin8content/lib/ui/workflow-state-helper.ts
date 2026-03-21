/**
 * Workflow State Helper for UI Components
 * Provides utilities for handling FSM states in the UI
 */

import type { WorkflowState } from '@/lib/fsm/workflow-events'

export interface WorkflowStepInfo {
  stepNumber: number
  stepName: string
  currentState: WorkflowState
  stepStatus: string
  isRunning: boolean
  isCompleted: boolean
  isFailed: boolean
  canRetry: boolean
  canProceed: boolean
  nextStep?: string
}

/**
 * Get step information from workflow state
 */
export function getWorkflowStepInfo(workflowState: WorkflowState): WorkflowStepInfo {
  // Extract step number from state
  const stepMatch = workflowState.match(/step_(\d+)_(\w+)/)
  const stepNumber = stepMatch ? parseInt(stepMatch[1]) : 0
  const stepStatus = stepMatch ? stepMatch[2] : 'unknown'
  
  const stepNames = [
    'icp',
    'competitors', 
    'seeds',
    'longtails',
    'filtering',
    'clustering',
    'validation',
    'subtopics',
    'articles'
  ]
  
  const stepName = stepNames[stepNumber - 1] || 'unknown'
  
  return {
    stepNumber,
    stepName,
    currentState: workflowState,
    stepStatus,
    isRunning: stepStatus === 'running',
    isCompleted: workflowState === 'completed' || stepStatus === 'completed',
    isFailed: stepStatus === 'failed',
    canRetry: stepStatus === 'failed',
    canProceed: stepStatus === 'completed' || workflowState === 'completed',
    nextStep: getNextStep(workflowState)
  }
}

/**
 * Get the next step in the workflow
 */
function getNextStep(currentState: WorkflowState): string | undefined {
  const stepTransitions: Record<string, string> = {
    'step_1_icp': 'step_2_competitors',
    'step_2_competitors': 'step_3_seeds',
    'step_3_seeds': 'step_4_longtails',
    'step_4_longtails_completed': 'step_5_filtering',
    'step_5_filtering_completed': 'step_6_clustering',
    'step_6_clustering_completed': 'step_7_validation',
    'step_7_validation_completed': 'step_8_subtopics',
    'step_8_subtopics_completed': 'step_9_articles',
    'step_9_articles_completed': 'completed'
  }
  
  return stepTransitions[currentState]
}

/**
 * Get UI display state for a step
 */
export function getStepDisplayState(stepInfo: WorkflowStepInfo): {
  status: 'idle' | 'running' | 'completed' | 'failed'
  message: string
  action?: 'retry' | 'proceed' | 'reset'
} {
  if (stepInfo.isRunning) {
    return {
      status: 'running',
      message: `Processing ${stepInfo.stepName}...`
    }
  }
  
  if (stepInfo.isFailed) {
    return {
      status: 'failed',
      message: `${stepInfo.stepName} failed`,
      action: 'retry'
    }
  }
  
  if (stepInfo.isCompleted) {
    return {
      status: 'completed',
      message: `${stepInfo.stepName} completed`,
      action: stepInfo.canProceed ? 'proceed' : undefined
    }
  }
  
  return {
    status: 'idle',
    message: `Ready to process ${stepInfo.stepName}`
  }
}

/**
 * Check if a step is accessible based on workflow state
 */
export function isStepAccessible(targetStep: number, currentState: WorkflowState): boolean {
  const currentStepInfo = getWorkflowStepInfo(currentState)
  
  // Can always access current step
  if (currentStepInfo.stepNumber === targetStep) {
    return true
  }
  
  // Can access completed steps
  if (currentStepInfo.stepNumber > targetStep) {
    return true
  }
  
  // Can access next step if current is completed
  if (currentStepInfo.isCompleted && currentStepInfo.stepNumber + 1 === targetStep) {
    return true
  }
  
  return false
}

/**
 * Get retry event name for a failed step
 */
export function getRetryEventName(stepNumber: number): string {
  const retryEvents: Record<number, string> = {
    4: 'LONGTAIL_RETRY',
    5: 'FILTERING_RETRY',
    6: 'CLUSTERING_RETRY',
    7: 'VALIDATION_RETRY',
    8: 'SUBTOPICS_RETRY',
    9: 'ARTICLES_RETRY'
  }
  
  return retryEvents[stepNumber] || ''
}

/**
 * Format workflow state for display
 */
export function formatWorkflowState(state: WorkflowState): string {
  const stepInfo = getWorkflowStepInfo(state)
  
  if (state === 'completed') {
    return 'Workflow Completed'
  }
  
  const formattedStep = stepInfo.stepName.replace(/([A-Z])/g, ' $1').trim()
  const formattedStatus = stepInfo.stepStatus.charAt(0).toUpperCase() + stepInfo.stepStatus.slice(1)
  
  return `Step ${stepInfo.stepNumber}: ${formattedStep} - ${formattedStatus}`
}
