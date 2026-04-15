-- Epic 11, Stories 11.4 + 11.5 — Webhook Infrastructure
-- Three tables: outbound endpoints, delivery log, inbound received events.

-- ── Outbound webhook endpoints (Story 11.5) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  url              TEXT NOT NULL CHECK (url LIKE 'https://%'),
  -- Array of event types that trigger this webhook
  events           TEXT[] NOT NULL DEFAULT '{}',
  -- AES-256-GCM encrypted webhook secret (same encryption.ts used by cms_connections)
  secret_encrypted TEXT NOT NULL,
  -- Optional extra headers to send with each delivery
  custom_headers   JSONB NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  success_count    INTEGER NOT NULL DEFAULT 0,
  failure_count    INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX webhook_endpoints_org_id_idx ON public.webhook_endpoints (org_id, status);

-- ── Outbound delivery log (Story 11.5) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  response_status INTEGER,
  response_body   TEXT,
  attempt_count   INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'delivered', 'failed')),
  delivered_at    TIMESTAMPTZ,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX webhook_deliveries_endpoint_idx ON public.webhook_deliveries (endpoint_id, status);
CREATE INDEX webhook_deliveries_org_idx ON public.webhook_deliveries (org_id, created_at DESC);
-- For Inngest retry job: find pending deliveries due for retry
CREATE INDEX webhook_deliveries_retry_idx ON public.webhook_deliveries (next_retry_at)
  WHERE status = 'pending' AND next_retry_at IS NOT NULL;

-- ── Inbound received events (Story 11.4) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  -- The UUID from the receiving URL path  (/api/webhooks/receive/[endpoint_id])
  endpoint_id     UUID REFERENCES public.webhook_endpoints(id) ON DELETE SET NULL,
  source          TEXT,
  payload         JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'received'
                    CHECK (status IN ('received', 'processed', 'failed', 'skipped')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX webhook_events_org_idx ON public.webhook_events (org_id, created_at DESC);

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_webhook_endpoints_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_webhook_endpoints_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_select" ON public.webhook_endpoints
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "webhook_endpoints_insert" ON public.webhook_endpoints
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "webhook_endpoints_update" ON public.webhook_endpoints
  FOR UPDATE USING (org_id IN (SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "webhook_endpoints_delete" ON public.webhook_endpoints
  FOR DELETE USING (org_id IN (SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "webhook_events_select" ON public.webhook_events
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.users WHERE auth_user_id = auth.uid()));
