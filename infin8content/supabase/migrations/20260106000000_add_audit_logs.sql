-- Add audit_logs table for compliance tracking
-- Story 1.13: Audit Logging for Compliance

-- ============================================================================
-- Create audit_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT
);

-- Add table comment
COMMENT ON TABLE public.audit_logs IS 'Audit log table for tracking sensitive operations (WORM - Write Once Read Many)';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- Enable RLS on audit_logs table
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for audit_logs table
-- ============================================================================

-- Policy: Only organization owners can view audit logs for their organization
DROP POLICY IF EXISTS "Owners can view organization audit logs" ON public.audit_logs;
CREATE POLICY "Owners can view organization audit logs"
ON public.audit_logs
FOR SELECT
USING (
  org_id = public.get_auth_user_org_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- Policy: Authenticated users can insert audit logs
-- This allows the application to log actions for any authenticated user
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- WORM Compliance: NO UPDATE or DELETE policies
-- ============================================================================
-- Audit logs are immutable once created (Write Once Read Many)
-- Only service role or database admin can modify/delete via direct SQL
-- No RLS policies are defined for UPDATE or DELETE operations
