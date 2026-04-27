-- Epic 12: Onboarding & Feature Discovery
-- Migration 2/4: Feature announcements system
-- Story: 12-8 (feature announcement system)

CREATE TABLE IF NOT EXISTS feature_announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  cta_url       TEXT,
  cta_label     TEXT,
  target_plans  TEXT[] DEFAULT '{}',
  active_from   TIMESTAMPTZ NOT NULL,
  active_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for efficient active announcement lookup
CREATE INDEX IF NOT EXISTS idx_feature_announcements_active
  ON feature_announcements (active_from, active_until);

-- RLS: authenticated users can read active announcements; only service_role can write
ALTER TABLE feature_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read announcements"
  ON feature_announcements
  FOR SELECT
  TO authenticated
  USING (
    active_from <= now()
    AND (active_until IS NULL OR active_until > now())
  );

-- Reads tracking table
CREATE TABLE IF NOT EXISTS announcement_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES feature_announcements(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, announcement_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON announcement_reads (user_id);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own announcement reads"
  ON announcement_reads
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own announcement reads"
  ON announcement_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
