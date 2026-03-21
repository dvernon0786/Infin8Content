-- Verify the current workflow state after normalization
-- This checks that our test workflow still has the correct state

SELECT 
  id,
  name,
  state,
  current_step,
  status,
  updated_at
FROM intent_workflows 
WHERE id = '50d72011-a9bf-4221-afc9-4c0573f9dac9';

-- Test the new state-driven logic
SELECT 
  state,
  CASE 
    WHEN state IN ('CREATED', 'ICP_PENDING', 'ICP_PROCESSING') THEN 1
    WHEN state IN ('ICP_COMPLETED', 'COMPETITOR_PENDING', 'COMPETITOR_PROCESSING') THEN 2
    WHEN state IN ('COMPETITOR_COMPLETED', 'CLUSTERING_PENDING', 'CLUSTERING_PROCESSING') THEN 3
    WHEN state = 'CLUSTERING_COMPLETED' THEN 4
    WHEN state = 'VALIDATION_COMPLETED' THEN 5
    WHEN state = 'ARTICLE_COMPLETED' THEN 6
    WHEN state IN ('PUBLISH_COMPLETED', 'COMPLETED') THEN 7
    ELSE 1
  END as derived_step,
  CASE 
    WHEN state IN ('CREATED', 'ICP_PENDING', 'ICP_PROCESSING', 'ICP_FAILED') THEN 'step_1_icp'
    WHEN state IN ('ICP_COMPLETED', 'COMPETITOR_PENDING', 'COMPETITOR_PROCESSING', 'COMPETITOR_FAILED') THEN 'step_2_competitors'
    WHEN state IN ('COMPETITOR_COMPLETED', 'CLUSTERING_PENDING', 'CLUSTERING_PROCESSING', 'CLUSTERING_FAILED') THEN 'step_3_keywords'
    WHEN state = 'CLUSTERING_COMPLETED' THEN 'step_4_topics'
    WHEN state IN ('VALIDATION_COMPLETED', 'VALIDATION_FAILED') THEN 'step_5_generation'
    WHEN state IN ('ARTICLE_COMPLETED', 'ARTICLE_FAILED') THEN 'step_6_generation'
    WHEN state IN ('PUBLISH_COMPLETED', 'PUBLISH_FAILED', 'COMPLETED') THEN 'completed'
    WHEN state = 'CANCELLED' THEN 'cancelled'
    ELSE 'step_1_icp'
  END as derived_status
FROM intent_workflows 
WHERE id = '50d72011-a9bf-4221-afc9-4c0573f9dac9';
