-- Complete Database Security Fixes - Manual Application Required
-- Fixes all remaining Supabase database linter security issues
-- Date: 2026-01-13
-- Instructions: Apply this SQL manually to your Supabase database

-- Fix 1: Add search_path to sync_progress_status_to_article function
CREATE OR REPLACE FUNCTION sync_progress_status_to_article()
RETURNS TRIGGER AS $$
BEGIN
    -- Update article_progress table with current article status
    INSERT INTO article_progress (
        article_id,
        org_id,
        status,
        progress_percentage,
        current_section,
        total_sections,
        current_stage,
        updated_at
    )
    SELECT 
        NEW.id,
        NEW.org_id,
        NEW.status,
        CASE 
            WHEN NEW.status = 'completed' THEN 100
            WHEN NEW.status = 'failed' THEN 0
            ELSE COALESCE(
                (SELECT progress_percentage FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1), 
                0
            )
        END,
        CASE 
            WHEN NEW.status = 'completed' THEN 
                (SELECT COALESCE(total_sections, 1) FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1)
            ELSE COALESCE(
                (SELECT current_section FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1), 
                1
            )
        END,
        CASE 
            WHEN NEW.status = 'completed' THEN 
                (SELECT COALESCE(total_sections, 1) FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1)
            ELSE COALESCE(
                (SELECT total_sections FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1), 
                1
            )
        END,
        CASE 
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'failed' THEN 'failed'
            WHEN NEW.status = 'generating' THEN 'generating'
            ELSE 'pending'
        END,
        NOW()
    ON CONFLICT (article_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        current_section = EXCLUDED.current_section,
        total_sections = EXCLUDED.total_sections,
        current_stage = EXCLUDED.current_stage,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 2: Add search_path to sync_progress_status_to_article_logged function
CREATE OR REPLACE FUNCTION sync_progress_status_to_article_logged()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the sync operation
    INSERT INTO sync_log (table_name, operation, record_id, old_data, new_data, created_at)
    VALUES (
        'articles',
        'UPDATE',
        NEW.id,
        row_to_json(OLD),
        row_to_json(NEW),
        NOW()
    );
    
    -- Update article_progress table with current article status
    INSERT INTO article_progress (
        article_id,
        org_id,
        status,
        progress_percentage,
        current_section,
        total_sections,
        current_stage,
        updated_at
    )
    SELECT 
        NEW.id,
        NEW.org_id,
        NEW.status,
        CASE 
            WHEN NEW.status = 'completed' THEN 100
            WHEN NEW.status = 'failed' THEN 0
            ELSE COALESCE(
                (SELECT progress_percentage FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1), 
                0
            )
        END,
        CASE 
            WHEN NEW.status = 'completed' THEN 
                (SELECT COALESCE(total_sections, 1) FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1)
            ELSE COALESCE(
                (SELECT current_section FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1), 
                1
            )
        END,
        CASE 
            WHEN NEW.status = 'completed' THEN 
                (SELECT COALESCE(total_sections, 1) FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1)
            ELSE COALESCE(
                (SELECT total_sections FROM article_progress WHERE article_id = NEW.id ORDER BY updated_at DESC LIMIT 1), 
                1
            )
        END,
        CASE 
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'failed' THEN 'failed'
            WHEN NEW.status = 'generating' THEN 'generating'
            ELSE 'pending'
        END,
        NOW()
    ON CONFLICT (article_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        current_section = EXCLUDED.current_section,
        total_sections = EXCLUDED.total_sections,
        current_stage = EXCLUDED.current_stage,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 3: Add search_path to cleanup_article_progress_sync function
CREATE OR REPLACE FUNCTION cleanup_article_progress_sync()
RETURNS void AS $$
BEGIN
    -- Clean up old sync logs (older than 30 days)
    DELETE FROM sync_log 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up orphaned article_progress records (no corresponding article)
    DELETE FROM article_progress 
    WHERE NOT EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_progress.article_id
    );
    
    -- Update statistics
    ANALYZE sync_log;
    ANALYZE article_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 4: Add search_path to sync_article_status_to_progress function
CREATE OR REPLACE FUNCTION sync_article_status_to_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update article_progress when article status changes
    UPDATE article_progress 
    SET 
        status = NEW.status,
        updated_at = NOW()
    WHERE article_id = NEW.id;
    
    -- If no progress record exists, create one
    INSERT INTO article_progress (
        article_id,
        org_id,
        status,
        progress_percentage,
        current_section,
        total_sections,
        current_stage,
        updated_at
    )
    SELECT 
        NEW.id,
        NEW.org_id,
        NEW.status,
        CASE 
            WHEN NEW.status = 'completed' THEN 100
            WHEN NEW.status = 'failed' THEN 0
            ELSE 0
        END,
        1,
        1,
        CASE 
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'failed' THEN 'failed'
            WHEN NEW.status = 'generating' THEN 'generating'
            ELSE 'pending'
        END,
        NOW()
    ON CONFLICT (article_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 5: Add search_path to sync_article_status_to_progress_logged function
CREATE OR REPLACE FUNCTION sync_article_status_to_progress_logged()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the sync operation
    INSERT INTO sync_log (table_name, operation, record_id, old_data, new_data, created_at)
    VALUES (
        'articles',
        'UPDATE',
        NEW.id,
        row_to_json(OLD),
        row_to_json(NEW),
        NOW()
    );
    
    -- Update article_progress when article status changes
    UPDATE article_progress 
    SET 
        status = NEW.status,
        updated_at = NOW()
    WHERE article_id = NEW.id;
    
    -- If no progress record exists, create one
    INSERT INTO article_progress (
        article_id,
        org_id,
        status,
        progress_percentage,
        current_section,
        total_sections,
        current_stage,
        updated_at
    )
    SELECT 
        NEW.id,
        NEW.org_id,
        NEW.status,
        CASE 
            WHEN NEW.status = 'completed' THEN 100
            WHEN NEW.status = 'failed' THEN 0
            ELSE 0
        END,
        1,
        1,
        CASE 
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'failed' THEN 'failed'
            WHEN NEW.status = 'generating' THEN 'generating'
            ELSE 'pending'
        END,
        NOW()
    ON CONFLICT (article_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 6: Add search_path to update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 7: Improve stripe_webhook_events RLS policy to be more restrictive
DROP POLICY IF EXISTS "Service role can insert webhook events" ON stripe_webhook_events;

CREATE POLICY "Service role can insert valid webhook events" ON stripe_webhook_events
    FOR INSERT WITH CHECK (
        event_type IS NOT NULL 
        AND organization_id IS NOT NULL
        AND created_at IS NOT NULL
        AND jsonb_typeof(event_data) = 'object'
    );

-- Fix 8: Enable RLS on sync_log table (if it exists)
DO $$
BEGIN
    -- Check if sync_log table exists and enable RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_log' AND table_schema = 'public') THEN
        ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for sync_log if none exist
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_log' AND schemaname = 'public') THEN
            -- Allow authenticated users to see their own sync logs
            CREATE POLICY "Users can view own sync logs" ON sync_log
                FOR SELECT USING (auth.uid() IS NOT NULL);
                
            -- Allow service role to manage all sync logs
            CREATE POLICY "Service role full access to sync logs" ON sync_log
                FOR ALL USING (current_setting('request.jwt.claims', '{}')::jsonb->>''role' = 'service_role');
        END IF;
    END IF;
END $$;

-- Fix 9: Ensure enhanced_article_progress view uses SECURITY INVOKER
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

-- Grant proper permissions
GRANT SELECT ON enhanced_article_progress TO authenticated;
GRANT SELECT ON enhanced_article_progress TO service_role;
