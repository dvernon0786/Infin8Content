-- Fix Security Definer View Issue
-- Remove SECURITY DEFINER from enhanced_article_progress view
-- Date: 2026-01-13
-- Issue: View bypasses RLS and can lead to privilege escalation

-- Step 1: Check current view definition
SELECT pg_get_viewdef('public.enhanced_article_progress', true);

-- Step 2: Force drop and recreate view without SECURITY DEFINER
-- Explicitly ensure no SECURITY DEFINER property
DROP VIEW IF EXISTS enhanced_article_progress;

CREATE VIEW enhanced_article_progress AS
SELECT 
    ap.*,
    -- Calculate derived metrics
    (ap.progress_percentage / 100.0 * ap.total_sections) as sections_completed_estimate,
    CASE 
        WHEN ap.status = 'generating' AND ap.parallel_sections IS NOT NULL
        THEN jsonb_array_length(ap.parallel_sections)
        ELSE 0
    END as active_parallel_sections,
    -- Performance rating calculation
    CASE 
        WHEN ap.cache_hit_rate > 80 AND ap.retry_attempts <= 1 THEN 'excellent'
        WHEN ap.cache_hit_rate > 60 AND ap.retry_attempts <= 2 THEN 'good'
        WHEN ap.cache_hit_rate > 40 AND ap.retry_attempts <= 3 THEN 'fair'
        ELSE 'needs_improvement'
    END as performance_rating,
    -- Epic 20 optimization indicators
    CASE 
        WHEN ap.cache_hit_rate > 80 AND ap.research_api_calls <= 2 THEN true
        ELSE false
    END as epic20_optimized
FROM article_progress ap;

-- Step 3: Grant proper permissions
GRANT SELECT ON enhanced_article_progress TO authenticated;
GRANT SELECT ON enhanced_article_progress TO service_role;

-- Step 4: Verify the fix - check that view is not SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    viewowner,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (ISSUE!)'
        ELSE 'SECURITY INVOKER (FIXED)'
    END as security_type
FROM pg_views 
WHERE viewname = 'enhanced_article_progress' 
AND schemaname = 'public';

-- Step 5: Additional verification - check if any SECURITY DEFINER views exist
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE definition LIKE '%SECURITY DEFINER%'
AND schemaname = 'public';
