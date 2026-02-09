import type { WorkflowState } from '@/lib/constants/intent-workflow-steps'

export function normalizeWorkflowStatus(
  status: string
): WorkflowState {
  switch (status) {
    case 'step_3_seeds':
      return 'step_3_keywords'
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
