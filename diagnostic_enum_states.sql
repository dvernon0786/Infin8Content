-- Diagnostic: Find all ENUM states
-- This will show us what extra state exists

SELECT 
  enumlabel as state_name,
  enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'workflow_state_enum')
ORDER BY enumsortorder;
