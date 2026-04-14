-- Fix cms_connections RLS policy
--
-- The original policy used request.jwt.claims->>'org_id' which requires a
-- custom Supabase access-token hook. That hook is not configured, so the
-- claim is always NULL:
--   SELECT → returns 0 rows silently (NULL != any UUID → false, no error)
--   INSERT → WITH CHECK fails → 42501 "new row violates row-level security"
--
-- Replacement: use get_auth_user_org_id(), the project-standard helper that
-- looks up the org from the users table via auth.uid(). This is the same
-- function used by organizations, users, stripe_webhook_events, etc.

DROP POLICY IF EXISTS "org_access_cms_connections" ON public.cms_connections;

CREATE POLICY "org_access_cms_connections"
ON public.cms_connections
FOR ALL
USING (
  org_id = public.get_auth_user_org_id()
)
WITH CHECK (
  org_id = public.get_auth_user_org_id()
);
