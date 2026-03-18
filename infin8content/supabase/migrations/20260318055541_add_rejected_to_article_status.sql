-- Migration: Add 'rejected' to keywords.article_status CHECK constraint
-- Story 38.1: Subtopic Approval — reject individual subtopics

-- Drop the existing constraint
ALTER TABLE keywords
  DROP CONSTRAINT IF EXISTS keywords_article_status_check;

-- Re-add the constraint with 'rejected' included
ALTER TABLE keywords
  ADD CONSTRAINT keywords_article_status_check
    CHECK (article_status IN ('not_started', 'ready', 'rejected', 'draft', 'published'));
