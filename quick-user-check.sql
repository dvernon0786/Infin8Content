-- Quick User Check
-- Run this in Supabase SQL Editor

-- Check if engagehubonline@gmail.com exists in users table
SELECT 
    'USERS TABLE' as location,
    id,
    email,
    org_id,
    role,
    created_at,
    auth_user_id,
    otp_verified,
    CASE 
        WHEN email = 'engagehubonline@gmail.com' THEN 'TARGET USER'
        ELSE 'OTHER USER'
    END as user_type
FROM users 
WHERE email IN ('engagehubonline@gmail.com', 'vijaydp1980@gmail.com', 'deepak.vj017@gmail.com', 'flowtest@example.com', 'test@example.com')
ORDER BY 
    CASE 
        WHEN email = 'engagehubonline@gmail.com' THEN 1
        ELSE 2
    END;
