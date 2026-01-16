-- Create UX metrics event log and weekly rollups tables
-- Story 32.1: User Experience Metrics Tracking

-- ============================================================================
-- Task 1: Create ux_metrics_events table (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ux_metrics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  flow_instance_id UUID,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ux_metrics_events_org_id_created_at
  ON public.ux_metrics_events(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ux_metrics_events_event_name_created_at
  ON public.ux_metrics_events(event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ux_metrics_events_flow_instance_id
  ON public.ux_metrics_events(flow_instance_id);

CREATE INDEX IF NOT EXISTS idx_ux_metrics_events_article_id
  ON public.ux_metrics_events(article_id);

-- Idempotency constraint: prevent duplicate events for same flow instance
CREATE UNIQUE INDEX IF NOT EXISTS idx_ux_metrics_events_flow_instance_unique
  ON public.ux_metrics_events(flow_instance_id, event_name)
  WHERE flow_instance_id IS NOT NULL;

ALTER TABLE public.ux_metrics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Org members can view UX metrics events" ON public.ux_metrics_events;
CREATE POLICY "Org members can view UX metrics events"
ON public.ux_metrics_events
FOR SELECT
USING (org_id = public.get_auth_user_org_id());

DROP POLICY IF EXISTS "Org members can insert UX metrics events" ON public.ux_metrics_events;
CREATE POLICY "Org members can insert UX metrics events"
ON public.ux_metrics_events
FOR INSERT
WITH CHECK (org_id = public.get_auth_user_org_id());

-- WORM Compliance: NO UPDATE or DELETE policies

-- ============================================================================
-- Task 2: Create ux_metrics_weekly_rollups table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ux_metrics_weekly_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_metrics_weekly_rollups_org_week_unique
  ON public.ux_metrics_weekly_rollups(org_id, week_start);

CREATE INDEX IF NOT EXISTS idx_ux_metrics_weekly_rollups_org_created_at
  ON public.ux_metrics_weekly_rollups(org_id, created_at DESC);

ALTER TABLE public.ux_metrics_weekly_rollups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Owners can view UX metrics weekly rollups" ON public.ux_metrics_weekly_rollups;
CREATE POLICY "Owners can view UX metrics weekly rollups"
ON public.ux_metrics_weekly_rollups
FOR SELECT
USING (
  org_id = public.get_auth_user_org_id()
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- NOTE: Inserts are expected to be performed by server-side background jobs using service role.
-- If you need authenticated inserts (without service role), add an INSERT policy.

-- WORM Compliance: NO UPDATE or DELETE policies
