-- Drop the conflicting UNIQUE constraint that blocks longtail inserts
-- This constraint conflicts with the correct composite key (workflow_id, keyword, parent_seed_keyword_id)

DROP INDEX IF EXISTS keywords_workflow_keyword_unique;

-- Keep only the correct composite unique constraint
-- This allows seeds and longtails with same keyword but different parent_seed_keyword_id
