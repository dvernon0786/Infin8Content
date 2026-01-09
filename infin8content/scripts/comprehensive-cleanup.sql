-- ============================================
-- COMPREHENSIVE Database Cleanup Script for Testing
-- ============================================
-- Purpose: Delete ALL user data including Stripe events to allow email reuse
-- Run this in Supabase SQL Editor
-- ============================================

-- Disable RLS temporarily for admin operations
DO $$
BEGIN
    -- Disable RLS on all user tables
    ALTER TABLE IF EXISTS public.articles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.article_progress DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.article_sections DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.team_members DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.user_subscriptions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.stripe_webhook_events DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.usage_logs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.usage_credits DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.billing_invoices DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.payment_sessions DISABLE ROW LEVEL SECURITY;
END $$;

-- Delete data in order of dependencies (child tables first)
DO $$
BEGIN
    -- Delete Stripe webhook events first (no dependencies)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_webhook_events' AND table_schema = 'public') THEN
        DELETE FROM public.stripe_webhook_events;
        RAISE NOTICE '✅ Deleted stripe_webhook_events';
    END IF;

    -- Delete article progress (depends on articles)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_progress' AND table_schema = 'public') THEN
        DELETE FROM public.article_progress;
        RAISE NOTICE '✅ Deleted article_progress';
    END IF;

    -- Delete article sections (depends on articles)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_sections' AND table_schema = 'public') THEN
        DELETE FROM public.article_sections;
        RAISE NOTICE '✅ Deleted article_sections';
    END IF;

    -- Delete articles (depends on organizations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles' AND table_schema = 'public') THEN
        DELETE FROM public.articles;
        RAISE NOTICE '✅ Deleted articles';
    END IF;

    -- Delete team members (depends on organizations and users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members' AND table_schema = 'public') THEN
        DELETE FROM public.team_members;
        RAISE NOTICE '✅ Deleted team_members';
    END IF;

    -- Delete user subscriptions (depends on organizations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions' AND table_schema = 'public') THEN
        DELETE FROM public.user_subscriptions;
        RAISE NOTICE '✅ Deleted user_subscriptions';
    END IF;

    -- Delete usage logs (depends on organizations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_logs' AND table_schema = 'public') THEN
        DELETE FROM public.usage_logs;
        RAISE NOTICE '✅ Deleted usage_logs';
    END IF;

    -- Delete usage credits (depends on organizations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_credits' AND table_schema = 'public') THEN
        DELETE FROM public.usage_credits;
        RAISE NOTICE '✅ Deleted usage_credits';
    END IF;

    -- Delete billing invoices (depends on organizations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_invoices' AND table_schema = 'public') THEN
        DELETE FROM public.billing_invoices;
        RAISE NOTICE '✅ Deleted billing_invoices';
    END IF;

    -- Delete payment sessions (depends on organizations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_sessions' AND table_schema = 'public') THEN
        DELETE FROM public.payment_sessions;
        RAISE NOTICE '✅ Deleted payment_sessions';
    END IF;

    -- Delete user profiles (depends on auth.users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        DELETE FROM public.user_profiles;
        RAISE NOTICE '✅ Deleted user_profiles';
    END IF;

    -- Delete organizations (main entity)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
        DELETE FROM public.organizations;
        RAISE NOTICE '✅ Deleted organizations';
    END IF;

END $$;

-- Re-enable RLS on all tables
DO $$
BEGIN
    ALTER TABLE IF EXISTS public.articles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.article_progress ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.article_sections ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.usage_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.usage_credits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.billing_invoices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.payment_sessions ENABLE ROW LEVEL SECURITY;
END $$;

-- ============================================
-- COMPREHENSIVE VERIFICATION
-- ============================================

DO $$
DECLARE
    table_name text;
    record_count bigint;
    result text;
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DATABASE CLEANUP VERIFICATION RESULTS';
    RAISE NOTICE '===========================================';
    
    -- Check all relevant tables
    FOR table_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'articles', 'organizations', 'article_progress', 'article_sections',
            'team_members', 'user_profiles', 'user_subscriptions', 'stripe_webhook_events',
            'usage_logs', 'usage_credits', 'billing_invoices', 'payment_sessions'
        )
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO record_count;
        RAISE NOTICE '📊 %s: %s records', table_name, record_count;
    END LOOP;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'APPLICATION DATA CLEANUP COMPLETED';
    RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- AUTH USERS CLEANUP INSTRUCTIONS
-- ============================================
-- IMPORTANT: Auth users must be deleted separately
-- SQL cannot delete auth.users directly due to security
-- 
-- OPTIONS:
-- 1. SUPABASE DASHBOARD (Recommended):
--    - Go to Authentication → Users
--    - Select all users (Ctrl+A)
--    - Click "Delete"
--    - Confirm deletion
--
-- 2. ADMIN API:
--    - Requires service_role key
--    - DELETE https://your-project.supabase.co/auth/v1/admin/users/{user_id}
--
-- 3. RUN THIS TO GET USER LIST:
-- ============================================

DO $$
DECLARE
    user_record RECORD;
    user_count bigint;
BEGIN
    -- Get user count
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count > 0 THEN
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'AUTH USERS STILL EXIST - MANUAL DELETION REQUIRED';
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'Found % users in auth.users table', user_count;
        RAISE NOTICE '';
        RAISE NOTICE 'USER LIST:';
        FOR user_record IN SELECT id, email, created_at FROM auth.users ORDER BY created_at LOOP
            RAISE NOTICE '👤 % (ID: %s, Created: %s)', user_record.email, user_record.id, user_record.created_at;
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE 'TO DELETE USERS: Use Supabase Dashboard → Authentication → Users';
        RAISE NOTICE '===========================================';
    ELSE
        RAISE NOTICE '✅ No auth users found - cleanup complete!';
    END IF;
END $$;

SELECT '🎉 COMPREHENSIVE DATABASE CLEANUP COMPLETED!' as status;
SELECT '📧 Email ready for reuse after deleting auth users via Dashboard' as next_step;
