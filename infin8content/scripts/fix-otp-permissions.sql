-- Fix OTP permissions for registration flow
-- The issue is that OTP codes can't be stored due to RLS restrictions

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
WHERE tablename = 'otp_codes'
ORDER BY policyname;
