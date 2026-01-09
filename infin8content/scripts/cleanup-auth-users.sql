-- ============================================
-- Auth Users Cleanup - SQL Alternative
-- ============================================
-- Note: This requires admin access and may not work in all environments
-- Use Supabase Dashboard for reliable auth user deletion
-- ============================================

-- Method 1: Try direct deletion (may fail due to security)
-- DELETE FROM auth.users WHERE email = 'your-email@example.com';

-- Method 2: Get list of users to delete manually
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- Method 3: If you have admin privileges, try this
-- DO $$
-- DECLARE
--     user_record RECORD;
-- BEGIN
--     FOR user_record IN SELECT id FROM auth.users LOOP
--         -- This requires superuser privileges
--         PERFORM auth.jwt_delete_session(user_record.id);
--     END LOOP;
-- END $$;

-- ============================================
-- Recommended Approach
-- ============================================
-- 1. Run cleanup-test-data.sql first (application data)
-- 2. Go to Supabase Dashboard > Authentication > Users
-- 3. Select all users and click "Delete"
-- 4. Confirm deletion
-- 5. Your email is now available for reuse
-- ============================================

SELECT 'Use Supabase Dashboard for auth user deletion' as recommendation;
