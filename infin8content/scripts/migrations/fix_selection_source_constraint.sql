-- Fix selection_source constraint to allow NULL values
-- This resolves the bulk deselect constraint violation

-- Drop existing constraint
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS chk_keywords_selection_source;

-- Add updated constraint that allows NULL or 'ai'/'human'
ALTER TABLE keywords ADD CONSTRAINT chk_keywords_selection_source
CHECK (
  selection_source IS NULL
  OR selection_source IN ('ai','human')
);

-- Optional: Add consistency constraint for enterprise-grade enforcement
ALTER TABLE keywords ADD CONSTRAINT chk_selection_consistency
CHECK (
  (user_selected = true AND selection_source IS NOT NULL)
  OR
  (user_selected = false AND selection_source IS NULL)
);

-- Apply same fixes to topic_clusters table
ALTER TABLE topic_clusters DROP CONSTRAINT IF EXISTS chk_clusters_selection_source;
ALTER TABLE topic_clusters ADD CONSTRAINT chk_clusters_selection_source
CHECK (
  selection_source IS NULL
  OR selection_source IN ('ai','human')
);

ALTER TABLE topic_clusters ADD CONSTRAINT chk_clusters_selection_consistency
CHECK (
  (user_selected = true AND selection_source IS NOT NULL)
  OR
  (user_selected = false AND selection_source IS NULL)
);

-- Apply same fixes to subtopics table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='subtopics' AND table_schema='public'
    ) THEN
        ALTER TABLE subtopics DROP CONSTRAINT IF EXISTS chk_subtopics_selection_source;
        ALTER TABLE subtopics ADD CONSTRAINT chk_subtopics_selection_source
        CHECK (
          selection_source IS NULL
          OR selection_source IN ('ai','human')
        );
        
        ALTER TABLE subtopics ADD CONSTRAINT chk_subtopics_selection_consistency
        CHECK (
          (user_selected = true AND selection_source IS NOT NULL)
          OR
          (user_selected = false AND selection_source IS NULL)
        );
    END IF;
END $$;
