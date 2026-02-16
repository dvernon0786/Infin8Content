import type { WorkflowState } from '@/lib/fsm/workflow-events'

export function normalizeWorkflowStatus(
  status: string
): WorkflowState {
  // Since FSM is the single source of truth, only handle valid FSM states
  // This function can be used for backward compatibility if needed
  switch (status) {
    case 'step_4_topics':
      return 'step_4_longtails'
    case 'step_5_generation':
      return 'step_9_articles'
    case 'step_8_approval':
      return 'step_8_subtopics'
    default:
      return status as WorkflowState
  }
}
