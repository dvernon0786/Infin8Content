-- Check if all required migrations have been applied
-- This verifies the database schema is ready for the workflow engine

-- 1. Check keywords table for missing metadata columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'keywords' 
  AND column_name IN (
    'detected_language',
    'is_foreign_language', 
    'main_intent',
    'is_navigational',
    'foreign_intent',
    'ai_suggested',
    'user_selected',
    'decision_confidence',
    'selection_source',
    'selection_timestamp'
  )
ORDER BY column_name;

-- 2. Check workflow_transition_audit table for metadata and user_id columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'workflow_transition_audit' 
  AND column_name IN ('metadata', 'user_id')
ORDER BY column_name;

-- 3. Check if competitor unique constraint exists
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'organization_competitors_unique_org_url';

-- 4. Check workflow_id column and unique constraint in keywords table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'keywords' 
  AND column_name = 'workflow_id';

-- 5. Check keywords unique constraint includes workflow_id
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'keywords_workflow_unique';

-- 6. Summary check - count missing items
SELECT 
  'Missing metadata columns in keywords' as check_type,
  COUNT(*) as missing_count
FROM information_schema.columns c
WHERE c.table_name = 'keywords' 
  AND c.column_name IN (
    'detected_language',
    'is_foreign_language', 
    'main_intent',
    'is_navigational',
    'foreign_intent',
    'ai_suggested',
    'user_selected',
    'decision_confidence',
    'selection_source',
    'selection_timestamp'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'keywords' AND column_name = c.column_name
  )

UNION ALL

SELECT 
  'Missing audit columns in workflow_transition_audit' as check_type,
  COUNT(*) as missing_count
FROM information_schema.columns c
WHERE c.table_name = 'workflow_transition_audit' 
  AND c.column_name IN ('metadata', 'user_id')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_transition_audit' AND column_name = c.column_name
  )

UNION ALL

SELECT 
  'Missing competitor unique constraint' as check_type,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_competitors_unique_org_url'
  ) THEN 1 ELSE 0 END as missing_count

UNION ALL

SELECT 
  'Missing workflow_id in keywords' as check_type,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'keywords' AND column_name = 'workflow_id'
  ) THEN 1 ELSE 0 END as missing_count

UNION ALL

SELECT 
  'Missing keywords workflow unique constraint' as check_type,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'keywords_workflow_unique'
  ) THEN 1 ELSE 0 END as missing_count;
