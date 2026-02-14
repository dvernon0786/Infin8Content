-- Migration: Remove competitor_url_id foreign key constraint for stateless Step 2
-- Story: Refactor Step 2 Competitor Analysis to be stateless and URL-driven
-- Date: 2026-02-14

-- The keywords table currently has a foreign key constraint to organization_competitors
-- Since Step 2 is now stateless and doesn't use organization_competitors table,
-- we need to remove this constraint and simplify the unique index to match workflow ownership

-- First, drop the foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'keywords_competitor_url_id_fkey'
        AND table_name = 'keywords'
    ) THEN
        ALTER TABLE keywords DROP CONSTRAINT keywords_competitor_url_id_fkey;
    END IF;
END $$;

-- Make competitor_url_id nullable since we're now using stateless competitors
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'keywords' 
        AND column_name = 'competitor_url_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE keywords ALTER COLUMN competitor_url_id DROP NOT NULL;
    END IF;
END $$;

-- Update the unique constraint to match workflow ownership architecture
-- Drop old constraint and create new one that aligns with stateless design
DROP INDEX IF EXISTS idx_keywords_seed_unique;

-- Create clean unique constraint that matches our upsert: (organization_id, workflow_id, seed_keyword)
CREATE UNIQUE INDEX idx_keywords_seed_unique 
ON keywords (organization_id, workflow_id, seed_keyword) 
WHERE parent_seed_keyword_id IS NULL;

-- Add comment explaining the architectural change
COMMENT ON COLUMN keywords.competitor_url_id IS 'Optional: References organization_competitors.id for legacy data. NULL for stateless Step 2 competitors.';
COMMENT ON INDEX idx_keywords_seed_unique IS 'Ensures unique seed keywords per workflow, supporting stateless Step 2 architecture.';
