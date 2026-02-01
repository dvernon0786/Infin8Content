-- Migration: Add parent_seed_keyword_id to keywords table for long-tail expansion
-- Story 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model)
-- Date: 2026-02-01

-- Add parent_seed_keyword_id column to support long-tail keyword relationships
ALTER TABLE keywords 
ADD COLUMN parent_seed_keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE;

-- Create index for parent-child relationships
CREATE INDEX IF NOT EXISTS idx_keywords_parent_seed_keyword_id 
ON keywords(parent_seed_keyword_id) 
WHERE parent_seed_keyword_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN keywords.parent_seed_keyword_id IS 'References the parent seed keyword when this record is a long-tail expansion';

-- Update the unique constraint to allow long-tail keywords with same parent
-- Drop old constraint and create new one that allows parent-child relationships
DROP INDEX IF EXISTS keywords_organization_competitor_seed_keyword_unique;

-- Create new unique constraint for seed keywords (parent_seed_keyword_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_seed_unique 
ON keywords(organization_id, competitor_url_id, seed_keyword) 
WHERE parent_seed_keyword_id IS NULL;