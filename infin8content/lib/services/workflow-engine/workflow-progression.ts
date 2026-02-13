/**
 * Workflow Progression Mapping - Declarative State-to-Step Derivation
 * 
 * This file provides the single source of truth for converting workflow states
 * to UI step numbers and status labels using a declarative configuration model.
 * No stored fields needed - everything is derived mathematically from the state machine.
 */

import { WorkflowState } from '@/types/workflow-state'

/**
 * Declarative workflow step definitions
 * This is the single configuration source for all state-to-step mappings
 * Adding new states or modifying progression only requires editing this array
 */
export const WORKFLOW_STEPS = [
  {
    step: 1,
    label: 'step_1_icp',
    states: [
      WorkflowState.CREATED,
      WorkflowState.ICP_PENDING,
      WorkflowState.ICP_PROCESSING,
      WorkflowState.ICP_FAILED
    ]
  },
  {
    step: 2,
    label: 'step_2_competitors',
    states: [
      WorkflowState.ICP_COMPLETED,
      WorkflowState.COMPETITOR_PENDING,
      WorkflowState.COMPETITOR_PROCESSING,
      WorkflowState.COMPETITOR_FAILED
    ]
  },
  {
    step: 3,
    label: 'step_3_keywords',
    states: [
      WorkflowState.COMPETITOR_COMPLETED,
      WorkflowState.SEED_REVIEW_PENDING,
      WorkflowState.SEED_REVIEW_COMPLETED,
      WorkflowState.CLUSTERING_PENDING,
      WorkflowState.CLUSTERING_PROCESSING,
      WorkflowState.CLUSTERING_FAILED
    ]
  },
  {
    step: 4,
    label: 'step_4_topics',
    states: [
      WorkflowState.CLUSTERING_COMPLETED
    ]
  },
  {
    step: 5,
    label: 'step_5_generation',
    states: [
      WorkflowState.VALIDATION_PENDING,
      WorkflowState.VALIDATION_PROCESSING,
      WorkflowState.VALIDATION_COMPLETED,
      WorkflowState.VALIDATION_FAILED
    ]
  },
  {
    step: 6,
    label: 'step_6_generation',
    states: [
      WorkflowState.ARTICLE_PENDING,
      WorkflowState.ARTICLE_PROCESSING,
      WorkflowState.ARTICLE_COMPLETED,
      WorkflowState.ARTICLE_FAILED
    ]
  },
  {
    step: 7,
    label: 'completed',
    states: [
      WorkflowState.PUBLISH_PENDING,
      WorkflowState.PUBLISH_PROCESSING,
      WorkflowState.PUBLISH_COMPLETED,
      WorkflowState.PUBLISH_FAILED,
      WorkflowState.COMPLETED
    ]
  }
]

/**
 * Terminal state handling configuration
 * Defines how terminal states map to steps for navigation purposes
 */
const TERMINAL_STATE_MAPPING: Record<string, number> = {
  [WorkflowState.CANCELLED]: 1, // Maps to first step for navigation reset
  [WorkflowState.COMPLETED]: 7  // Maps to final step
}

/**
 * Maps workflow state to UI step number using declarative configuration
 * This is the canonical mapping - all UI routing uses this function
 */
export function getStepFromState(state: WorkflowState): number {
  // Check terminal state mappings first
  if (state in TERMINAL_STATE_MAPPING) {
    return TERMINAL_STATE_MAPPING[state]
  }

  // Find step definition that contains this state
  const stepDefinition = WORKFLOW_STEPS.find(step =>
    step.states.includes(state)
  )
  
  return stepDefinition?.step ?? 1
}

/**
 * Maps workflow state to status string for UI display using declarative configuration
 * Maintains backward compatibility with existing UI expectations
 */
export function getStatusFromState(state: WorkflowState): string {
  // Handle terminal states specially
  if (state === WorkflowState.CANCELLED) {
    return 'cancelled'
  }
  
  if (state === WorkflowState.COMPLETED) {
    return 'completed'
  }

  // Find step definition that contains this state
  const stepDefinition = WORKFLOW_STEPS.find(step =>
    step.states.includes(state)
  )
  
  return stepDefinition?.label ?? 'step_1_icp'
}

/**
 * Determines if a user can access a specific step based on current state
 * Replaces the old current_step-based access control
 */
export function canAccessStep(currentState: WorkflowState, targetStep: number): boolean {
  const currentStep = getStepFromState(currentState)
  
  // Cannot access if workflow is cancelled
  if (currentState === WorkflowState.CANCELLED) {
    return false
  }
  
  // Can only access current step or previous steps
  return targetStep <= currentStep
}

/**
 * Gets the next accessible step based on current state
 * Returns null if at final step or in terminal state
 */
export function getNextStep(currentState: WorkflowState): number | null {
  const currentStep = getStepFromState(currentState)
  
  // Terminal states have no next step
  if (currentState === WorkflowState.COMPLETED || currentState === WorkflowState.CANCELLED) {
    return null
  }
  
  const nextStep = currentStep + 1
  return nextStep <= 7 ? nextStep : null
}

/**
 * Gets the previous accessible step based on current state
 * Returns null if at first step
 */
export function getPreviousStep(currentState: WorkflowState): number | null {
  const currentStep = getStepFromState(currentState)
  return currentStep > 1 ? currentStep - 1 : null
}

/**
 * Determines if workflow is in a processing state
 * Used for UI loading indicators and preventing concurrent actions
 */
export function isProcessingState(currentState: WorkflowState): boolean {
  return currentState.includes('_PROCESSING')
}

/**
 * Determines if workflow is in a failed state
 * Used for UI error display and retry logic
 */
export function isFailedState(currentState: WorkflowState): boolean {
  return currentState.includes('_FAILED')
}

/**
 * Determines if workflow is completed (either step completion or full completion)
 * Used for UI progression and analytics
 */
export function isCompletedState(currentState: WorkflowState): boolean {
  return currentState.includes('_COMPLETED') || currentState === WorkflowState.COMPLETED
}

/**
 * Gets step label for UI display
 * Provides human-readable step names
 */
export function getStepLabel(step: number): string {
  switch (step) {
    case 1: return 'ICP Generation'
    case 2: return 'Competitor Analysis'
    case 3: return 'Keyword Processing'
    case 4: return 'Topic Clustering'
    case 5: return 'Content Validation'
    case 6: return 'Article Generation'
    case 7: return 'Publishing'
    default: return 'Unknown Step'
  }
}

/**
 * Gets all states for a given step
 * Useful for testing and validation
 */
export function getStatesForStep(stepNumber: number): WorkflowState[] {
  const stepDefinition = WORKFLOW_STEPS.find(step => step.step === stepNumber)
  return stepDefinition ? [...stepDefinition.states] : []
}

/**
 * Validates that all workflow states are covered in the configuration
 * Used for development-time validation
 */
export function validateStateCoverage(): { valid: boolean; uncoveredStates: WorkflowState[] } {
  const allStates = Object.values(WorkflowState)
  const coveredStates = new Set<WorkflowState>()
  
  // Add all states from step definitions
  WORKFLOW_STEPS.forEach(step => {
    step.states.forEach(state => coveredStates.add(state))
  })
  
  // Add terminal state mappings
  Object.keys(TERMINAL_STATE_MAPPING).forEach(state => {
    coveredStates.add(state as WorkflowState)
  })
  
  const uncoveredStates = allStates.filter(state => !coveredStates.has(state))
  
  return {
    valid: uncoveredStates.length === 0,
    uncoveredStates
  }
}
