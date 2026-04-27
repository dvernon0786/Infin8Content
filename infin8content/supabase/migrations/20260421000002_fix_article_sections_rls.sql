-- Fix article_sections RLS policies.
--
-- Root cause: SELECT and UPDATE policies were using
--   (current_setting('request.jwt.claims'::text, true))::jsonb ->> 'org_id'
-- which is never populated (no JWT custom-claims hook exists).
-- As a result, every SELECT from an authenticated browser session returned 0
-- rows silently, causing "No content sections yet" on the article detail page.
--
-- The articles table uses get_auth_user_org_id() (a SECURITY DEFINER function
-- that does: SELECT org_id FROM users WHERE auth_user_id = auth.uid()).
-- All article_sections policies now use the same pattern for consistency.

-- SELECT (was: JWT claims — always returns NULL → 0 rows)
DROP POLICY IF EXISTS "Organizations can view their own article sections" ON article_sections;
CREATE POLICY "Organizations can view their own article sections" ON article_sections
  FOR SELECT USING (
    article_id IN (
      SELECT id FROM articles
      WHERE org_id = public.get_auth_user_org_id()
    )
  );

-- UPDATE (same fix)
DROP POLICY IF EXISTS "Organizations can update their own article sections" ON article_sections;
CREATE POLICY "Organizations can update their own article sections" ON article_sections
  FOR UPDATE USING (
    article_id IN (
      SELECT id FROM articles
      WHERE org_id = public.get_auth_user_org_id()
    )
  );

-- INSERT (was already correct — WITH CHECK only, no USING needed for INSERT)
