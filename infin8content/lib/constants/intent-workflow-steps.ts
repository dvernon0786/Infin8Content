/**
 * Canonical Intent Engine Workflow Steps
 *
 * ⚠️ SINGLE SOURCE OF TRUTH
 * FSM is the canonical authority for WorkflowState
 * All other definitions re-export from FSM
 */

import { WorkflowState } from '@/lib/fsm/workflow-events'

/** Re-export FSM WorkflowState as canonical type */
export type { WorkflowState } from '@/lib/fsm/workflow-events'

/** Ordered execution steps (non-terminal) - aligned with FSM */
export const WORKFLOW_STEP_ORDER: WorkflowState[] = [
  'step_1_icp',
  'step_2_competitors',
  'step_3_seeds',
  'step_4_longtails',
  'step_5_filtering',
  'step_6_clustering',
  'step_7_validation',
  'step_8_subtopics',
  'step_9_articles',
]

/** All valid workflow states (including terminal state) - aligned with FSM */
export const ALL_WORKFLOW_STATES: WorkflowState[] = [
  ...WORKFLOW_STEP_ORDER,
  'completed',
]

/** Progress mapping for dashboard - FSM-aligned */
export const WORKFLOW_PROGRESS_MAP: Record<WorkflowState, number> = {
  step_1_icp: 15,
  step_2_competitors: 25,
  step_3_seeds: 35,
  step_4_longtails: 45,
  step_5_filtering: 55,
  step_6_clustering: 65,
  step_7_validation: 75,
  step_8_subtopics: 85,
  step_9_articles: 95,
  completed: 100,
}

/** Human-readable labels - FSM-aligned */
export const WORKFLOW_STEP_DESCRIPTIONS: Record<WorkflowState, string> = {
  step_1_icp: 'ICP Generation',
  step_2_competitors: 'Competitor Analysis',
  step_3_seeds: 'Seed Keyword Extraction',
  step_4_longtails: 'Long-tail Expansion',
  step_5_filtering: 'Keyword Filtering',
  step_6_clustering: 'Topic Clustering',
  step_7_validation: 'Cluster Validation',
  step_8_subtopics: 'Subtopic Generation',
  step_9_articles: 'Article Generation',
  completed: 'Completed',
}

/** Helper guards - FSM-aligned */
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

/** Dashboard helpers - FSM-aligned */
export function calculateProgress(status: string): number {
  return WORKFLOW_PROGRESS_MAP[status as WorkflowState] || 0
}

export function getStepDescription(status: string): string {
  return WORKFLOW_STEP_DESCRIPTIONS[status as WorkflowState] || 'Unknown'
}

/** Runtime assertion to prevent invalid states - FSM-aligned */
export function assertValidWorkflowState(
  status: string
): asserts status is WorkflowState {
  if (!ALL_WORKFLOW_STATES.includes(status as WorkflowState)) {
    throw new Error(
      `🚨 Invalid workflow status emitted: ${status}` 
    )
  }
}
