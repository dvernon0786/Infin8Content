-- Check OTP codes for test user
SELECT 
  email,
  code,
  created_at,
  expires_at,
  user_id
FROM otp_codes 
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 5;
