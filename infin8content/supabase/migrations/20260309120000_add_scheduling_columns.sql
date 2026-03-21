-- ============================================================
-- Migration: Add scheduling and CMS draft columns to articles
-- Date: 2026-03-09
-- Description: Formalises scheduled_at (already used by the
--              scheduler worker but absent from the schema),
--              adds publish_at, cms_status, and per-article
--              notification tracking columns.  Adds two partial
--              indexes to keep the scheduler and publish-reminder
--              queries efficient at scale.
-- ============================================================

-- 1. cms_status enum
--    none      → article not yet pushed to CMS
--    draft     → generation complete, sitting in CMS as draft
--    published → human has published (set manually / via CMS webhook)
DO $$ BEGIN
  CREATE TYPE cms_status_type AS ENUM ('none', 'draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add columns
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS scheduled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cms_status          cms_status_type NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS draft_notified_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_reminded_at TIMESTAMPTZ;

-- 3. Partial index — scheduler worker query
--    SELECT … WHERE status = 'queued' AND scheduled_at <= now()
CREATE INDEX IF NOT EXISTS idx_articles_scheduler
  ON articles (scheduled_at ASC)
  WHERE status = 'queued' AND scheduled_at IS NOT NULL;

-- 4. Partial index — publish-reminder cron
--    SELECT … WHERE cms_status = 'draft' AND publish_at <= now()
--                   AND publish_reminded_at IS NULL
CREATE INDEX IF NOT EXISTS idx_articles_publish_reminder
  ON articles (publish_at ASC)
  WHERE cms_status = 'draft'
    AND publish_at IS NOT NULL
    AND publish_reminded_at IS NULL;

-- 5. Partial index — draft-notifier cron
--    SELECT … WHERE status = 'completed' AND cms_status = 'none'
--                   AND draft_notified_at IS NULL
CREATE INDEX IF NOT EXISTS idx_articles_draft_pending
  ON articles (updated_at ASC)
  WHERE status = 'completed'
    AND cms_status = 'none'
    AND draft_notified_at IS NULL;
