-- Migration: Add approval tracking fields for human-in-the-loop workflow (SAFE VERSION)
-- Date: 2026-02-17
-- Purpose: Enable entity-level approval gating for Steps 3-9
-- Handles existing columns gracefully

-- Add approval tracking to keywords table (seeds and longtails) - safe version
DO $$
BEGIN
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
END $$;

-- Add approval tracking to topic_clusters table - safe version
DO $$
BEGIN
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
END $$;

-- Add approval tracking to subtopics table - safe version
DO $$
BEGIN
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
END $$;

-- Add indexes for performance (safe version - ignore if exists)
CREATE INDEX IF NOT EXISTS idx_keywords_user_selected ON keywords(user_selected, workflow_id);
CREATE INDEX IF NOT EXISTS idx_keywords_approval ON keywords(user_selected, organization_id, workflow_id);
CREATE INDEX IF NOT EXISTS idx_clusters_user_selected ON topic_clusters(user_selected, workflow_id);
CREATE INDEX IF NOT EXISTS idx_clusters_approval ON topic_clusters(user_selected, organization_id, workflow_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_user_selected ON subtopics(user_selected, workflow_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_approval ON subtopics(user_selected, organization_id, workflow_id);

-- Add check constraints for data integrity (safe version)
DO $$
BEGIN
    -- Add constraints only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name='chk_keywords_selection_source'
    ) THEN
        ALTER TABLE keywords ADD CONSTRAINT chk_keywords_selection_source 
          CHECK (selection_source IN ('ai', 'human'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name='chk_clusters_selection_source'
    ) THEN
        ALTER TABLE topic_clusters ADD CONSTRAINT chk_clusters_selection_source 
          CHECK (selection_source IN ('ai', 'human'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name='chk_subtopics_selection_source'
    ) THEN
        ALTER TABLE subtopics ADD CONSTRAINT chk_subtopics_selection_source 
          CHECK (selection_source IN ('ai', 'human'));
    END IF;
END $$;

-- Add comments (safe version - will overwrite if exists)
COMMENT ON COLUMN keywords.user_selected IS 'Human approval flag for entity-level gating';
COMMENT ON COLUMN keywords.selection_source IS 'Source of selection: ai-generated or human-selected';
COMMENT ON COLUMN keywords.selection_updated_at IS 'Timestamp of last selection change';

COMMENT ON COLUMN topic_clusters.user_selected IS 'Human approval flag for cluster approval gating';
COMMENT ON COLUMN topic_clusters.selection_source IS 'Source of selection: ai-generated or human-selected';
COMMENT ON COLUMN topic_clusters.selection_updated_at IS 'Timestamp of last selection change';

COMMENT ON COLUMN subtopics.user_selected IS 'Human approval flag for subtopic approval gating';
COMMENT ON COLUMN subtopics.selection_source IS 'Source of selection: ai-generated or human-selected';
COMMENT ON COLUMN subtopics.selection_updated_at IS 'Timestamp of last selection change';
