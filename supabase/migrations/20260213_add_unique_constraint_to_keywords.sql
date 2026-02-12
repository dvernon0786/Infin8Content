-- Add unique constraint to guarantee conflict safety at database level
-- This prevents duplicate keywords within the same workflow/organization

-- First, remove any existing duplicates (data cleanup)
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

-- Add unique constraint
ALTER TABLE keywords 
ADD CONSTRAINT keywords_unique_workflow_keyword 
UNIQUE (organization_id, workflow_id, seed_keyword);

-- Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_keywords_workflow_unique 
ON keywords (organization_id, workflow_id, seed_keyword);

-- Add comment documenting the constraint
COMMENT ON CONSTRAINT keywords_unique_workflow_keyword ON keywords IS 
'Ensures each keyword appears only once per workflow within an organization';
