-- Fix activities table permissions for user registration
-- The issue is that activities can't be created during user registration

-- Drop existing activities policies
DROP POLICY IF EXISTS "Users can view own organization activities" ON activities;
DROP POLICY IF EXISTS "Users can create organization activities" ON activities;

-- Create new activities policies that handle NULL org_id during registration
CREATE POLICY "Allow activity creation with or without organization" ON activities
FOR INSERT
WITH CHECK (
  -- Allow creation if:
  -- 1. User owns the activity, OR
  -- 2. Organization exists and user is member
  (user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )) AND (
    org_id IS NULL OR
    (
      organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  )
);

CREATE POLICY "Allow viewing own activities" ON activities
FOR SELECT
USING (
  -- Allow viewing if:
  -- 1. User owns the activity, OR
  -- 2. User is member of the organization
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ) OR
  (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  )
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
WHERE tablename = 'activities'
ORDER BY policyname;
