-- Update publish_references to support multi-CMS
-- Adds connection_id FK, expands platform CHECK constraint,
-- and replaces the UNIQUE(article_id, platform) constraint with
-- UNIQUE(article_id, connection_id) so the same article can be
-- published to multiple connections of the same platform.

-- 1. Add connection_id (nullable for backward compat with existing rows)
--    Guard: only add FK if cms_connections already exists (migration 1 required)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'cms_connections'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'publish_references' AND column_name = 'connection_id'
    ) THEN
      ALTER TABLE publish_references
        ADD COLUMN connection_id UUID REFERENCES cms_connections(id) ON DELETE SET NULL;
    END IF;
  ELSE
    RAISE NOTICE 'cms_connections not found — skipping connection_id FK. Run 20260317000001 first.';
  END IF;
END $$;

-- 2. Drop the old single-platform CHECK constraint (may exist under either name)
ALTER TABLE publish_references DROP CONSTRAINT IF EXISTS check_platform;
ALTER TABLE publish_references DROP CONSTRAINT IF EXISTS publish_references_platform_check;

-- 3. Add expanded multi-platform CHECK constraint
ALTER TABLE publish_references ADD CONSTRAINT check_platform
  CHECK (platform IN ('wordpress', 'webflow', 'shopify', 'ghost', 'notion', 'custom'));

-- 4. Replace UNIQUE(article_id, platform) with UNIQUE(article_id, connection_id)
--    so the same article can be published to two different WordPress/Webflow connections.
--    The old constraint name from the original migration is a UNIQUE index.
DO $$
BEGIN
  -- Drop old unique constraint (created as unique index or named constraint)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'publish_references_article_id_platform_key'
      AND conrelid = 'publish_references'::regclass
  ) THEN
    ALTER TABLE publish_references
      DROP CONSTRAINT publish_references_article_id_platform_key;
  END IF;
END $$;

-- Partial unique index: one publish per (article, connection); legacy rows
-- with no connection_id retain the (article, platform) uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS uq_publish_ref_article_connection
  ON publish_references(article_id, connection_id)
  WHERE connection_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_publish_ref_article_platform_legacy
  ON publish_references(article_id, platform)
  WHERE connection_id IS NULL;

-- 5. Index for connection_id lookups
CREATE INDEX IF NOT EXISTS idx_publish_references_connection_id ON publish_references(connection_id);

-- 6. Refresh RLS policies (correct org_id claim lookup + add UPDATE/DELETE)
DROP POLICY IF EXISTS "Organizations can view their own publish references" ON publish_references;
CREATE POLICY "Organizations can view their own publish references" ON publish_references
  FOR SELECT USING (
    article_id IN (
      SELECT id FROM articles
      WHERE org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Organizations can insert their own publish references" ON publish_references;
CREATE POLICY "Organizations can insert their own publish references" ON publish_references
  FOR INSERT WITH CHECK (
    article_id IN (
      SELECT id FROM articles
      WHERE org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Organizations can update their own publish references" ON publish_references;
CREATE POLICY "Organizations can update their own publish references" ON publish_references
  FOR UPDATE USING (
    article_id IN (
      SELECT id FROM articles
      WHERE org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

DROP POLICY IF EXISTS "Organizations can delete their own publish references" ON publish_references;
CREATE POLICY "Organizations can delete their own publish references" ON publish_references
  FOR DELETE USING (
    article_id IN (
      SELECT id FROM articles
      WHERE org_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );
