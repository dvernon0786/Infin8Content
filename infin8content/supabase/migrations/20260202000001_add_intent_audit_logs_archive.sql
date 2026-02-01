-- Add intent audit logs archival strategy for records > 1 year
-- Story 37.4: Maintain Complete Audit Trail of All Decisions

-- ============================================================================
-- Create intent_audit_logs_archive table for long-term storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intent_audit_logs_archive (
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
    created_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.intent_audit_logs_archive IS 'Archived Intent Engine audit logs for long-term storage (> 1 year old)';

-- Create indexes for efficient querying of archived logs
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_organization_id ON public.intent_audit_logs_archive(organization_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_workflow_id ON public.intent_audit_logs_archive(workflow_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_actor_id ON public.intent_audit_logs_archive(actor_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_action ON public.intent_audit_logs_archive(action);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_entity ON public.intent_audit_logs_archive(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_created_at ON public.intent_audit_logs_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intent_audit_logs_archive_archived_at ON public.intent_audit_logs_archive(archived_at DESC);

-- ============================================================================
-- Enable RLS on intent_audit_logs_archive table
-- ============================================================================

ALTER TABLE public.intent_audit_logs_archive ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for intent_audit_logs_archive table
-- ============================================================================

-- Policy: Only organization owners can view archived audit logs for their organization
DROP POLICY IF EXISTS "Owners can view organization archived intent audit logs" ON public.intent_audit_logs_archive;
CREATE POLICY "Owners can view organization archived intent audit logs"
ON public.intent_audit_logs_archive
FOR SELECT
USING (
  organization_id = public.get_auth_user_org_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'owner'
  )
);

-- Policy: Authenticated users can insert archived audit logs (for system processes)
DROP POLICY IF EXISTS "Authenticated users can insert archived intent audit logs" ON public.intent_audit_logs_archive;
CREATE POLICY "Authenticated users can insert archived intent audit logs"
ON public.intent_audit_logs_archive
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- WORM Compliance: Immutability Triggers for Archive Table
-- ============================================================================

-- Create trigger to prevent updates on archive table
DROP TRIGGER IF EXISTS prevent_intent_audit_logs_archive_update ON public.intent_audit_logs_archive;
CREATE TRIGGER prevent_intent_audit_logs_archive_update
BEFORE UPDATE ON public.intent_audit_logs_archive
FOR EACH ROW
EXECUTE FUNCTION public.prevent_intent_audit_modification();

-- Create trigger to prevent deletes on archive table
DROP TRIGGER IF EXISTS prevent_intent_audit_logs_archive_delete ON public.intent_audit_logs_archive;
CREATE TRIGGER prevent_intent_audit_logs_archive_delete
BEFORE DELETE ON public.intent_audit_logs_archive
FOR EACH ROW
EXECUTE FUNCTION public.prevent_intent_audit_modification();

-- ============================================================================
-- Archive Function
-- ============================================================================

-- Function to archive audit logs older than 1 year
CREATE OR REPLACE FUNCTION public.archive_old_intent_audit_logs()
RETURNS TABLE(
    archived_count BIGINT,
    archive_date TIMESTAMPTZ
) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    archived_records BIGINT;
BEGIN
    -- Set cutoff date to 1 year ago
    cutoff_date := NOW() - INTERVAL '1 year';
    
    -- Archive old records
    INSERT INTO public.intent_audit_logs_archive (
        organization_id,
        workflow_id,
        entity_type,
        entity_id,
        actor_id,
        action,
        details,
        ip_address,
        user_agent,
        created_at
    )
    SELECT
        organization_id,
        workflow_id,
        entity_type,
        entity_id,
        actor_id,
        action,
        details,
        ip_address,
        user_agent,
        created_at
    FROM public.intent_audit_logs
    WHERE created_at < cutoff_date;
    
    -- Get count of archived records
    GET DIAGNOSTICS archived_records = ROW_COUNT;
    
    -- Delete archived records from main table
    DELETE FROM public.intent_audit_logs
    WHERE created_at < cutoff_date;
    
    -- Return results
    archived_count := archived_records;
    archive_date := NOW();
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions to service role for archiving
-- ============================================================================

-- Grant necessary permissions to service role for archiving
GRANT SELECT ON public.intent_audit_logs TO service_role;
GRANT INSERT ON public.intent_audit_logs_archive TO service_role;
GRANT DELETE ON public.intent_audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.archive_old_intent_audit_logs() TO service_role;
