-- Check Table Structure Script
-- Run this first to understand the actual table structure

-- Check users table structure
\d users

-- Check activities table structure  
\d activities

-- Check articles table structure
\d articles

-- Check article_progress table structure
\d article_progress

-- Check team_invitations table structure
\d team_invitations

-- Check organizations table structure
\d organizations

-- Also check what columns actually exist in activities table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- Sample data from activities to understand structure
SELECT * FROM activities LIMIT 5;

-- Sample data from users to confirm the user IDs
SELECT id, email FROM users 
WHERE email IN (
    'vijaydp1980@gmail.com',
    'deepak.vj017@gmail.com', 
    'flowtest@example.com',
    'engagehubonline@gmail.com',
    'test@example.com'
);
