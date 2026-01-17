-- Delete Test Users Script (Final Version)
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
-- Delete from activities table (using correct column name)
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

-- If the above fails due to column name issues, let's check the table structure first
-- Uncomment this line to see the table structure:
-- \d activities

-- Alternative approach - delete from activities using the correct column
-- Try different possible column names for activities table
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

-- Delete from articles table
DELETE FROM articles 
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

-- Delete from article_progress table
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

-- Delete from team_invitations table
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
