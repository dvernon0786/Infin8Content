-- Fix users table permissions for registration flow
-- The issue is that user records can't be created due to RLS restrictions

-- Drop existing user policies
DROP POLICY IF EXISTS "Authenticated users can create user records" ON users;
DROP POLICY IF EXISTS "Users can view own records" ON users;
DROP POLICY IF EXISTS "Users can update own records" ON users;

-- Create new user policies that work for registration
CREATE POLICY "Allow user creation during registration" ON users
FOR INSERT
WITH CHECK (
  -- Allow creation if:
  -- 1. The authenticated user is creating their own record, OR
  -- 2. The email matches the authenticated user's email
  auth.uid() = auth_user_id OR
  auth.email() = email
);

CREATE POLICY "Allow users to view own records" ON users
FOR SELECT
USING (
  -- Allow viewing if user owns the record
  auth.uid() = auth_user_id
);

CREATE POLICY "Allow users to update own records" ON users
FOR UPDATE
USING (
  -- Allow updating if user owns the record
  auth.uid() = auth_user_id
)
WITH CHECK (
  -- Ensure updates maintain ownership
  auth.uid() = auth_user_id
);

-- Show the new policies
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
