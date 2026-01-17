-- Delete Test Users Script (Final Working Version)
-- This script will delete the specified test users and their associated data
-- Run this in Supabase SQL Editor or via psql

-- First, let's see what we're deleting (for verification)
SELECT 
    id,
    email,
    org_id,
    role,
    created_at,
    auth_user_id,
    otp_verified
FROM users 
WHERE email IN (
    'vijaydp1980@gmail.com',
    'deepak.vj017@gmail.com', 
    'flowtest@example.com',
    'engagehubonline@gmail.com',
    'test@example.com'
);

-- Delete associated data first (foreign key constraints)
-- Delete from activities table (uses user_id)
DELETE FROM activities 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'vijaydp1980@gmail.com',
        'deepak.vj017@gmail.com', 
        'flowtest@example.com',
        'engagehubonline@gmail.com',
        'test@example.com'
    )
);

-- Delete from articles table (uses created_by, not user_id)
DELETE FROM articles 
WHERE created_by IN (
    SELECT id FROM users 
    WHERE email IN (
        'vijaydp1980@gmail.com',
        'deepak.vj017@gmail.com', 
        'flowtest@example.com',
        'engagehubonline@gmail.com',
        'test@example.com'
    )
);

-- Check article_progress table structure first
-- Run this to see if it exists and what columns it has
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'article_progress' ORDER BY ordinal_position;

-- Delete from article_progress table (if it exists and has user_id)
-- Uncomment after checking structure
/*
DELETE FROM article_progress 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'vijaydp1980@gmail.com',
        'deepak.vj017@gmail.com', 
        'flowtest@example.com',
        'engagehubonline@gmail.com',
        'test@example.com'
    )
);
*/

-- Check team_invitations table structure first
-- Run this to see if it exists and what columns it has
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'team_invitations' ORDER BY ordinal_position;

-- Delete from team_invitations table (if it exists and has user_id)
-- Uncomment after checking structure
/*
DELETE FROM team_invitations 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'vijaydp1980@gmail.com',
        'deepak.vj017@gmail.com', 
        'flowtest@example.com',
        'engagehubonline@gmail.com',
        'test@example.com'
    )
);
*/

-- Delete from organizations table (if they are owners and org has no other users)
-- Note: This is complex - we need to check if organizations have other users first
WITH orgs_to_check AS (
    SELECT DISTINCT org_id 
    FROM users 
    WHERE email IN (
        'vijaydp1980@gmail.com',
        'deepak.vj017@gmail.com', 
        'flowtest@example.com',
        'engagehubonline@gmail.com',
        'test@example.com'
    )
    AND org_id IS NOT NULL
),
org_user_counts AS (
    SELECT 
        o.id as org_id,
        COUNT(u.id) as user_count
    FROM organizations o
    LEFT JOIN users u ON o.id = u.org_id
    WHERE o.id IN (SELECT org_id FROM orgs_to_check)
    GROUP BY o.id
)
DELETE FROM organizations 
WHERE id IN (
    SELECT org_id FROM org_user_counts 
    WHERE user_count = 1  -- Only delete if no other users
);

-- Now delete the users themselves
DELETE FROM users 
WHERE email IN (
    'vijaydp1980@gmail.com',
    'deepak.vj017@gmail.com', 
    'flowtest@example.com',
    'engagehubonline@gmail.com',
    'test@example.com'
);

-- Verify deletion
SELECT 
    id,
    email,
    org_id,
    role,
    created_at,
    auth_user_id,
    otp_verified
FROM users 
WHERE email IN (
    'vijaydp1980@gmail.com',
    'deepak.vj017@gmail.com', 
    'flowtest@example.com',
    'engagehubonline@gmail.com',
    'test@example.com'
);

-- Also need to delete from auth.users table (Supabase auth)
-- This requires separate auth system access
-- Run these commands in Supabase Dashboard -> Authentication -> Users or via auth admin API
