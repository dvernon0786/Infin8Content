-- Fix audit trigger that's blocking INSERT operations
-- The trigger was preventing workflow operations from completing

-- Disable the problematic audit trigger that blocks INSERT
-- This allows workflows to complete while maintaining audit integrity
ALTER TABLE intent_audit_logs DISABLE TRIGGER prevent_intent_audit_modification;

-- Create a new trigger that only blocks UPDATE/DELETE (not INSERT)
CREATE OR REPLACE FUNCTION prevent_intent_audit_update_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Intent audit logs are immutable (WORM compliance). No UPDATE or DELETE operations allowed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent updates only
DROP TRIGGER IF EXISTS prevent_intent_audit_modification_safe ON public.intent_audit_logs;
CREATE TRIGGER prevent_intent_audit_modification_safe
BEFORE UPDATE OR DELETE ON public.intent_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_intent_audit_update_delete();

-- Comment on trigger
COMMENT ON TRIGGER prevent_intent_audit_modification_safe ON public.intent_audit_logs IS 'Prevents UPDATE/DELETE of audit logs while allowing INSERT for workflow operations';
