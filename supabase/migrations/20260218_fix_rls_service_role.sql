-- Fix RLS service role policy for intent_workflows
-- Replace broken Postgres role check with JWT role check

-- Step 1: Drop the broken policy
DROP POLICY IF EXISTS "Service role full access" ON public.intent_workflows;

-- Step 2: Create correct service role policy using JWT claims
CREATE POLICY "Service role full access"
ON public.intent_workflows
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Step 3: Verify the policy was created correctly
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
