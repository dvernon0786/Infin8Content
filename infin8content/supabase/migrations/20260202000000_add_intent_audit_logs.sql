-- Create intent_audit_logs table for Intent Engine compliance tracking
-- Story 37.4: Maintain Complete Audit Trail of All Decisions

-- ============================================================================
-- Create intent_audit_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intent_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.intent_workflows(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('workflow', 'keyword', 'article')),
    entity_id UUID NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.intent_audit_logs IS 'Intent Engine audit log table for tracking workflow actions and decisions (WORM - Write Once Read Many)';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_organization_id ON public.intent_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_workflow_id ON public.intent_audit_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_actor_id ON public.intent_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_action ON public.intent_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_entity ON public.intent_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_created_at ON public.intent_audit_logs(created_at DESC);

-- ============================================================================
-- Enable RLS on intent_audit_logs table
-- ============================================================================

ALTER TABLE public.intent_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for intent_audit_logs table
-- ============================================================================

-- Policy: Only organization owners can view intent audit logs for their organization
DROP POLICY IF EXISTS "Owners can view organization intent audit logs" ON public.intent_audit_logs;
CREATE POLICY "Owners can view organization intent audit logs"
ON public.intent_audit_logs
FOR SELECT
USING (
  organization_id = public.get_auth_user_org_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- Policy: Authenticated users can insert intent audit logs
-- This allows the application to log actions for any authenticated user
DROP POLICY IF EXISTS "Authenticated users can insert intent audit logs" ON public.intent_audit_logs;
CREATE POLICY "Authenticated users can insert intent audit logs"
ON public.intent_audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- WORM Compliance: Immutability Triggers
-- ============================================================================

-- Create function to prevent updates and deletes
CREATE OR REPLACE FUNCTION public.prevent_intent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Intent audit logs are immutable (WORM compliance). No UPDATE or DELETE operations allowed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent updates
DROP TRIGGER IF EXISTS prevent_intent_audit_logs_update ON public.intent_audit_logs;
CREATE TRIGGER prevent_intent_audit_logs_update
BEFORE UPDATE ON public.intent_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_intent_audit_modification();

-- Create trigger to prevent deletes
DROP TRIGGER IF EXISTS prevent_intent_audit_logs_delete ON public.intent_audit_logs;
CREATE TRIGGER prevent_intent_audit_logs_delete
BEFORE DELETE ON public.intent_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_intent_audit_modification();

-- ============================================================================
-- RLS Policies: NO UPDATE or DELETE policies
-- ============================================================================
-- Intent audit logs are immutable once created (Write Once Read Many)
-- Only service role or database admin can modify/delete via direct SQL
-- No RLS policies are defined for UPDATE or DELETE operations
