-- Check if engagehubonline@gmail.com exists in the system
-- Run this in Supabase SQL Editor

-- Check users table
SELECT 
    id,
    email,
    org_id,
    role,
    created_at,
    auth_user_id,
    otp_verified
FROM users 
WHERE email = 'engagehubonline@gmail.com';

-- Check if there are any auth users with this email
-- Note: This requires admin access to auth.users table
-- You may need to check this in Supabase Dashboard -> Authentication -> Users

-- Check for any recent activity for this email
SELECT 
    'activities' as table_name,
    COUNT(*) as record_count
FROM activities 
WHERE user_id IN (SELECT id FROM users WHERE email = 'engagehubonline@gmail.com')
UNION ALL
SELECT 
    'articles' as table_name,
    COUNT(*) as record_count
FROM articles 
WHERE created_by IN (SELECT id FROM users WHERE email = 'engagehubonline@gmail.com')
UNION ALL
SELECT 
    'team_invitations' as table_name,
    COUNT(*) as record_count
FROM team_invitations 
WHERE created_by IN (SELECT id FROM users WHERE email = 'engagehubonline@gmail.com');
