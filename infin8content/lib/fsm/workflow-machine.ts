import { WorkflowState, WorkflowEvent } from './workflow-events'

export const WorkflowTransitions: Record<
  WorkflowState,
  Partial<Record<WorkflowEvent, WorkflowState>>
> = {
  step_1_icp: { ICP_COMPLETED: 'step_2_competitors' },
  step_2_competitors: { COMPETITORS_COMPLETED: 'step_3_seeds' },
  step_3_seeds: { SEEDS_APPROVED: 'step_4_longtails' },
  
  // Step 4: Long-tails
  step_4_longtails: { LONGTAIL_START: 'step_4_longtails_running' },
  step_4_longtails_running: { 
    LONGTAIL_SUCCESS: 'step_5_filtering',
    LONGTAIL_FAILED: 'step_4_longtails_failed'
  },
  step_4_longtails_failed: { LONGTAIL_RETRY: 'step_4_longtails_running' },
  
  // Step 5: Filtering
  step_5_filtering: { FILTERING_START: 'step_5_filtering_running' },
  step_5_filtering_running: { 
    FILTERING_SUCCESS: 'step_6_clustering',
    FILTERING_FAILED: 'step_5_filtering_failed'
  },
  step_5_filtering_failed: { FILTERING_RETRY: 'step_5_filtering_running' },
  
  // Step 6: Clustering
  step_6_clustering: { CLUSTERING_START: 'step_6_clustering_running' },
  step_6_clustering_running: { 
    CLUSTERING_SUCCESS: 'step_7_validation',
    CLUSTERING_FAILED: 'step_6_clustering_failed'
  },
  step_6_clustering_failed: { CLUSTERING_RETRY: 'step_6_clustering_running' },
  
  // Step 7: Validation
  step_7_validation: { VALIDATION_START: 'step_7_validation_running' },
  step_7_validation_running: { 
    VALIDATION_SUCCESS: 'step_8_subtopics',
    VALIDATION_FAILED: 'step_7_validation_failed'
  },
  step_7_validation_failed: { VALIDATION_RETRY: 'step_7_validation_running' },
  
  // Step 8: Subtopics
  step_8_subtopics: { SUBTOPICS_START: 'step_8_subtopics_running' },
  step_8_subtopics_running: { 
    SUBTOPICS_SUCCESS: 'step_9_articles',
    SUBTOPICS_FAILED: 'step_8_subtopics_failed'
  },
  step_8_subtopics_failed: { SUBTOPICS_RETRY: 'step_8_subtopics_running' },
  
  // Step 9: Articles
  step_9_articles: { ARTICLES_START: 'step_9_articles_running' },
  step_9_articles_running: { 
    ARTICLES_SUCCESS: 'completed',
    ARTICLES_FAILED: 'step_9_articles_failed'
  },
  step_9_articles_failed: { ARTICLES_RETRY: 'step_9_articles_running' },
  
  completed: {}
}
