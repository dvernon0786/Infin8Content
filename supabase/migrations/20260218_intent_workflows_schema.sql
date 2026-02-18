-- Get complete schema for intent_workflows table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'intent_workflows' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get table constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'intent_workflows' 
  AND tc.table_schema = 'public';

-- Get table indexes
SELECT 
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'intent_workflows' 
  AND schemaname = 'public'
ORDER BY indexname;

-- Get RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'intent_workflows';
