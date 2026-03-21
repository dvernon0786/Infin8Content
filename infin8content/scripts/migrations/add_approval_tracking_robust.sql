-- Migration: Add approval tracking fields for human-in-the-loop workflow (ROBUST VERSION)
-- Date: 2026-02-17
-- Purpose: Enable entity-level approval gating for Steps 3-9
-- Handles existing tables and columns gracefully

-- Add approval tracking to keywords table (seeds and longtails) - robust version
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='keywords' AND table_schema='public'
    ) THEN
        -- Check if column exists before adding
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='keywords' AND column_name='user_selected'
        ) THEN
            ALTER TABLE keywords ADD COLUMN user_selected BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='keywords' AND column_name='selection_source'
        ) THEN
            ALTER TABLE keywords ADD COLUMN selection_source VARCHAR(10) DEFAULT 'ai';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='keywords' AND column_name='selection_updated_at'
        ) THEN
            ALTER TABLE keywords ADD COLUMN selection_updated_at TIMESTAMP;
        END IF;
    ELSE
        RAISE NOTICE 'Keywords table does not exist - skipping';
    END IF;
END $$;

-- Add approval tracking to topic_clusters table - robust version
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='topic_clusters' AND table_schema='public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='topic_clusters' AND column_name='user_selected'
        ) THEN
            ALTER TABLE topic_clusters ADD COLUMN user_selected BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='topic_clusters' AND column_name='selection_source'
        ) THEN
            ALTER TABLE topic_clusters ADD COLUMN selection_source VARCHAR(10) DEFAULT 'ai';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='topic_clusters' AND column_name='selection_updated_at'
        ) THEN
            ALTER TABLE topic_clusters ADD COLUMN selection_updated_at TIMESTAMP;
        END IF;
    ELSE
        RAISE NOTICE 'Topic_clusters table does not exist - skipping';
    END IF;
END $$;

-- Add approval tracking to subtopics table - robust version
DO $$
BEGIN
    -- Check if table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='subtopics' AND table_schema='public'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='subtopics' AND column_name='user_selected'
        ) THEN
            ALTER TABLE subtopics ADD COLUMN user_selected BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='subtopics' AND column_name='selection_source'
        ) THEN
            ALTER TABLE subtopics ADD COLUMN selection_source VARCHAR(10) DEFAULT 'ai';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='subtopics' AND column_name='selection_updated_at'
        ) THEN
            ALTER TABLE subtopics ADD COLUMN selection_updated_at TIMESTAMP;
        END IF;
    ELSE
        RAISE NOTICE 'Subtopics table does not exist - skipping. Subtopics may be stored in keywords.subtopics JSONB field.';
    END IF;
END $$;

-- Add indexes for performance (robust version - check table and column existence)
DO $$
BEGIN
    -- Keywords table indexes
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='keywords' AND table_schema='public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_keywords_user_selected ON keywords(user_selected, workflow_id);
        CREATE INDEX IF NOT EXISTS idx_keywords_approval ON keywords(user_selected, workflow_id);
    END IF;
    
    -- Topic clusters table indexes (check columns first)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='topic_clusters' AND table_schema='public'
    ) THEN
        -- Check if organization_id column exists before creating index
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='topic_clusters' AND column_name='organization_id' AND table_schema='public'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_clusters_user_selected ON topic_clusters(user_selected, workflow_id);
            CREATE INDEX IF NOT EXISTS idx_clusters_approval ON topic_clusters(user_selected, organization_id, workflow_id);
        ELSE
            -- Fallback: indexes without organization_id
            CREATE INDEX IF NOT EXISTS idx_clusters_user_selected ON topic_clusters(user_selected, workflow_id);
            CREATE INDEX IF NOT EXISTS idx_clusters_approval ON topic_clusters(user_selected, workflow_id);
            RAISE NOTICE 'Topic_clusters table missing organization_id column - creating indexes without it';
        END IF;
    END IF;
    
    -- Subtopics table indexes (only if table exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='subtopics' AND table_schema='public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_subtopics_user_selected ON subtopics(user_selected, workflow_id);
        CREATE INDEX IF NOT EXISTS idx_subtopics_approval ON subtopics(user_selected, organization_id, workflow_id);
    END IF;
END $$;

-- Add check constraints for data integrity (robust version)
DO $$
BEGIN
    -- Add constraints only if they don't exist and table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='keywords' AND table_schema='public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name='chk_keywords_selection_source'
    ) THEN
        -- First, update any existing invalid data to 'ai' to satisfy the constraint
        UPDATE keywords 
        SET selection_source = 'ai' 
        WHERE selection_source IS NULL OR selection_source NOT IN ('ai', 'human');
        
        ALTER TABLE keywords ADD CONSTRAINT chk_keywords_selection_source 
          CHECK (selection_source IN ('ai', 'human'));
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='topic_clusters' AND table_schema='public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name='chk_clusters_selection_source'
    ) THEN
        -- First, update any existing invalid data to 'ai' to satisfy the constraint
        UPDATE topic_clusters 
        SET selection_source = 'ai' 
        WHERE selection_source IS NULL OR selection_source NOT IN ('ai', 'human');
        
        ALTER TABLE topic_clusters ADD CONSTRAINT chk_clusters_selection_source 
          CHECK (selection_source IN ('ai', 'human'));
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='subtopics' AND table_schema='public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name='chk_subtopics_selection_source'
    ) THEN
        -- First, update any existing invalid data to 'ai' to satisfy the constraint
        UPDATE subtopics 
        SET selection_source = 'ai' 
        WHERE selection_source IS NULL OR selection_source NOT IN ('ai', 'human');
        
        ALTER TABLE subtopics ADD CONSTRAINT chk_subtopics_selection_source 
          CHECK (selection_source IN ('ai', 'human'));
    END IF;
END $$;

-- Add comments (robust version - check table existence)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='keywords' AND table_schema='public'
    ) THEN
        COMMENT ON COLUMN keywords.user_selected IS 'Human approval flag for entity-level gating';
        COMMENT ON COLUMN keywords.selection_source IS 'Source of selection: ai-generated or human-selected';
        COMMENT ON COLUMN keywords.selection_updated_at IS 'Timestamp of last selection change';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='topic_clusters' AND table_schema='public'
    ) THEN
        COMMENT ON COLUMN topic_clusters.user_selected IS 'Human approval flag for cluster approval gating';
        COMMENT ON COLUMN topic_clusters.selection_source IS 'Source of selection: ai-generated or human-selected';
        COMMENT ON COLUMN topic_clusters.selection_updated_at IS 'Timestamp of last selection change';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='subtopics' AND table_schema='public'
    ) THEN
        COMMENT ON COLUMN subtopics.user_selected IS 'Human approval flag for subtopic approval gating';
        COMMENT ON COLUMN subtopics.selection_source IS 'Source of selection: ai-generated or human-selected';
        COMMENT ON COLUMN subtopics.selection_updated_at IS 'Timestamp of last selection change';
    END IF;
END $$;
