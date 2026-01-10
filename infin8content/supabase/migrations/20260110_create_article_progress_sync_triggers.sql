-- Create database triggers for synchronization between articles and article_progress tables
-- Story 15.1: Real-time Article Status Display

-- ============================================================================
-- Task 1: Create database triggers for automatic sync
-- ============================================================================

-- Function to sync article status changes to article_progress table
CREATE OR REPLACE FUNCTION sync_article_status_to_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the article status is changing
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Update or create article_progress entry using upsert pattern
        UPDATE article_progress 
        SET 
            status = NEW.status,
            current_stage = CASE 
                WHEN NEW.status = 'generating' THEN 'Processing'
                WHEN NEW.status = 'completed' THEN 'Complete'
                ELSE 'Pending'
            END,
            updated_at = NOW()
        WHERE article_id = NEW.id;
        
        -- If no rows were updated, insert new record
        IF NOT FOUND THEN
            INSERT INTO article_progress (
                article_id,
                org_id,
                status,
                current_stage,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.org_id,
                NEW.status,
                CASE 
                    WHEN NEW.status = 'generating' THEN 'Processing'
                    WHEN NEW.status = 'completed' THEN 'Complete'
                    ELSE 'Pending'
                END,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on articles table
DROP TRIGGER IF EXISTS trigger_sync_article_status_to_progress ON articles;
CREATE TRIGGER trigger_sync_article_status_to_progress
    AFTER UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION sync_article_status_to_progress();

-- Also trigger on insert to capture initial queued status
DROP TRIGGER IF EXISTS trigger_sync_article_insert_to_progress ON articles;
CREATE TRIGGER trigger_sync_article_insert_to_progress
    AFTER INSERT ON articles
    FOR EACH ROW
    EXECUTE FUNCTION sync_article_status_to_progress();

-- ============================================================================
-- Task 2: Function to sync progress changes back to articles table
-- ============================================================================

-- Function to sync article_progress status changes to articles table
CREATE OR REPLACE FUNCTION sync_progress_status_to_article()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the progress status is changing
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Update the articles table
        UPDATE articles
        SET status = CASE 
            WHEN NEW.status = 'queued' THEN 'queued'::text
            WHEN NEW.status = 'researching' THEN 'generating'::text
            WHEN NEW.status = 'writing' THEN 'generating'::text
            WHEN NEW.status = 'generating' THEN 'generating'::text
            WHEN NEW.status = 'completed' THEN 'completed'::text
            WHEN NEW.status = 'failed' THEN 'failed'::text
            ELSE NEW.status
        END,
        updated_at = NOW()
        WHERE id = NEW.article_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on article_progress table
DROP TRIGGER IF EXISTS trigger_sync_progress_status_to_article ON article_progress;
CREATE TRIGGER trigger_sync_progress_status_to_article
    AFTER UPDATE ON article_progress
    FOR EACH ROW
    EXECUTE FUNCTION sync_progress_status_to_article();

-- Also trigger on insert to ensure consistency
DROP TRIGGER IF EXISTS trigger_sync_progress_insert_to_article ON article_progress;
CREATE TRIGGER trigger_sync_progress_insert_to_article
    AFTER INSERT ON article_progress
    FOR EACH ROW
    EXECUTE FUNCTION sync_progress_status_to_article();

-- ============================================================================
-- Task 3: Add logging for synchronization activities
-- ============================================================================

-- Create sync_log table for debugging and monitoring
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_table TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT,
    sync_type TEXT NOT NULL, -- 'article_to_progress' or 'progress_to_article'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sync_log
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_log_source_table ON sync_log(source_table);
CREATE INDEX IF NOT EXISTS idx_sync_log_sync_type ON sync_log(sync_type);

-- Enhanced sync functions with logging
CREATE OR REPLACE FUNCTION sync_article_status_to_progress_logged()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the article status is changing
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Log the sync activity
        INSERT INTO sync_log (
            source_table,
            source_id,
            target_table,
            target_id,
            old_status,
            new_status,
            sync_type
        ) VALUES (
            'articles',
            NEW.id,
            'article_progress',
            NEW.id,
            OLD.status,
            NEW.status,
            'article_to_progress'
        );
        
        -- Update or create article_progress entry
        INSERT INTO article_progress (
            article_id,
            org_id,
            status,
            current_stage,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.org_id,
            CASE 
                WHEN NEW.status = 'queued' THEN 'queued'::text
                WHEN NEW.status = 'generating' THEN 'generating'::text
                WHEN NEW.status = 'completed' THEN 'completed'::text
                WHEN NEW.status = 'failed' THEN 'failed'::text
                WHEN NEW.status = 'cancelled' THEN 'failed'::text
                ELSE NEW.status
            END,
            CASE 
                WHEN NEW.status = 'queued' THEN 'Queued for generation'
                WHEN NEW.status = 'generating' THEN 'Article generation in progress'
                WHEN NEW.status = 'completed' THEN 'Article completed successfully'
                WHEN NEW.status = 'failed' THEN 'Article generation failed'
                WHEN NEW.status = 'cancelled' THEN 'Article generation cancelled'
                ELSE 'Status: ' || NEW.status
            END,
            NOW()
        )
        ON CONFLICT (article_id) 
        DO UPDATE SET
            status = EXCLUDED.status,
            current_stage = EXCLUDED.current_stage,
            updated_at = EXCLUDED.updated_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the original trigger with logged version
DROP TRIGGER IF EXISTS trigger_sync_article_status_to_progress ON articles;
CREATE TRIGGER trigger_sync_article_status_to_progress
    AFTER UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION sync_article_status_to_progress_logged();

DROP TRIGGER IF EXISTS trigger_sync_article_insert_to_progress ON articles;
CREATE TRIGGER trigger_sync_article_insert_to_progress
    AFTER INSERT ON articles
    FOR EACH ROW
    EXECUTE FUNCTION sync_article_status_to_progress_logged();

-- Enhanced progress sync with logging
CREATE OR REPLACE FUNCTION sync_progress_status_to_article_logged()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the progress status is changing
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Log the sync activity
        INSERT INTO sync_log (
            source_table,
            source_id,
            target_table,
            target_id,
            old_status,
            new_status,
            sync_type
        ) VALUES (
            'article_progress',
            NEW.article_id,
            'articles',
            NEW.article_id,
            OLD.status,
            NEW.status,
            'progress_to_article'
        );
        
        -- Update the articles table
        UPDATE articles
        SET status = CASE 
            WHEN NEW.status = 'queued' THEN 'queued'::text
            WHEN NEW.status = 'researching' THEN 'generating'::text
            WHEN NEW.status = 'writing' THEN 'generating'::text
            WHEN NEW.status = 'generating' THEN 'generating'::text
            WHEN NEW.status = 'completed' THEN 'completed'::text
            WHEN NEW.status = 'failed' THEN 'failed'::text
            ELSE NEW.status
        END,
        updated_at = NOW()
        WHERE id = NEW.article_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the original trigger with logged version
DROP TRIGGER IF EXISTS trigger_sync_progress_status_to_article ON article_progress;
CREATE TRIGGER trigger_sync_progress_status_to_article
    AFTER UPDATE ON article_progress
    FOR EACH ROW
    EXECUTE FUNCTION sync_progress_status_to_article_logged();

DROP TRIGGER IF EXISTS trigger_sync_progress_insert_to_article ON article_progress;
CREATE TRIGGER trigger_sync_progress_insert_to_article
    AFTER INSERT ON article_progress
    FOR EACH ROW
    EXECUTE FUNCTION sync_progress_status_to_article_logged();

-- ============================================================================
-- Task 4: Data cleanup for existing inconsistencies
-- ============================================================================

-- Function to clean up existing data inconsistencies
CREATE OR REPLACE FUNCTION cleanup_article_progress_sync()
RETURNS TABLE(
    articles_fixed INTEGER,
    progress_fixed INTEGER,
    inconsistencies_found INTEGER
) AS $$
DECLARE
    articles_count INTEGER := 0;
    progress_count INTEGER := 0;
    inconsistency_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- Find articles without corresponding progress entries
    FOR rec IN 
        SELECT a.id, a.org_id, a.status
        FROM articles a
        LEFT JOIN article_progress ap ON a.id = ap.article_id
        WHERE ap.article_id IS NULL
    LOOP
        INSERT INTO article_progress (
            article_id,
            org_id,
            status,
            current_stage,
            total_sections,
            progress_percentage,
            current_section
        ) VALUES (
            rec.id,
            rec.org_id,
            rec.status,
            'Status synced from articles table',
            1, -- Default total sections
            CASE 
                WHEN rec.status = 'completed' THEN 100.0
                WHEN rec.status = 'generating' THEN 50.0
                ELSE 0.0
            END,
            1
        );
        articles_count := articles_count + 1;
    END LOOP;
    
    -- Find progress entries without corresponding articles
    FOR rec IN 
        SELECT ap.article_id, ap.org_id, ap.status
        FROM article_progress ap
        LEFT JOIN articles a ON ap.article_id = a.id
        WHERE a.id IS NULL
    LOOP
        -- Create missing article entry
        INSERT INTO articles (
            id,
            org_id,
            status,
            keyword,
            target_word_count,
            created_at,
            updated_at
        ) VALUES (
            rec.article_id,
            rec.org_id,
            CASE 
                WHEN rec.status = 'completed' THEN 'completed'::text
                WHEN rec.status = 'generating' THEN 'generating'::text
                WHEN rec.status = 'failed' THEN 'failed'::text
                ELSE 'queued'::text
            END,
            'Recovered article', -- Default keyword
            1000, -- Default word count
            NOW(),
            NOW()
        );
        progress_count := progress_count + 1;
    END LOOP;
    
    -- Find status mismatches
    FOR rec IN 
        SELECT a.id, a.status as article_status, ap.status as progress_status
        FROM articles a
        INNER JOIN article_progress ap ON a.id = ap.article_id
        WHERE a.status != CASE 
            WHEN ap.status = 'researching' THEN 'generating'
            WHEN ap.status = 'writing' THEN 'generating'
            WHEN ap.status = 'generating' THEN 'generating'
            WHEN ap.status = 'completed' THEN 'completed'
            WHEN ap.status = 'failed' THEN 'failed'
            WHEN ap.status = 'queued' THEN 'queued'
            ELSE a.status
        END
    LOOP
        -- Update article status to match progress
        UPDATE articles
        SET status = CASE 
            WHEN rec.progress_status = 'researching' THEN 'generating'::text
            WHEN rec.progress_status = 'writing' THEN 'generating'::text
            WHEN rec.progress_status = 'generating' THEN 'generating'::text
            WHEN rec.progress_status = 'completed' THEN 'completed'::text
            WHEN rec.progress_status = 'failed' THEN 'failed'::text
            WHEN rec.progress_status = 'queued' THEN 'queued'::text
            ELSE rec.progress_status
        END,
        updated_at = NOW()
        WHERE id = rec.id;
        
        inconsistency_count := inconsistency_count + 1;
    END LOOP;
    
    -- Return cleanup statistics
    articles_fixed := articles_count;
    progress_fixed := progress_count;
    inconsistencies_found := inconsistency_count;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_article_progress_sync() TO authenticated;
GRANT SELECT ON sync_log TO authenticated;
