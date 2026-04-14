-- ============================================================
-- MIGRATION VERIFICATION: 000001 → 000002 → 000003
-- Single UNION ALL query — all results appear in one result set.
-- Every row should show PASS.
-- ============================================================
SELECT migration, check_name AS check, result
FROM (

  -- ── 000001: cms_connections table ────────────────────────

  -- 1a. Table exists
  SELECT '000001' AS migration, '1a. cms_connections table exists' AS check_name, 1 AS ord,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cms_connections'
    ) THEN 'PASS' ELSE 'FAIL' END AS result

  UNION ALL

  -- 1b. Required columns (9 expected — missing ones simply won't appear, showing < 9 rows)
  SELECT '000001', '1b. column: ' || column_name, 2,
    CASE WHEN column_name IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
  FROM information_schema.columns
  WHERE table_name = 'cms_connections'
    AND column_name IN ('id','org_id','platform','name','credentials','status','created_by','created_at','updated_at')

  UNION ALL

  -- 1c. Platform CHECK constraint
  SELECT '000001', '1c. check_cms_platform constraint', 3,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_cms_platform' AND conrelid = 'cms_connections'::regclass
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL

  -- 1d. Status CHECK constraint
  SELECT '000001', '1d. check_cms_status constraint', 4,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_cms_status' AND conrelid = 'cms_connections'::regclass
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL

  -- 1e. Performance indexes (3 expected)
  SELECT '000001', '1e. index: ' || indexname, 5, 'PASS'
  FROM pg_indexes
  WHERE tablename = 'cms_connections'
    AND indexname IN (
      'idx_cms_connections_org_id',
      'idx_cms_connections_org_platform',
      'idx_cms_connections_status'
    )

  UNION ALL

  -- 1f. RLS enabled
  SELECT '000001', '1f. RLS enabled on cms_connections', 6,
    CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END
  FROM pg_class WHERE relname = 'cms_connections'

  UNION ALL

  -- 1g. RLS policy present
  SELECT '000001', '1g. RLS policy: ' || policyname, 7, 'PASS'
  FROM pg_policies WHERE tablename = 'cms_connections'

  UNION ALL

  -- 1h. updated_at trigger
  SELECT '000001', '1h. trigger: cms_connections_updated_at', 8,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'cms_connections_updated_at'
        AND tgrelid = 'cms_connections'::regclass
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL

  -- ── 000002: publish_references updates ───────────────────

  -- 2a. connection_id column
  SELECT '000002', '2a. publish_references.connection_id column', 10,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'publish_references' AND column_name = 'connection_id'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL

  -- 2b. FK → cms_connections
  SELECT '000002', '2b. connection_id FK → cms_connections', 11,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_class f ON f.oid = c.confrelid
      WHERE t.relname = 'publish_references'
        AND f.relname = 'cms_connections'
        AND c.contype = 'f'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL

  -- 2c. Expanded platform CHECK (contains 'notion')
  SELECT '000002', '2c. check_platform allows all 6 platforms', 12,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'check_platform'
        AND conrelid = 'publish_references'::regclass
        AND pg_get_constraintdef(oid) LIKE '%notion%'
    ) THEN 'PASS' ELSE 'FAIL' END

  UNION ALL

  -- 2d. Old UNIQUE(article_id, platform) dropped
  SELECT '000002', '2d. old UNIQUE(article_id,platform) dropped', 13,
    CASE WHEN NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'publish_references_article_id_platform_key'
        AND conrelid = 'publish_references'::regclass
    ) THEN 'PASS' ELSE 'FAIL — old constraint still present' END

  UNION ALL

  -- 2e. New partial unique indexes (3 expected)
  SELECT '000002', '2e. index: ' || indexname, 14, 'PASS'
  FROM pg_indexes
  WHERE tablename = 'publish_references'
    AND indexname IN (
      'uq_publish_ref_article_connection',
      'uq_publish_ref_article_platform_legacy',
      'idx_publish_references_connection_id'
    )

  UNION ALL

  -- 2f. All 4 RLS policies (4 expected)
  SELECT '000002', '2f. RLS policy: ' || policyname, 15, 'PASS'
  FROM pg_policies
  WHERE tablename = 'publish_references'
    AND policyname IN (
      'Organizations can view their own publish references',
      'Organizations can insert their own publish references',
      'Organizations can update their own publish references',
      'Organizations can delete their own publish references'
    )

  UNION ALL

  -- ── 000003: data migration ────────────────────────────────

  -- 3a. Un-migrated WordPress orgs → should be 0
  SELECT '000003', '3a. un-migrated WordPress orgs', 20,
    CASE WHEN COUNT(*) = 0
      THEN 'PASS (0 remaining)'
      ELSE 'WARN — ' || COUNT(*) || ' org(s) not migrated'
    END
  FROM organizations
  WHERE blog_config->'integrations'->'wordpress' IS NOT NULL
    AND (blog_config->'integrations'->'wordpress'->>'url') IS NOT NULL
    AND (blog_config->'integrations'->'wordpress'->>'application_password') IS NOT NULL
    AND id NOT IN (
      SELECT org_id FROM cms_connections WHERE platform = 'wordpress'
    )

  UNION ALL

  -- 3b. Total migrated WordPress connections
  SELECT '000003', '3b. Total WordPress rows in cms_connections', 21,
    COUNT(*)::text || ' row(s)'
  FROM cms_connections WHERE platform = 'wordpress'

  UNION ALL

  -- 3c. No NULL credentials in migrated rows
  SELECT '000003', '3c. no NULL url/password in migrated rows', 22,
    CASE WHEN COUNT(*) = 0
      THEN 'PASS'
      ELSE 'FAIL — ' || COUNT(*) || ' row(s) have NULL url or password'
    END
  FROM cms_connections
  WHERE platform = 'wordpress'
    AND (
      credentials->>'url' IS NULL
      OR credentials->>'application_password' IS NULL
    )

) checks
ORDER BY migration, ord;

