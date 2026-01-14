-- Fix RLS policy for user registration
-- Allow authenticated users to create their own user record

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Authenticated users can create user records" ON public.users;

-- Create a new policy that allows users to create their own record
CREATE POLICY "Users can create their own user record" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- Also allow users to create records with matching email (for signup flow)
CREATE POLICY "Authenticated users can create user records during signup" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Verify the policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
