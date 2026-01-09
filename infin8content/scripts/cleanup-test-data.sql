-- ============================================
-- Database Cleanup Script for Testing
-- ============================================
-- Purpose: Delete all user data to allow email reuse
-- Run this in Supabase SQL Editor or via psql
-- ============================================

-- Disable RLS temporarily for admin operations
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_progress DISABLE ROW LEVEL SECURITY;

-- Delete data in order of dependencies (child tables first)

-- 1. Delete article progress tracking
DELETE FROM public.article_progress;

-- 2. Delete articles (if exists)
DELETE FROM public.articles;

-- 3. Delete organizations (if exists)
DELETE FROM public.organizations;

-- Re-enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_progress ENABLE ROW LEVEL SECURITY;

-- Delete auth users (requires admin access)
-- This must be done via Supabase Auth Admin API or Dashboard
-- SQL cannot delete auth.users directly due to security restrictions

-- ============================================
-- Verification Queries
-- ============================================

-- Check remaining data counts
SELECT 'articles' as table_name, COUNT(*) as record_count FROM public.articles
UNION ALL
SELECT 'organizations' as table_name, COUNT(*) as record_count FROM public.organizations
UNION ALL
SELECT 'article_progress' as table_name, COUNT(*) as record_count FROM public.article_progress;

-- ============================================
-- Notes
-- ============================================
-- 1. Auth users must be deleted via Supabase Dashboard:
--    - Go to Authentication > Users
--    - Select all users and delete
-- 
-- 2. Or use the Admin API:
--    - DELETE https://your-project.supabase.co/auth/v1/admin/users/{user_id}
--    - Requires service_role key
--
-- 3. This script handles all application data tables
--    - Articles and their progress tracking
--    - Organizations and user relationships
--
-- 4. After running this script and deleting auth users,
--    you can reuse the same email for testing
-- ============================================

SELECT 'Database cleanup completed!' as status;
