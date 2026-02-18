-- Fix RLS policy for service role UPDATE operations
-- Current policy applies to wrong role, causing silent UPDATE failures

-- Drop the broken policy
DROP POLICY IF EXISTS "Service role full access" ON public.intent_workflows;

-- Create correct service role policy for PostgREST service_role
CREATE POLICY "Service role full access"
ON public.intent_workflows
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the policy was created correctly
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as qual_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'intent_workflows'
  AND policyname = 'Service role full access';
