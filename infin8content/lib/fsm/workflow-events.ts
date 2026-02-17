export type WorkflowState =
  | 'step_1_icp'
  | 'step_2_competitors'
  | 'step_3_seeds'
  | 'step_4_longtails'
  | 'step_4_longtails_running'
  | 'step_4_longtails_failed'
  | 'step_5_filtering'
  | 'step_5_filtering_running'
  | 'step_5_filtering_failed'
  | 'step_6_clustering'
  | 'step_6_clustering_running'
  | 'step_6_clustering_failed'
  | 'step_7_validation'
  | 'step_7_validation_running'
  | 'step_7_validation_failed'
  | 'step_8_subtopics'
  | 'step_8_subtopics_running'
  | 'step_8_subtopics_failed'
  | 'step_9_articles'
  | 'step_9_articles_running'
  | 'step_9_articles_queued'
  | 'step_9_articles_failed'
  | 'completed'

export type WorkflowEvent =
  // Step 1-3 (existing)
  | 'ICP_COMPLETED'
  | 'COMPETITORS_COMPLETED'
  | 'SEEDS_APPROVED'
  | 'HUMAN_RESET'

  // Step 4
  | 'LONGTAIL_START'
  | 'LONGTAIL_SUCCESS'
  | 'LONGTAIL_FAILED'
  | 'LONGTAIL_RETRY'

  // Step 5
  | 'FILTERING_START'
  | 'FILTERING_SUCCESS'
  | 'FILTERING_FAILED'
  | 'FILTERING_RETRY'

  // Step 6
  | 'CLUSTERING_START'
  | 'CLUSTERING_SUCCESS'
  | 'CLUSTERING_FAILED'
  | 'CLUSTERING_RETRY'

  // Step 7
  | 'VALIDATION_START'
  | 'VALIDATION_SUCCESS'
  | 'VALIDATION_FAILED'
  | 'VALIDATION_RETRY'

  // Step 8
  | 'SUBTOPICS_START'
  | 'SUBTOPICS_SUCCESS'
  | 'SUBTOPICS_FAILED'
  | 'SUBTOPICS_RETRY'

  // Step 9
  | 'ARTICLES_START'
  | 'ARTICLES_SUCCESS'
  | 'ARTICLES_FAILED'
  | 'ARTICLES_RETRY'

  // Human Approval Events (separate from automated pipeline)
  | 'HUMAN_SUBTOPICS_APPROVED'
  | 'HUMAN_SUBTOPICS_REJECTED'

  // Final
  | 'WORKFLOW_COMPLETED'
