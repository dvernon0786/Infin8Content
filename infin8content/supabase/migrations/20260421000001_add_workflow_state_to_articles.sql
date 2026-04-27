-- Add workflow_state JSONB column to articles table.
-- This column stores per-article SEO metadata edited in the article detail UI
-- (focus keyword, meta description, featured image, tags, etc.) as well as
-- workflow progress flags written by the intent-engine queuing processor.
-- Referenced in: ArticleDetailClient, ArticleEditClient, intent/workflows API
-- Safe to re-run: uses IF NOT EXISTS guard.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS workflow_state JSONB DEFAULT NULL;

-- Index for querying articles by workflow stage (e.g. filtering queued articles)
CREATE INDEX IF NOT EXISTS idx_articles_workflow_state
  ON articles USING GIN (workflow_state)
  WHERE workflow_state IS NOT NULL;

COMMENT ON COLUMN articles.workflow_state IS
  'JSONB payload carrying per-article workflow progress and SEO metadata '
  '(focusKeyword, metaDescription, featuredImageUrl, featuredImageAlt, tags). '
  'Written by ArticleDetailClient/ArticleEditClient and the intent-engine processor.';
