-- Epic 11, Story 11.1 — API Key Generation and Management
-- Creates the api_keys table with RLS policies matching the cms_connections pattern.

CREATE TABLE IF NOT EXISTS public.api_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  name           TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description    TEXT,
  -- First 8 chars of the raw key — safe to show, never the full key
  key_prefix     TEXT NOT NULL,
  -- SHA-256(raw_key) hex — used for lookup; never bcrypt (too slow per-request)
  hashed_key     TEXT NOT NULL,
  -- Granular permission scopes
  scopes         TEXT[] NOT NULL DEFAULT ARRAY['articles:read'],
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at     TIMESTAMPTZ,
  last_used_at   TIMESTAMPTZ,
  usage_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast key lookup (the hot path on every authenticated API request)
CREATE UNIQUE INDEX api_keys_hashed_key_idx ON public.api_keys (hashed_key);
-- Org-scoped listing
CREATE INDEX api_keys_org_id_idx ON public.api_keys (org_id, status);

-- updated_at auto-maintenance
CREATE OR REPLACE FUNCTION public.set_api_keys_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_api_keys_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see keys belonging to their own org
CREATE POLICY "api_keys_select_own_org" ON public.api_keys
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can create keys for their own org
CREATE POLICY "api_keys_insert_own_org" ON public.api_keys
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Users can revoke (update status) keys in their own org
CREATE POLICY "api_keys_update_own_org" ON public.api_keys
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Service role bypasses RLS (needed for validate-api-key lookup which has no session)
