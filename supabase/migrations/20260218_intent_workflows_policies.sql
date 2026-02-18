-- Get RLS policies for intent_workflows table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'intent_workflows'
ORDER BY policyname;

-- Get detailed policy information
SELECT 
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  CASE 
    WHEN p.qual IS NOT NULL THEN p.qual::text
    ELSE NULL
  END as qual_expression,
  CASE 
    WHEN p.with_check IS NOT NULL THEN p.with_check::text
    ELSE NULL
  END as with_check_expression
FROM pg_policies p
WHERE p.tablename = 'intent_workflows'
ORDER BY p.policyname;
