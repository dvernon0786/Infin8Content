-- Legacy Column Cleanup Migration
-- 
-- This migration removes all legacy workflow columns that are no longer needed
-- after the unified workflow state machine implementation.
--
-- LEGACY COLUMNS TO REMOVE:
-- - status: Replaced by unified 'state' column
-- - current_step: Replaced by state-driven progression
-- - workflow_data: Replaced by specific columns (icp_data)
-- - retry_count: No longer needed with proper error handling
-- - step_*_error_message: Replaced by proper error logging
-- - step_*_last_error_message: Replaced by proper error logging

-- First, let's verify the current table structure
-- \d intent_workflows

-- Drop legacy error message columns (no longer needed)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS step_1_icp_error_message,
  DROP COLUMN IF EXISTS step_2_competitor_error_message,
  DROP COLUMN IF EXISTS step_3_seeds_error_message,
  DROP COLUMN IF EXISTS step_4_longtails_error_message,
  DROP COLUMN IF EXISTS step_5_filter_error_message,
  DROP COLUMN IF EXISTS step_6_cluster_error_message,
  DROP COLUMN IF EXISTS step_7_validate_error_message,
  DROP COLUMN IF EXISTS step_8_subtopics_error_message,
  DROP COLUMN IF EXISTS step_9_articles_error_message;

-- Drop legacy last error message columns (no longer needed)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS step_1_icp_last_error_message,
  DROP COLUMN IF EXISTS step_2_competitors_last_error_message,
  DROP COLUMN IF EXISTS step_3_seeds_last_error_message,
  DROP COLUMN IF EXISTS step_4_longtails_last_error_message,
  DROP COLUMN IF EXISTS step_5_filtering_last_error_message,
  DROP COLUMN IF EXISTS step_6_clustering_last_error_message,
  DROP COLUMN IF EXISTS step_7_validation_last_error_message,
  DROP COLUMN IF EXISTS step_8_subtopics_last_error_message,
  DROP COLUMN IF EXISTS step_9_articles_last_error_message;

-- Drop legacy status column (replaced by unified state)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS status;

-- Drop legacy current_step column (replaced by state-driven progression)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS current_step;

-- Drop legacy workflow_data column (replaced by specific columns)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS workflow_data;

-- Drop legacy retry_count column (no longer needed)
ALTER TABLE intent_workflows
  DROP COLUMN IF EXISTS retry_count;

-- Add comment documenting the clean schema
COMMENT ON TABLE intent_workflows IS 'Clean unified workflow schema with single state column and specific data columns';

-- Final clean schema should be:
-- - id (UUID PK)
-- - organization_id (UUID FK)
-- - name (TEXT)
-- - state (workflow_state_enum)
-- - icp_data (JSONB)
-- - created_at (TIMESTAMPTZ)
-- - updated_at (TIMESTAMPTZ)
-- - created_by (UUID FK)
-- - cancelled_at (TIMESTAMPTZ, nullable)
-- - cancelled_by (UUID FK, nullable)
