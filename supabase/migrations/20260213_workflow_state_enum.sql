-- Replace current_step + status with single state enum
-- This creates a proper workflow engine with legal state transitions

-- Add state column with default
ALTER TABLE intent_workflows
ADD COLUMN state TEXT NOT NULL DEFAULT 'CREATED';

-- Create index for fast state lookups
CREATE INDEX idx_workflows_state ON intent_workflows(state);

-- Backfill existing workflows based on current_step and status
UPDATE intent_workflows SET state = CASE
  -- Step 1 states
  WHEN current_step = 1 AND status = 'step_1_icp' THEN 'ICP_PENDING'
  WHEN current_step = 1 AND status LIKE '%processing%' THEN 'ICP_PROCESSING'
  WHEN current_step = 1 AND status LIKE '%completed%' THEN 'ICP_COMPLETED'
  WHEN current_step = 1 AND status = 'failed' THEN 'ICP_FAILED'
  
  -- Step 2 states
  WHEN current_step = 2 AND status = 'step_2_competitors' THEN 'COMPETITOR_PENDING'
  WHEN current_step = 2 AND status LIKE '%processing%' THEN 'COMPETITOR_PROCESSING'
  WHEN current_step = 2 AND status LIKE '%completed%' THEN 'COMPETITOR_COMPLETED'
  WHEN current_step = 2 AND status = 'failed' THEN 'COMPETITOR_FAILED'
  
  -- Step 3 states (seed review - no processing state)
  WHEN current_step = 3 AND status = 'step_3_seeds' THEN 'SEED_REVIEW_PENDING'
  WHEN current_step = 3 AND status LIKE '%completed%' THEN 'SEED_REVIEW_COMPLETED'
  
  -- Step 4 states (clustering)
  WHEN current_step = 4 AND status = 'step_4_clustering' THEN 'CLUSTERING_PENDING'
  WHEN current_step = 4 AND status LIKE '%processing%' THEN 'CLUSTERING_PROCESSING'
  WHEN current_step = 4 AND status LIKE '%completed%' THEN 'CLUSTERING_COMPLETED'
  WHEN current_step = 4 AND status = 'failed' THEN 'CLUSTERING_FAILED'
  
  -- Step 5 states (validation)
  WHEN current_step = 5 AND status = 'step_5_validation' THEN 'VALIDATION_PENDING'
  WHEN current_step = 5 AND status LIKE '%processing%' THEN 'VALIDATION_PROCESSING'
  WHEN current_step = 5 AND status LIKE '%completed%' THEN 'VALIDATION_COMPLETED'
  WHEN current_step = 5 AND status = 'failed' THEN 'VALIDATION_FAILED'
  
  -- Step 6 states (article generation)
  WHEN current_step = 6 AND status = 'step_6_articles' THEN 'ARTICLE_PENDING'
  WHEN current_step = 6 AND status LIKE '%processing%' THEN 'ARTICLE_PROCESSING'
  WHEN current_step = 6 AND status LIKE '%completed%' THEN 'ARTICLE_COMPLETED'
  WHEN current_step = 6 AND status = 'failed' THEN 'ARTICLE_FAILED'
  
  -- Step 7 states (publishing)
  WHEN current_step = 7 AND status = 'step_7_publish' THEN 'PUBLISH_PENDING'
  WHEN current_step = 7 AND status LIKE '%processing%' THEN 'PUBLISH_PROCESSING'
  WHEN current_step = 7 AND status LIKE '%completed%' THEN 'PUBLISH_COMPLETED'
  WHEN current_step = 7 AND status = 'failed' THEN 'PUBLISH_FAILED'
  
  -- Terminal states
  WHEN current_step >= 8 OR status LIKE '%completed%' THEN 'COMPLETED'
  WHEN status = 'cancelled' THEN 'CANCELLED'
  
  -- Default to created for unknown states
  ELSE 'CREATED'
END;

-- Add constraints to ensure only valid states can be used
ALTER TABLE intent_workflows
ADD CONSTRAINT valid_workflow_state 
CHECK (state IN (
  'CREATED', 'CANCELLED', 'COMPLETED',
  'ICP_PENDING', 'ICP_PROCESSING', 'ICP_COMPLETED', 'ICP_FAILED',
  'COMPETITOR_PENDING', 'COMPETITOR_PROCESSING', 'COMPETITOR_COMPLETED', 'COMPETITOR_FAILED',
  'SEED_REVIEW_PENDING', 'SEED_REVIEW_COMPLETED',
  'CLUSTERING_PENDING', 'CLUSTERING_PROCESSING', 'CLUSTERING_COMPLETED', 'CLUSTERING_FAILED',
  'VALIDATION_PENDING', 'VALIDATION_PROCESSING', 'VALIDATION_COMPLETED', 'VALIDATION_FAILED',
  'ARTICLE_PENDING', 'ARTICLE_PROCESSING', 'ARTICLE_COMPLETED', 'ARTICLE_FAILED',
  'PUBLISH_PENDING', 'PUBLISH_PROCESSING', 'PUBLISH_COMPLETED', 'PUBLISH_FAILED'
));

-- Note: We'll drop current_step and status columns in a later migration
-- after the code is fully migrated to use state enum
