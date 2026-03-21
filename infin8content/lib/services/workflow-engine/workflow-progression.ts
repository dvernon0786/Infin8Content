/**
 * Workflow Progression Mapping - Declarative State-to-Step Derivation
 * 
 * This file provides the single source of truth for converting workflow states
 * to UI step numbers and status labels using a declarative configuration model.
 * No stored fields needed - everything is derived mathematically from the state machine.
 */

import { WorkflowState } from '@/lib/fsm/workflow-events'

/**
 * Symbolic workflow step enumeration
 * Used for semantic meaning only - ordering derived from WORKFLOW_STEPS
 * Prevents accidental reordering bugs and provides semantic meaning
 */
export enum WorkflowStep {
  ICP = 'icp',
  COMPETITORS = 'competitors', 
  KEYWORDS = 'keywords',
  TOPICS = 'topics',
  VALIDATION = 'validation',
  ARTICLE = 'article',
  PUBLISH = 'publish',
  SUBTOPICS = 'subtopics',
  ARTICLES = 'articles'
}

/**
 * Declarative workflow step definitions
 * This is the single configuration source for all state-to-step mappings
 * Updated for unified step_* states - no processing states
 */
export const WORKFLOW_STEPS = [
  {
    step: WorkflowStep.ICP,
    label: 'step_1_icp',
    states: [
      'CREATED',
      'step_1_icp'
    ]
  },
  {
    step: WorkflowStep.COMPETITORS,
    label: 'step_2_competitors',
    states: [
      'step_2_competitors'
    ]
  },
  {
    step: WorkflowStep.KEYWORDS,
    label: 'step_3_seeds',
    states: [
      'step_3_seeds'
    ]
  },
  {
    step: WorkflowStep.TOPICS,
    label: 'step_4_longtails',
    states: [
      'step_4_longtails',
      'step_4_longtails_running',
      'step_4_longtails_failed'
    ]
  },
  {
    step: WorkflowStep.VALIDATION,
    label: 'step_5_filtering',
    states: [
      'step_5_filtering',
      'step_5_filtering_running',
      'step_5_filtering_failed'
    ]
  },
  {
    step: WorkflowStep.ARTICLE,
    label: 'step_6_clustering',
    states: [
      'step_6_clustering',
      'step_6_clustering_running',
      'step_6_clustering_failed'
    ]
  },
  {
    step: WorkflowStep.PUBLISH,
    label: 'step_7_validation',
    states: [
      'step_7_validation',
      'step_7_validation_running',
      'step_7_validation_failed'
    ]
  },
  {
    step: WorkflowStep.SUBTOPICS,
    label: 'step_8_subtopics',
    states: [
      'step_8_subtopics',
      'step_8_subtopics_running',
      'step_8_subtopics_failed'
    ]
  },
  {
    step: WorkflowStep.ARTICLES,
    label: 'step_9_articles',
    states: [
      'step_9_articles',
      'step_9_articles_running',
      'step_9_articles_failed',
      'step_9_articles_queued'
    ]
  }
]

/**
 * Gets step number from configuration index
 * Allows mid-production step insertion without breaking analytics
 */
export function getStepNumber(stepKey: WorkflowStep): number {
  const index = WORKFLOW_STEPS.findIndex(s => s.step === stepKey)
  return index >= 0 ? index + 1 : 1
}

/**
 * Gets step key from step number
 * Provides reverse mapping for UI compatibility
 */
export function getStepKey(stepNumber: number): WorkflowStep {
  const step = WORKFLOW_STEPS[stepNumber - 1]
  return step?.step ?? WorkflowStep.ICP
}

/**
 * Terminal state handling configuration
 * Defines how terminal states map to steps for navigation purposes
 */
const TERMINAL_STATE_MAPPING: Record<string, number> = {
  'cancelled': 1, // Maps to first step for navigation reset (canonical lowercase)
  'completed': 9, // Maps to final step (canonical lowercase)
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
  
  // Fail fast - no silent fallback to step 1
  if (!stepDefinition) {
    throw new Error(`Unmapped workflow state: ${state}`)
  }
  
  // Return step number derived from configuration index
  return getStepNumber(stepDefinition.step)
}

/**
 * Maps workflow state to status string for UI display using declarative configuration
 * Maintains backward compatibility with existing UI expectations
 */
export function getStatusFromState(state: WorkflowState): string {
  // Handle terminal states specially
  if ((state as any) === 'cancelled') {
    return 'cancelled'
  }
  
  if ((state as any) === 'completed') {
    return 'completed'
  }

  // Find step definition that contains this state
  const stepDefinition = WORKFLOW_STEPS.find(step =>
    step.states.includes(state as any)
  )
  
  return stepDefinition?.label ?? 'step_1_icp'
}

/**
 * Determines if a user can access a specific step based on current state
 * Replaces the old current_step-based access control
 */
export function canAccessStep(currentState: WorkflowState, targetStep: number): boolean {
  // Cancelled workflows cannot access any steps
  if (currentState === 'cancelled') {
    return false
  }

  const currentStep = getStepFromState(currentState)
  return targetStep <= currentStep
}

/**
 * Gets the next accessible step based on current state
 * Returns null if at final step or in terminal state
 */
