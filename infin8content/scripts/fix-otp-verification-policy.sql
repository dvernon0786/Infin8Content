-- Fix OTP verification policy to allow verification during registration
-- The issue is that during registration, the user_id might not be set yet

DROP POLICY IF EXISTS "Allow OTP verification" ON otp_codes;

CREATE POLICY "Allow OTP verification" ON otp_codes
FOR SELECT
USING (
  -- Allow viewing if:
  -- 1. User owns the OTP code (after registration), OR
  -- 2. The authenticated user's email matches the OTP email (during registration)
  (EXISTS (
    SELECT 1 FROM users 
    WHERE ((users.id = otp_codes.user_id) AND (users.auth_user_id = auth.uid()))
  )) OR (
    auth.email() = otp_codes.email
  )
);

-- Show the updated policy
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'otp_codes' AND policyname = 'Allow OTP verification';
