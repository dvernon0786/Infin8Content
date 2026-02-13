-- Production Integrity Verification Queries
-- Run these to validate database state before production deployment

-- 1️⃣ Verify keywords table unique constraint matches code
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'keywords'::regclass
AND contype = 'u';

-- 2️⃣ Check for NULL workflow_id pollution
SELECT 
  COUNT(*) as null_workflow_count,
  COUNT(CASE WHEN workflow_id IS NULL THEN 1 END) as null_count,
  COUNT(CASE WHEN workflow_id IS NOT NULL THEN 1 END) as not_null_count
FROM keywords;

-- 3️⃣ Verify audit table exists
SELECT to_regclass('public.workflow_transition_audit') as audit_table_exists;

-- 4️⃣ Check audit table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'workflow_transition_audit'
ORDER BY ordinal_position;

-- 5️⃣ Verify keywords table has workflow_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'keywords' AND column_name = 'workflow_id';

-- 6️⃣ Sample keywords with workflow_id to verify isolation
SELECT 
  workflow_id,
  organization_id,
  seed_keyword,
  search_volume,
  competition_level
FROM keywords 
WHERE workflow_id IS NOT NULL
LIMIT 5;

-- 7️⃣ Check for any remaining old constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'keywords'::regclass
AND contype = 'u'
AND conname LIKE '%competitor%';
