-- Migrate existing WordPress integrations from organizations.blog_config
-- to the new cms_connections table.
--
-- SAFE: Idempotent — skips orgs already migrated. Runs after
-- 20260317000001_create_cms_connections.sql.
--
-- Credentials in blog_config already have application_password encrypted
-- via AES-256-GCM — we carry them forward verbatim.

DO $$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  -- Guard: skip if cms_connections doesn't exist yet (migration 1 not yet applied)
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'cms_connections'
  ) THEN
    RAISE NOTICE 'cms_connections table not found — skipping data migration. Run 20260317000001 first.';
    RETURN;
  END IF;

  INSERT INTO cms_connections (org_id, platform, name, credentials, status, created_at, updated_at)
  SELECT
    id AS org_id,
    'wordpress' AS platform,
    COALESCE(
      blog_config->'integrations'->'wordpress'->>'site_name',
      'WordPress'
    ) AS name,
    jsonb_build_object(
      'url',                  blog_config->'integrations'->'wordpress'->>'url',
      'username',             blog_config->'integrations'->'wordpress'->>'username',
      'application_password', blog_config->'integrations'->'wordpress'->>'application_password'
    ) AS credentials,
    'active' AS status,
    NOW() AS created_at,
    NOW() AS updated_at
  FROM organizations
  WHERE
    -- Has a WordPress integration configured
    blog_config->'integrations'->'wordpress' IS NOT NULL
    AND (blog_config->'integrations'->'wordpress'->>'url') IS NOT NULL
    AND (blog_config->'integrations'->'wordpress'->>'application_password') IS NOT NULL
    -- Idempotency: skip orgs already in cms_connections as wordpress
    AND id NOT IN (
      SELECT org_id FROM cms_connections WHERE platform = 'wordpress'
    );

  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % WordPress connection(s) to cms_connections', migrated_count;
END $$;
