-- Focused Database Security Fixes - Manual Application Required
-- Addresses specific Supabase database linter security issues
-- Date: 2026-01-13
-- Instructions: Apply this SQL manually to your Supabase database

-- Fix 1: Function Search Path Mutable - Add SET search_path = '' to functions
-- This prevents functions from using mutable search paths

-- Fix sync_progress_status_to_article function
DROP FUNCTION IF EXISTS sync_progress_status_to_article();
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix sync_progress_status_to_article_logged function
-- Use CREATE OR REPLACE FUNCTION to avoid breaking dependent triggers
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix cleanup_article_progress_sync function
DROP FUNCTION IF EXISTS cleanup_article_progress_sync();
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix sync_article_status_to_progress function
-- Use CREATE OR REPLACE FUNCTION to avoid breaking dependent triggers
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix sync_article_status_to_progress_logged function
-- Use CREATE OR REPLACE FUNCTION to avoid breaking dependent triggers
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix update_updated_at_column function
-- Use CREATE OR REPLACE FUNCTION to avoid breaking dependent triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix 2: Security Definer View - Reconsider if the view needs SECURITY DEFINER
-- For enhanced_article_progress, we'll create it as a regular view (PostgreSQL doesn't support WITH SECURITY INVOKER on views)
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

-- Fix 3: RLS Disabled - Enable Row Level Security on sync_log table
DO $$
BEGIN
    -- Check if sync_log table exists and enable RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_log' AND table_schema = 'public') THEN
        ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
        
        -- Create appropriate RLS policies for sync_log
        -- Allow authenticated users to view their own sync logs (if user_id column exists)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_log' AND column_name = 'user_id' AND table_schema = 'public') THEN
            -- Only create policy if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_policy p
                JOIN pg_class c ON p.polrelid = c.oid
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE p.polname = 'Users can view own sync logs'
                  AND c.relname = 'sync_log'
                  AND n.nspname = 'public'
            ) THEN
                CREATE POLICY "Users can view own sync logs" ON sync_log
                    FOR SELECT USING (auth.uid()::text = user_id::text);
            END IF;
        END IF;
        
        -- Only create service role policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policy p
            JOIN pg_class c ON p.polrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE p.polname = 'Service role full access to sync logs'
              AND c.relname = 'sync_log'
              AND n.nspname = 'public'
        ) THEN
            CREATE POLICY "Service role full access to sync logs" ON sync_log
                FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');
        END IF;
        
        -- Only create authenticated users policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policy p
            JOIN pg_class c ON p.polrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE p.polname = 'Authenticated users can insert sync logs'
              AND c.relname = 'sync_log'
              AND n.nspname = 'public'
        ) THEN
            CREATE POLICY "Authenticated users can insert sync logs" ON sync_log
                FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- Fix 4: RLS Always True - Review the stripe_webhook_events policy
-- Replace the overly permissive policy with a more restrictive one
DO $$
BEGIN
    -- Check if stripe_webhook_events table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_webhook_events' AND table_schema = 'public') THEN
        -- Only drop the overly permissive policy if it exists
        IF EXISTS (
            SELECT 1 FROM pg_policy p
            JOIN pg_class c ON p.polrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE p.polname = 'Service role can insert webhook events'
              AND c.relname = 'stripe_webhook_events'
              AND n.nspname = 'public'
        ) THEN
            DROP POLICY "Service role can insert webhook events" ON stripe_webhook_events;
        END IF;
        
        -- Only create the restrictive policy if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policy p
            JOIN pg_class c ON p.polrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE p.polname = 'Service role can insert valid webhook events'
              AND c.relname = 'stripe_webhook_events'
              AND n.nspname = 'public'
        ) THEN
            -- Create a more restrictive policy with basic validation only
            -- Use only event_type validation which we know exists
            CREATE POLICY "Service role can insert valid webhook events" ON stripe_webhook_events
                FOR INSERT WITH CHECK (
                    -- Ensure event_type is not null and is a valid Stripe event type
                    event_type IS NOT NULL 
                    AND event_type ~ '^(charge\.[a-z_]+|customer\.[a-z_]+|invoice\.[a-z_]+|payment_intent\.[a-z_]+|subscription\.[a-z_]+)$'
                );
        END IF;
    END IF;
END $$;

-- Grant proper permissions
GRANT SELECT ON enhanced_article_progress TO authenticated;
GRANT SELECT ON enhanced_article_progress TO service_role;