export function getNextStep(currentState: WorkflowState): number | null {
  const currentStep = getStepFromState(currentState)
  
  // Terminal states have no next step
  if ((currentState as any) === 'completed' || (currentState as any) === 'cancelled') {
    return null
  }
  
  const nextStep = currentStep + 1
  return nextStep <= 9 ? nextStep : null
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
  return currentState.endsWith('_running')
}

/**
 * Determines if workflow is in a failed state
 * Used for UI error display and retry logic
 */
export function isFailedState(currentState: WorkflowState): boolean {
  return currentState.endsWith('_failed')
}

/**
 * Determines if workflow is completed (either step completion or full completion)
 * Used for UI progression and analytics
 */
export function isCompletedState(currentState: WorkflowState): boolean {
  return currentState === 'completed'
}

/**
 * Gets step label for UI display
 * Provides human-readable step names
 */
export function getStepLabel(step: number): string {
  const labels = [
    'ICP Generation',
    'Competitor Analysis', 
    'Seed Keywords',
    'Longtail Expansion',
    'Filtering',
    'Clustering',
    'Validation',
    'Subtopics',
    'Articles'
  ]

  return labels[step - 1] ?? 'Unknown Step'
}

/**
 * Gets all states for a given step number
 * Useful for testing and validation
 */
export function getStatesForStep(stepNumber: number): WorkflowState[] {
  const stepDefinition = WORKFLOW_STEPS.find(step => getStepNumber(step.step) === stepNumber)
  return stepDefinition ? [...stepDefinition.states] as WorkflowState[] : []
}

/**
 * Validates that all workflow states are covered in the configuration
 * Used for development-time validation
 */
export function validateStateCoverage(): { valid: boolean; uncoveredStates: string[] } {
  const allStates: WorkflowState[] = [
    'CREATED',
    'step_1_icp',
    'step_2_competitors',
    'step_3_seeds',
    'step_4_longtails',
    'step_4_longtails_running',
    'step_4_longtails_failed',
    'step_5_filtering',
    'step_5_filtering_running',
    'step_5_filtering_failed',
    'step_6_clustering',
    'step_6_clustering_running',
    'step_6_clustering_failed',
    'step_7_validation',
    'step_7_validation_running',
    'step_7_validation_failed',
    'step_8_subtopics',
    'step_8_subtopics_running',
    'step_8_subtopics_failed',
    'step_9_articles',
    'step_9_articles_running',
    'step_9_articles_failed',
    'step_9_articles_queued',
    'completed',
    'cancelled'
  ]
  const coveredStates = new Set<string>()
  
  // Add all states from step definitions
  WORKFLOW_STEPS.forEach(step => {
    step.states.forEach(state => coveredStates.add(state))
  })
  
  // Add terminal state mappings
  Object.keys(TERMINAL_STATE_MAPPING).forEach(state => {
    coveredStates.add(state)
  })
  
  const uncoveredStates = allStates.filter(state => !coveredStates.has(state))
  
  return {
    valid: uncoveredStates.length === 0,
    uncoveredStates
  }
}

/**
 * Validates that each state appears exactly once across all steps
 * Critical for enterprise engines to prevent nondeterministic routing
 */
export function validateUniqueStateAssignment(): { valid: boolean; duplicateStates: string[] } {
  const allAssignedStates = WORKFLOW_STEPS.flatMap(step => step.states)
  const stateCounts = new Map<string, number>()
  
  // Count occurrences of each state
  allAssignedStates.forEach(state => {
    stateCounts.set(state, (stateCounts.get(state) || 0) + 1)
  })
  
  // Find duplicates (states that appear more than once)
  const duplicateStates = Array.from(stateCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([state, _]) => state)
  
  return {
    valid: duplicateStates.length === 0,
    duplicateStates
  }
}

/**
 * Comprehensive enterprise validation of the workflow state graph
 * Ensures both completeness and uniqueness
 */
export function validateWorkflowGraph(): { 
  valid: boolean; 
  errors: string[] 
} {
  const errors: string[] = []
  
  // Test 1: State coverage
  const coverage = validateStateCoverage()
  if (!coverage.valid) {
    errors.push(`Uncovered states: ${coverage.uncoveredStates.join(', ')}`)
  }
  
  // Test 2: Unique assignment
  const uniqueness = validateUniqueStateAssignment()
  if (!uniqueness.valid) {
    errors.push(`Duplicate state assignments: ${uniqueness.duplicateStates.join(', ')}`)
  }
  
  // Test 3: Step continuity (no gaps in step numbers)
  const stepNumbers = WORKFLOW_STEPS.map(s => getStepNumber(s.step)).sort((a, b) => a - b)
  for (let i = 1; i < stepNumbers.length; i++) {
    if (stepNumbers[i] - stepNumbers[i-1] !== 1) {
      errors.push(`Step number gap: missing step between ${stepNumbers[i-1]} and ${stepNumbers[i]}`)
    }
  }
  
  // Test 4: Terminal state consistency
  const allAssignedStates = WORKFLOW_STEPS.flatMap(step => step.states)
  const terminalStates = Object.keys(TERMINAL_STATE_MAPPING) as WorkflowState[]
  terminalStates.forEach(terminalState => {
    if (allAssignedStates.includes(terminalState)) {
      errors.push(`Terminal state ${terminalState} should not appear in step definitions`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}
