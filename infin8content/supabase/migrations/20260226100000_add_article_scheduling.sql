-- Add scheduled_at to articles table for separated planning/execution
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Performance index for scheduler
CREATE INDEX IF NOT EXISTS idx_articles_status_scheduled ON articles(status, scheduled_at) WHERE status = 'queued';

-- Add 'ready' to article_status check constraint in keywords table
-- This allows us to distinguish between 'not_started' and 'planning_complete'
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_article_status_check;
ALTER TABLE keywords 
ADD CONSTRAINT keywords_article_status_check 
CHECK (article_status IN ('not_started', 'in_progress', 'completed', 'failed', 'ready'));

-- Cleanup: Release any articles currently stuck in 'generating' back to 'queued'
-- for the new execution model to pick up.
UPDATE articles SET status = 'queued' WHERE status = 'generating';
