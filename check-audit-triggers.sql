-- Check audit triggers to verify they're not blocking INSERT operations
SELECT tgname, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'intent_audit_logs'::regclass;
