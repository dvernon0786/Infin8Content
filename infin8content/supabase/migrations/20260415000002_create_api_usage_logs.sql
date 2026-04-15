-- Epic 11, Story 11.3 — Rate Limiting Per API Key
-- Tracks call counts per key per billing period (calendar month).

CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id   UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Truncated to the first day of the billing month  (DATE_TRUNC('month', NOW()))
  period_start TIMESTAMPTZ NOT NULL,
  call_count   INTEGER NOT NULL DEFAULT 0,
  -- Last endpoint called (informational, used by Story 11.7 analytics)
  last_endpoint TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique per key+period so we can do atomic upsert increments
CREATE UNIQUE INDEX api_usage_logs_key_period_idx
  ON public.api_usage_logs (api_key_id, period_start);

-- Org-scoped query for usage analytics dashboard
CREATE INDEX api_usage_logs_org_period_idx
  ON public.api_usage_logs (org_id, period_start);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_logs_select_own_org" ON public.api_usage_logs
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Writes are done by service role (validateApiKey runs without user session)
