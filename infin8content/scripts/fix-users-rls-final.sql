-- Fix the users table RLS policy for registration
-- The current policy has a logic error in the WHERE clause

-- Drop both existing INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create user records during signup" ON public.users;
DROP POLICY IF EXISTS "Users can create their own user record" ON public.users;

-- Create a single, working policy for user registration
CREATE POLICY "Users can create their own user record" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Verify the policy
SELECT 
    policyname,
    cmd,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'INSERT';
