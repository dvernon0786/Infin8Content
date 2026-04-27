-- ============================================================
-- Migration: Add org_tags table for cross-article tag suggestions
-- ============================================================

-- 1. Extension FIRST — must exist before any GIN trigram index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create org_tags table
CREATE TABLE IF NOT EXISTS org_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT org_tags_org_id_name_key UNIQUE (org_id, name)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_org_tags_org_id
  ON org_tags(org_id);

-- Trigram index for prefix/fuzzy autocomplete — extension must exist first (see step 1)
CREATE INDEX IF NOT EXISTS idx_org_tags_name_trgm
  ON org_tags USING gin(name gin_trgm_ops);

-- 4. Row-Level Security
ALTER TABLE org_tags ENABLE ROW LEVEL SECURITY;

-- SELECT: user can read tags that belong to their own org
-- Uses auth.uid() → users.organization_id subquery — works with standard Supabase JWTs.
-- This avoids the fragile (auth.jwt() ->> 'org_id') claim that is NOT present in
-- default Supabase JWTs and would silently return 0 rows for every query.
CREATE POLICY "org_tags_select_own_org" ON org_tags
  FOR SELECT
  USING (
    org_id = (
      SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- INSERT / UPSERT: same isolation check on write
CREATE POLICY "org_tags_insert_own_org" ON org_tags
  FOR INSERT
  WITH CHECK (
    org_id = (
      SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- Service-role key bypasses RLS automatically — Inngest background jobs are fine.

-- 5. Backfill: extract existing tags from workflow_state into org_tags
--    Safe to re-run (ON CONFLICT DO NOTHING).
INSERT INTO org_tags (org_id, name)
SELECT DISTINCT
  a.org_id,
  tag.value::text AS name
FROM
  articles a,
  jsonb_array_elements_text(
    CASE
      WHEN a.workflow_state IS NOT NULL
        AND a.workflow_state ? 'tags'
        AND jsonb_typeof(a.workflow_state -> 'tags') = 'array'
      THEN a.workflow_state -> 'tags'
      ELSE '[]'::jsonb
    END
  ) AS tag(value)
WHERE
  a.org_id IS NOT NULL
  AND tag.value::text <> ''
ON CONFLICT (org_id, name) DO NOTHING;

-- 6. Ensure workflow_state column exists on articles (safety guard for older envs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_name = 'articles'
      AND  column_name = 'workflow_state'
  ) THEN
    ALTER TABLE articles ADD COLUMN workflow_state JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_articles_workflow_state_gin
      ON articles USING gin(workflow_state);
  END IF;
END
$$;

COMMENT ON TABLE org_tags IS
  'Per-org tag registry for cross-article autocomplete. '
  'Tags are also stored in articles.workflow_state.tags (per-article source of truth). '
  'This table enables O(1) suggestion queries without JSONB full-scans.';
