-- Add unique constraints for keywords table to ensure idempotency
-- Critical for Inngest worker retries to prevent duplicate data

-- Primary unique constraint for workflow + keyword combination
CREATE UNIQUE INDEX IF NOT EXISTS keywords_workflow_keyword_unique 
ON keywords (workflow_id, keyword);

-- Extended unique constraint for parent-child relationships
-- Prevents duplicate longtail keywords under same seed
CREATE UNIQUE INDEX IF NOT EXISTS keywords_workflow_keyword_parent_unique 
ON keywords (workflow_id, keyword, parent_seed_keyword_id);

-- Add comment explaining purpose
COMMENT ON INDEX keywords_workflow_keyword_unique IS 'Prevents duplicate keywords within same workflow during Inngest worker retries';
COMMENT ON INDEX keywords_workflow_keyword_parent_unique IS 'Prevents duplicate longtail keywords under same seed keyword during retries';
