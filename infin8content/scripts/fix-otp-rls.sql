-- Fix OTP codes RLS policy to allow registration flow
-- The current policy requires users to exist before creating OTP codes, but we need OTP during registration

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert their own OTP codes" ON public.otp_codes;

-- Create a more flexible policy that allows OTP creation during registration
CREATE POLICY "Users can insert their own OTP codes" ON public.otp_codes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user_id matches an existing user record
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  OR
  -- Allow during registration if email matches the authenticated user's email
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Verify the policy
SELECT 
    policyname,
    cmd,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'otp_codes' 
AND cmd = 'INSERT';
