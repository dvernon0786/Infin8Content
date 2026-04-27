-- ============================================================
-- Seed: org_social_accounts
-- ============================================================
-- Run this in Supabase SQL Editor (Studio → SQL Editor).
-- Replace the values in the SET block before running.
--
-- How to find your organization_id:
--   SELECT id, name FROM organizations;
--
-- How to find your Outstand account ID:
--   GET https://api.outstand.so/v1/accounts
--   (requires your OUTSTAND_API_KEY in the Authorization header)
--
-- Supported network values: twitter | linkedin | instagram | facebook
-- ============================================================

DO $$
DECLARE
  v_org_id UUID := '<your-organization-uuid>';   -- ← replace
BEGIN

  -- Example: LinkedIn account
  INSERT INTO org_social_accounts (organization_id, outstand_account_id, network, username, is_active)
  VALUES (
    v_org_id,
    'acc_REPLACE_WITH_OUTSTAND_ACCOUNT_ID',       -- ← replace (from Outstand API)
    'linkedin',
    'your-linkedin-handle',                        -- ← replace (display only)
    TRUE
  )
  ON CONFLICT (organization_id, outstand_account_id) DO UPDATE
    SET is_active = TRUE,
        username  = EXCLUDED.username,
        updated_at = NOW();

  -- Example: Twitter / X account (uncomment and fill in if needed)
  -- INSERT INTO org_social_accounts (organization_id, outstand_account_id, network, username, is_active)
  -- VALUES (
  --   v_org_id,
  --   'acc_REPLACE_WITH_OUTSTAND_ACCOUNT_ID',
  --   'twitter',
  --   'your-twitter-handle',
  --   TRUE
  -- )
  -- ON CONFLICT (organization_id, outstand_account_id) DO UPDATE
  --   SET is_active = TRUE, username = EXCLUDED.username, updated_at = NOW();

  RAISE NOTICE 'org_social_accounts seeded for org %', v_org_id;
END $$;

-- Verify:
-- SELECT * FROM org_social_accounts WHERE organization_id = '<your-organization-uuid>';
