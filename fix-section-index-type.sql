-- Fix section_index column type to support hierarchical indices
-- Issue: current_section_index is INTEGER but code stores strings like "1.1", "1.2"

-- Change current_section_index from INTEGER to TEXT
ALTER TABLE articles 
ALTER COLUMN current_section_index TYPE TEXT USING current_section_index::TEXT;

-- Add comment to clarify the change
COMMENT ON COLUMN articles.current_section_index IS 'Stores the current section index being processed (supports hierarchical indices like "1.1", "1.2")';

-- Update the index to work with TEXT type
DROP INDEX IF EXISTS idx_articles_current_section;
CREATE INDEX IF NOT EXISTS idx_articles_current_section ON articles(current_section_index TEXT_pattern_ops);
