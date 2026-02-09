import type { WorkflowState } from '@/lib/constants/intent-workflow-steps'

export interface WorkflowStepConfig {
  step: WorkflowState
  label: string
  endpoint: string
  autoAdvance: boolean
  hidden?: boolean // Add hidden flag for internal steps
}

export const WORKFLOW_STEP_CONFIG: WorkflowStepConfig[] = [
  {
    step: 'step_0_auth',
    label: 'Generate ICP',
    endpoint: 'steps/icp-generate',
    autoAdvance: false,
    hidden: true, // Hide from UI progress - execution-only step
  },
  {
    step: 'step_1_icp',
    label: 'Generate ICP',
    endpoint: 'steps/icp-generate',
    autoAdvance: true,
  },
  {
    step: 'step_2_competitors',
    label: 'Analyze Competitors',
    endpoint: 'steps/competitor-analyze',
    autoAdvance: false, // verify later
  },
  {
    step: 'step_3_keywords',
    label: 'Extract Seed Keywords',
    endpoint: 'steps/seed-extract',
    autoAdvance: false,
  },
  {
    step: 'step_4_longtails',
    label: 'Expand Longtails',
    endpoint: 'steps/longtail-expand',
    autoAdvance: true,
  },
  {
    step: 'step_5_filtering',
    label: 'Filter Keywords',
    endpoint: 'steps/filter-keywords',
    autoAdvance: false,
  },
  {
    step: 'step_6_clustering',
    label: 'Cluster Topics',
    endpoint: 'steps/cluster-topics',
    autoAdvance: false,
  },
  {
    step: 'step_7_validation',
    label: 'Validate Clusters',
    endpoint: 'steps/validate-clusters',
    autoAdvance: false,
  },
  {
    step: 'step_8_subtopics',
    label: 'Generate Subtopics',
    endpoint: 'steps/human-approval',
    autoAdvance: false,
  },
  {
    step: 'step_9_articles',
    label: 'Queue Articles',
    endpoint: 'steps/queue-articles',
    autoAdvance: true,
  },
]
