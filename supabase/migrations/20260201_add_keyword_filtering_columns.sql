-- Migration: Add filtering columns to keywords table
-- Story 36.1: Filter Keywords for Quality and Relevance
-- Date: 2026-02-01

-- Add filtering metadata columns to keywords table
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS is_filtered_out BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS filtered_reason TEXT CHECK (filtered_reason IN ('duplicate', 'low_volume')),
ADD COLUMN IF NOT EXISTS filtered_at TIMESTAMP WITH TIME ZONE;

-- Add parent_seed_keyword_id for long-tail keyword relationships (from Story 35.1)
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS parent_seed_keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL;

-- Add indexes for filtering operations
CREATE INDEX IF NOT EXISTS idx_keywords_is_filtered_out 
ON keywords(is_filtered_out) 
WHERE is_filtered_out = FALSE;

CREATE INDEX IF NOT EXISTS idx_keywords_filtered_reason 
ON keywords(filtered_reason) 
WHERE filtered_reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_keywords_parent_seed_keyword_id 
ON keywords(parent_seed_keyword_id);

-- Add comments for documentation
COMMENT ON COLUMN keywords.is_filtered_out IS 'Boolean flag indicating if keyword was filtered out (FALSE = active, TRUE = filtered)';
COMMENT ON COLUMN keywords.filtered_reason IS 'Reason for filtering: duplicate or low_volume';
COMMENT ON COLUMN keywords.filtered_at IS 'Timestamp when filtering was applied';
COMMENT ON COLUMN keywords.parent_seed_keyword_id IS 'Reference to parent seed keyword for long-tail relationships (null for seed keywords)';

-- Update existing keywords to ensure they have proper default values
UPDATE keywords 
SET is_filtered_out = FALSE 
WHERE is_filtered_out IS NULL;

-- Add composite index for efficient filtering queries
CREATE INDEX IF NOT EXISTS idx_keywords_org_filtered_active 
ON keywords(organization_id, is_filtered_out) 
WHERE is_filtered_out = FALSE;
