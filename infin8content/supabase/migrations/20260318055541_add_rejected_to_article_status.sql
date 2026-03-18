-- Migration: Add 'rejected' to keywords.article_status CHECK constraint
-- Story 38.1: Subtopic Approval — reject individual subtopics

-- -----------------------------------------------------------------------
-- PRE-FLIGHT VERIFICATION (run this SELECT before applying in production)
-- to understand the data impact before committing the changes below.
-- -----------------------------------------------------------------------
-- SELECT article_status, COUNT(*) AS row_count
-- FROM keywords
-- WHERE article_status IN ('in_progress', 'completed', 'failed')
-- GROUP BY article_status
-- ORDER BY article_status;
--
-- Expected: zero or near-zero rows for a post-launch system.
-- If 'completed' has a significant count, confirm mapping to 'draft' is
-- intentional (draft = article created but not yet scheduled) vs. keeping
-- them as a terminal state before applying this migration.
-- -----------------------------------------------------------------------

-- Drop the existing constraint (must drop before data cleanup so updates aren't blocked)
ALTER TABLE keywords
  DROP CONSTRAINT IF EXISTS keywords_article_status_check;

-- -----------------------------------------------------------------------
-- Data cleanup: map historical statuses that are no longer in the new
-- constraint ('in_progress', 'completed', 'failed') to valid states.
-- Without this the ADD CONSTRAINT below will fail on any existing rows.
-- -----------------------------------------------------------------------
UPDATE keywords SET article_status = 'draft'       WHERE article_status = 'in_progress';
UPDATE keywords SET article_status = 'draft'       WHERE article_status = 'completed';
UPDATE keywords SET article_status = 'not_started' WHERE article_status = 'failed';

-- Re-add the constraint with 'rejected' included
ALTER TABLE keywords
  ADD CONSTRAINT keywords_article_status_check
    CHECK (article_status IN ('not_started', 'ready', 'rejected', 'draft', 'published'));
