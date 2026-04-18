-- ============================================================
-- Migration: 20260418000000_add_social_publishing
-- Adds org-level social account storage (Outstand IDs) and
-- extends publish_references to track Outstand post state +
-- per-account analytics.
-- ============================================================

-- ----------------------------------------------------------
-- 1. org_social_accounts
--    Stores the Outstand social-account IDs that belong to
--    an org. One row per connected account.
--    Seeded when the user connects via Outstand's OAuth flow.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_social_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  outstand_account_id TEXT NOT NULL,          -- e.g. "acc_abc123"
  network             TEXT NOT NULL,          -- "twitter" | "linkedin" | "instagram" …
  username            TEXT,                   -- display name / handle
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id, outstand_account_id)
);

-- RLS: orgs only see their own social accounts
ALTER TABLE org_social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_social_accounts_select"
  ON org_social_accounts FOR SELECT
  USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "org_social_accounts_insert"
  ON org_social_accounts FOR INSERT
  WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "org_social_accounts_update"
  ON org_social_accounts FOR UPDATE
  USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "org_social_accounts_delete"
  ON org_social_accounts FOR DELETE
  USING (organization_id::text = auth.jwt() ->> 'org_id');

-- ----------------------------------------------------------
-- 2. Extend publish_references
--    Add Outstand-specific columns.
-- ----------------------------------------------------------
ALTER TABLE publish_references
  ADD COLUMN IF NOT EXISTS outstand_post_id    TEXT,
  ADD COLUMN IF NOT EXISTS social_status       TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS social_error        TEXT,
  ADD COLUMN IF NOT EXISTS analytics_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analytics_data      JSONB;

-- ----------------------------------------------------------
-- 3. article_social_analytics
--    Per-account analytics snapshot pulled by the
--    fetch-and-store-analytics Inngest step.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_social_analytics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id          UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  outstand_post_id    TEXT NOT NULL,
  network             TEXT NOT NULL,
  username            TEXT,
  platform_post_id    TEXT,
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  views               INTEGER DEFAULT 0,
  impressions         INTEGER DEFAULT 0,
  reach               INTEGER DEFAULT 0,
  engagement_rate     NUMERIC(6,4) DEFAULT 0,
  fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (article_id, outstand_post_id, network)
);

ALTER TABLE article_social_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_social_analytics_select"
  ON article_social_analytics FOR SELECT
  USING (organization_id::text = auth.jwt() ->> 'org_id');

-- Service-role (Inngest) handles inserts; no client-side insert policy needed.

-- ----------------------------------------------------------
-- 4. Trigger: keep org_social_accounts.updated_at fresh
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_org_social_accounts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_org_social_accounts_updated_at
  BEFORE UPDATE ON org_social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_org_social_accounts_updated_at();
