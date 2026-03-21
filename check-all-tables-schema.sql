-- Check the actual column names for all onboarding-related tables

-- Check activities table columns
SELECT 'activities' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND table_schema = 'public'
AND column_name LIKE '%org%'
ORDER BY ordinal_position;

-- Check organization_competitors table columns  
SELECT 'organization_competitors' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'organization_competitors' 
AND table_schema = 'public'
AND column_name LIKE '%org%'
ORDER BY ordinal_position;

-- Check intent_workflows table columns
SELECT 'intent_workflows' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'intent_workflows' 
AND table_schema = 'public'
AND column_name LIKE '%org%'
ORDER BY ordinal_position;

-- Check audit_logs table columns (we know this is org_id)
SELECT 'audit_logs' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
AND table_schema = 'public'
AND column_name LIKE '%org%'
ORDER BY ordinal_position;
