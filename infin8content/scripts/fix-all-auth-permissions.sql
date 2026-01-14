-- Comprehensive fix for all authentication-related RLS issues
-- This script fixes users, otp_codes, and activities table permissions

-- =====================================================
-- 1. FIX USERS TABLE PERMISSIONS
-- =====================================================

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

-- =====================================================
-- 2. FIX OTP_CODES TABLE PERMISSIONS
-- =====================================================

-- Drop existing OTP policies
DROP POLICY IF EXISTS "Users can insert their own OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON otp_codes;

-- Create new OTP policies that work for registration
CREATE POLICY "Allow OTP insertion during registration" ON otp_codes
FOR INSERT
WITH CHECK (
  -- Allow insertion if:
  -- 1. User exists in users table with matching email, OR
  -- 2. The authenticated user's email matches the OTP email (for registration)
  (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = otp_codes.email
      AND users.auth_user_id = auth.uid()
    )
  ) OR (
    auth.email() = otp_codes.email
  )
);

CREATE POLICY "Allow OTP verification" ON otp_codes
FOR SELECT
USING (
  -- Allow viewing if:
  -- 1. User owns the OTP code, OR
  -- 2. The authenticated user's email matches
  (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = otp_codes.user_id
      AND users.auth_user_id = auth.uid()
    )
  ) OR (
    auth.email() = otp_codes.email
  )
);

CREATE POLICY "Allow OTP deletion" ON otp_codes
FOR DELETE
USING (
  -- Allow deletion if user owns the OTP code
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = otp_codes.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- =====================================================
-- 3. FIX ACTIVITIES TABLE PERMISSIONS
-- =====================================================

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

-- =====================================================
-- 4. VERIFICATION - SHOW ALL POLICIES
-- =====================================================

-- Show users table policies
SELECT 
  'users' as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
UNION ALL
-- Show otp_codes table policies
SELECT 
  'otp_codes' as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'otp_codes'
UNION ALL
-- Show activities table policies
SELECT 
  'activities' as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'activities'
ORDER BY table_name, policyname;

-- =====================================================
-- 5. CLEANUP - REMOVE ANY BROKEN USERS
-- =====================================================

-- Show users that exist in auth.users but not in public.users
SELECT 
  'orphaned_auth_users' as issue_type,
  COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu 
  WHERE pu.auth_user_id = au.id
);

-- Optionally clean up orphaned auth users (uncomment if needed)
-- DELETE FROM auth.users 
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.users pu 
--   WHERE pu.auth_user_id = auth.users.id
-- );

-- =====================================================
-- 6. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== AUTH PERMISSIONS FIXED ===';
  RAISE NOTICE 'Users table: Registration and user management policies updated';
  RAISE NOTICE 'OTP codes table: Registration and verification policies updated';
  RAISE NOTICE 'Activities table: Registration and activity logging policies updated';
  RAISE NOTICE 'Please test registration flow to verify all fixes work correctly';
  RAISE NOTICE '==============================';
END $$;
