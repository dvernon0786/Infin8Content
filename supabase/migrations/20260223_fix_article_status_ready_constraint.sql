-- Migration: Add 'ready' to article_status check constraint
-- Bug Fix: Allow article_status = 'ready' for approved subtopics
-- Date: 2026-02-23

-- Drop existing check constraint
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_article_status_check;

-- Re-add check constraint with 'ready' included
ALTER TABLE keywords 
ADD CONSTRAINT keywords_article_status_check 
CHECK (article_status IN ('not_started', 'in_progress', 'completed', 'failed', 'ready'));

-- Add comment explaining the change
COMMENT ON CONSTRAINT keywords_article_status_check ON keywords IS 'Allows article_status to be ready when subtopics are approved';
