-- Add unique constraint to guarantee conflict safety at database level
-- This prevents duplicate keywords within the same workflow/organization

-- Note: This migration assumes workflow_id column exists (added in previous migration)

-- Remove any existing duplicates (data cleanup) - only if workflow_id exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'keywords' 
        AND column_name = 'workflow_id'
    ) THEN
        DELETE FROM keywords 
        WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (
                    PARTITION BY organization_id, workflow_id, seed_keyword 
                    ORDER BY created_at DESC
                ) as rn
                FROM keywords
            ) t
            WHERE rn > 1
        );
    END IF;
END $$;

-- Add unique constraint only if workflow_id exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'keywords' 
        AND column_name = 'workflow_id'
    ) THEN
        -- Drop existing unique constraint if it exists
        ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_unique_workflow_keyword;
        
        -- Add new unique constraint
        ALTER TABLE keywords 
        ADD CONSTRAINT keywords_unique_workflow_keyword 
        UNIQUE (organization_id, workflow_id, seed_keyword);
        
        -- Add index for performance (if not exists)
        CREATE INDEX IF NOT EXISTS idx_keywords_workflow_unique 
        ON keywords (organization_id, workflow_id, seed_keyword);
        
        -- Add comment documenting the constraint
        COMMENT ON CONSTRAINT keywords_unique_workflow_keyword ON keywords IS 
        'Ensures each keyword appears only once per workflow within an organization';
    ELSE
        RAISE EXCEPTION 'workflow_id column does not exist in keywords table. Run workflow_id migration first.';
    END IF;
END $$;
