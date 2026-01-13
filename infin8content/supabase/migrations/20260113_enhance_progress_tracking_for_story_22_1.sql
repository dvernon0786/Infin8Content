-- Database Schema Extensions for Generation Progress Visualization
-- Story 22.1: Generation Progress Visualization
-- Task 2: Real-time Progress Updates
-- 
-- Extends article_progress table with parallel processing fields,
-- performance metrics tracking, and enhanced progress visualization support

-- Add parallel processing fields to article_progress table
ALTER TABLE article_progress 
ADD COLUMN IF NOT EXISTS parallel_sections JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS research_api_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cache_hit_rate DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS retry_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS research_phase JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS context_management JSONB DEFAULT '{}';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_article_progress_parallel_sections ON article_progress USING GIN(parallel_sections);
CREATE INDEX IF NOT EXISTS idx_article_progress_cache_hit_rate ON article_progress(cache_hit_rate);
CREATE INDEX IF NOT EXISTS idx_article_progress_retry_attempts ON article_progress(retry_attempts);
CREATE INDEX IF NOT EXISTS idx_article_progress_estimated_completion ON article_progress(estimated_completion);

-- Add check constraints for data integrity
-- Note: PostgreSQL doesn't support IF NOT EXISTS with constraints, so we drop first
DO $$ 
BEGIN
    -- Drop constraints if they exist
    ALTER TABLE article_progress DROP CONSTRAINT IF EXISTS chk_cache_hit_rate;
    ALTER TABLE article_progress DROP CONSTRAINT IF EXISTS chk_retry_attempts; 
    ALTER TABLE article_progress DROP CONSTRAINT IF EXISTS chk_research_api_calls;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add the constraints
ALTER TABLE article_progress 
ADD CONSTRAINT chk_cache_hit_rate CHECK (cache_hit_rate >= 0 AND cache_hit_rate <= 100),
ADD CONSTRAINT chk_retry_attempts CHECK (retry_attempts >= 0),
ADD CONSTRAINT chk_research_api_calls CHECK (research_api_calls >= 0);

-- Create a function to update performance metrics
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update performance metrics
DROP TRIGGER IF EXISTS update_performance_metrics_trigger ON article_progress;
CREATE TRIGGER update_performance_metrics_trigger
    BEFORE INSERT OR UPDATE ON article_progress
    FOR EACH ROW EXECUTE FUNCTION update_performance_metrics();

-- Create a view for enhanced progress tracking
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

-- Grant permissions for the new view
GRANT SELECT ON enhanced_article_progress TO authenticated;
GRANT SELECT ON enhanced_article_progress TO service_role;

-- Add RLS policy for the new fields (existing policies should cover these, but let's be explicit)
DROP POLICY IF EXISTS "Users can view enhanced progress in their org" ON article_progress;
CREATE POLICY "Users can view enhanced progress in their org" ON article_progress
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create a function to get parallel section progress
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update parallel section status
CREATE OR REPLACE FUNCTION update_parallel_section_status(
    article_uuid UUID,
    section_id TEXT,
    new_status TEXT,
    new_progress DECIMAL(5,2) DEFAULT NULL,
    new_word_count INTEGER DEFAULT NULL
)
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
                jsonb_set(
                    parallel_sections->(SELECT idx FROM 
                        (SELECT row_number() over () - 1 as idx, elem 
                         FROM jsonb_array_elements(parallel_sections) elem 
                         WHERE elem->>'sectionId' = section_id) sub
                    ),
                    '{status}',
                    to_jsonb(new_status)
                ),
                CASE 
                    WHEN new_progress IS NOT NULL THEN '{progress}'
                    WHEN new_word_count IS NOT NULL THEN '{wordCount}'
                    ELSE '{}'
                END,
                CASE 
                    WHEN new_progress IS NOT NULL THEN to_jsonb(new_progress)
                    WHEN new_word_count IS NOT NULL THEN to_jsonb(new_word_count)
                    ELSE 'null'::jsonb
                END
            )
        ),
        updated_at = NOW()
    WHERE article_id = article_uuid
    AND parallel_sections @> jsonb_build_object('sectionId', section_id);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment documenting the Epic 20 integration
COMMENT ON TABLE article_progress IS 'Enhanced progress tracking with Epic 20 performance optimizations - supports parallel processing, research phase visualization, context management metrics, and real-time progress updates';

COMMENT ON COLUMN article_progress.parallel_sections IS 'JSON array of parallel section processing data from Epic 20 optimizations - supports 4+ concurrent section generation';
COMMENT ON COLUMN article_progress.research_api_calls IS 'Number of research API calls made - Epic 20 reduced this from 8-13 to 1-2 calls per article';
COMMENT ON COLUMN article_progress.cache_hit_rate IS 'Cache hit rate percentage - Epic 20 optimization target >80%';
COMMENT ON COLUMN article_progress.retry_attempts IS 'Number of retry attempts - Epic 20 optimized to maximum 1 retry with 500ms delay';
COMMENT ON COLUMN article_progress.performance_metrics IS 'JSON object containing comprehensive performance metrics for Story 22.1 visualization';
COMMENT ON COLUMN article_progress.research_phase IS 'JSON object containing research phase status and metrics for visualization';
COMMENT ON COLUMN article_progress.context_management IS 'JSON object containing context management metrics from Epic 20 optimizations';

-- Real-time subscription setup (Supabase automatically handles this for the table)
-- The article_progress table is already configured for real-time subscriptions
-- Clients can subscribe to specific article progress updates or all org progress
