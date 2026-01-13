-- Database Security Fixes for Story 22.1
-- Fixes Supabase database linter security issues
-- Date: 2026-01-13

-- Fix 1: Change enhanced_article_progress view to SECURITY INVOKER
DROP VIEW IF EXISTS enhanced_article_progress;
CREATE OR REPLACE VIEW enhanced_article_progress AS
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

-- Fix 2: Drop trigger first, then update function with search_path
DROP TRIGGER IF EXISTS update_performance_metrics_trigger ON article_progress;
DROP FUNCTION IF EXISTS update_performance_metrics();

CREATE OR REPLACE FUNCTION update_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update performance_metrics JSONB field with calculated values
    NEW.performance_metrics = jsonb_build_object(
        'researchApiCalls', COALESCE(NEW.research_api_calls, 0),
        'cacheHitRate', COALESCE(NEW.cache_hit_rate, 0.0),
        'retryAttempts', COALESCE(NEW.retry_attempts, 0),
        'totalApiCalls', COALESCE(NEW.research_api_calls, 0) + COALESCE(NEW.retry_attempts, 0),
        'estimatedTimeRemaining', COALESCE(NEW.estimated_time_remaining, 0),
        'updated_at', NOW()
    );
    
    -- Update research_phase JSONB field
    NEW.research_phase = jsonb_build_object(
        'status', CASE 
            WHEN NEW.status = 'researching' THEN 'researching'
            WHEN NEW.status = 'generating' THEN 'completed'
            ELSE 'pending'
        END,
        'apiCallsMade', COALESCE(NEW.research_api_calls, 0),
        'cacheHitRate', COALESCE(NEW.cache_hit_rate, 0.0),
        'updated_at', NOW()
    );
    
    -- Update context_management JSONB field
    NEW.context_management = jsonb_build_object(
        'tokensUsed', COALESCE((NEW.metadata->>'tokensUsed')::integer, 0),
        'tokenLimit', 2000, -- Epic 20 optimization limit
        'cacheHits', COALESCE((NEW.metadata->>'cacheHits')::integer, 0),
        'sectionsSummarized', COALESCE((NEW.metadata->>'sectionsSummarized')::integer, 0),
        'optimizationRate', COALESCE(NEW.cache_hit_rate, 0.0),
        'updated_at', NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger
CREATE TRIGGER update_performance_metrics_trigger
    BEFORE INSERT OR UPDATE ON article_progress
    FOR EACH ROW EXECUTE FUNCTION update_performance_metrics();

-- Fix 3: Add search_path to get_parallel_section_progress function
DROP FUNCTION IF EXISTS get_parallel_section_progress(article_uuid UUID);
CREATE OR REPLACE FUNCTION get_parallel_section_progress(article_uuid UUID)
RETURNS TABLE(
    section_id TEXT,
    section_type TEXT,
    status TEXT,
    progress DECIMAL(5,2),
    start_time TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER,
    word_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        section->>'sectionId' as section_id,
        section->>'sectionType' as section_type,
        section->>'status' as status,
        (section->>'progress')::DECIMAL(5,2) as progress,
        (section->>'startTime')::TIMESTAMP WITH TIME ZONE as start_time,
        (section->>'estimatedCompletion')::TIMESTAMP WITH TIME ZONE as estimated_completion,
        COALESCE((section->>'retryCount')::INTEGER, 0) as retry_count,
        COALESCE((section->>'wordCount')::INTEGER, 0) as word_count
    FROM article_progress ap,
    jsonb_array_elements(ap.parallel_sections) as section
    WHERE ap.article_id = article_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 4: Add search_path to update_parallel_section_status function
DROP FUNCTION IF EXISTS update_parallel_section_status(article_uuid UUID, section_id TEXT, new_status TEXT);
CREATE OR REPLACE FUNCTION update_parallel_section_status(article_uuid UUID, section_id TEXT, new_status TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE article_progress 
    SET 
        parallel_sections = jsonb_set(
            parallel_sections,
            array[
                (SELECT idx FROM 
                    (SELECT row_number() over () - 1 as idx, elem 
                     FROM jsonb_array_elements(parallel_sections) elem 
                     WHERE elem->>'sectionId' = section_id) sub
                )
            ],
            jsonb_set(
                parallel_sections->(SELECT idx FROM 
                    (SELECT row_number() over () - 1 as idx, elem 
                     FROM jsonb_array_elements(parallel_sections) elem 
                     WHERE elem->>'sectionId' = section_id) sub
                ),
                '{status}',
                to_jsonb(new_status)
            )
        ),
        updated_at = NOW()
    WHERE article_id = article_uuid
    AND parallel_sections @> jsonb_build_object('sectionId', section_id);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
