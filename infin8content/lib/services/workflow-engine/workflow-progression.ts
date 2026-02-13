/**
 * Workflow Progression Mapping - Deterministic State-to-Step Derivation
 * 
 * This file provides the single source of truth for converting workflow states
 * to UI step numbers and status labels. No stored fields needed - everything
 * is derived mathematically from the state machine.
 */

import { WorkflowState } from '@/types/workflow-state'

/**
 * Maps workflow state to UI step number (1-7)
 * This is the canonical mapping - all UI routing uses this function
 */
export function getStepFromState(state: WorkflowState): number {
  switch (state) {
    // Step 1: ICP Generation
    case WorkflowState.CREATED:
    case WorkflowState.ICP_PENDING:
    case WorkflowState.ICP_PROCESSING:
      return 1

    // Step 2: Competitor Analysis  
    case WorkflowState.ICP_COMPLETED:
    case WorkflowState.COMPETITOR_PENDING:
    case WorkflowState.COMPETITOR_PROCESSING:
      return 2

    // Step 3: Keyword Processing
    case WorkflowState.COMPETITOR_COMPLETED:
    case WorkflowState.CLUSTERING_PENDING:
    case WorkflowState.CLUSTERING_PROCESSING:
      return 3

    // Step 4: Clustering Complete
    case WorkflowState.CLUSTERING_COMPLETED:
      return 4

    // Step 5: Validation
    case WorkflowState.VALIDATION_COMPLETED:
      return 5

    // Step 6: Article Generation
    case WorkflowState.ARTICLE_COMPLETED:
      return 6

    // Step 7: Publishing
    case WorkflowState.PUBLISH_COMPLETED:
      return 7

    // Terminal states - show final step
    case WorkflowState.COMPLETED:
      return 7

    // Failed states - show current step based on failure point
    case WorkflowState.ICP_FAILED:
      return 1
    case WorkflowState.COMPETITOR_FAILED:
      return 2
    case WorkflowState.CLUSTERING_FAILED:
      return 3
    case WorkflowState.VALIDATION_FAILED:
      return 4
    case WorkflowState.ARTICLE_FAILED:
      return 5
    case WorkflowState.PUBLISH_FAILED:
      return 6

    // Special states
    case WorkflowState.CANCELLED:
      return 1

    default:
      return 1
  }
}

/**
 * Maps workflow state to status string for UI display
 * Maintains backward compatibility with existing UI expectations
 */
export function getStatusFromState(state: WorkflowState): string {
  switch (state) {
    // Step 1 statuses
    case WorkflowState.CREATED:
    case WorkflowState.ICP_PENDING:
    case WorkflowState.ICP_PROCESSING:
      return 'step_1_icp'
    case WorkflowState.ICP_FAILED:
      return 'step_1_icp'

    // Step 2 statuses  
    case WorkflowState.ICP_COMPLETED:
    case WorkflowState.COMPETITOR_PENDING:
    case WorkflowState.COMPETITOR_PROCESSING:
    case WorkflowState.COMPETITOR_FAILED:
      return 'step_2_competitors'

    // Step 3 statuses
    case WorkflowState.COMPETITOR_COMPLETED:
    case WorkflowState.CLUSTERING_PENDING:
    case WorkflowState.CLUSTERING_PROCESSING:
    case WorkflowState.CLUSTERING_FAILED:
      return 'step_3_keywords'

    // Step 4 statuses
    case WorkflowState.CLUSTERING_COMPLETED:
      return 'step_4_topics'

    // Step 5 statuses
    case WorkflowState.VALIDATION_COMPLETED:
    case WorkflowState.VALIDATION_FAILED:
      return 'step_5_generation'

    // Step 6 statuses
    case WorkflowState.ARTICLE_COMPLETED:
    case WorkflowState.ARTICLE_FAILED:
      return 'step_6_generation'

    // Step 7 statuses
    case WorkflowState.PUBLISH_COMPLETED:
    case WorkflowState.PUBLISH_FAILED:
      return 'completed'

    // Terminal states
    case WorkflowState.COMPLETED:
      return 'completed'
    case WorkflowState.CANCELLED:
      return 'cancelled'

    default:
      return 'step_1_icp'
  }
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
