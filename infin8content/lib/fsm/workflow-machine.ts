import { WorkflowState, WorkflowEvent } from './workflow-events'

export const WorkflowTransitions: Record<
  WorkflowState,
  Partial<Record<WorkflowEvent, WorkflowState>>
> = {
  step_1_icp: { ICP_COMPLETED: 'step_2_competitors' },
  step_2_competitors: { COMPETITORS_COMPLETED: 'step_3_seeds' },
  step_3_seeds: { SEEDS_APPROVED: 'step_4_longtails' },
  step_4_longtails: { LONGTAILS_COMPLETED: 'step_5_filtering' },
  step_4_longtails_running: {},
  step_4_longtails_failed: {},
  step_5_filtering: { FILTERING_COMPLETED: 'step_6_clustering' },
  step_5_filtering_running: {},
  step_5_filtering_failed: {},
  step_6_clustering: { CLUSTERING_COMPLETED: 'step_7_validation' },
  step_6_clustering_running: {},
  step_6_clustering_failed: {},
  step_7_validation: { VALIDATION_COMPLETED: 'step_8_subtopics' },
  step_7_validation_running: {},
  step_7_validation_failed: {},
  step_8_subtopics: { SUBTOPICS_APPROVED: 'step_9_articles' },
  step_8_subtopics_running: {},
  step_8_subtopics_failed: {},
  step_9_articles: { ARTICLES_COMPLETED: 'completed' },
  step_9_articles_running: {},
  step_9_articles_failed: {},
  completed: {}
}
