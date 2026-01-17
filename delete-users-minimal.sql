-- Delete Test Users Script (Minimal Version)
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

-- Delete from activities table (we know this has user_id)
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

-- Check if articles table exists and has user_id column
-- Uncomment this after running check-all-tables.sql
/*
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
*/

-- Check if article_progress table exists and has user_id column
-- Uncomment this after running check-all-tables.sql
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

-- Check if team_invitations table exists and has user_id column
-- Uncomment this after running check-all-tables.sql
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
