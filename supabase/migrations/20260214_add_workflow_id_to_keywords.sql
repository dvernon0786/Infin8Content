-- Add workflow_id to keywords table for proper workflow isolation
-- This is critical for Step 3 to work correctly

-- Add workflow_id column
ALTER TABLE keywords ADD COLUMN workflow_id UUID REFERENCES intent_workflows(id) ON DELETE CASCADE;

-- Update the unique constraint to include workflow_id for proper isolation
DROP INDEX IF EXISTS keywords_organization_competitor_seed_unique;
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_organization_competitor_seed_keyword_unique;

-- Add new composite unique constraint with workflow_id
ALTER TABLE keywords ADD CONSTRAINT keywords_workflow_unique 
  UNIQUE(organization_id, workflow_id, seed_keyword);

-- Add index for workflow-based queries
CREATE INDEX IF NOT EXISTS idx_keywords_workflow_id 
ON keywords(workflow_id);

-- Add composite index for organization + workflow queries
CREATE INDEX IF NOT EXISTS idx_keywords_organization_workflow 
ON keywords(organization_id, workflow_id);

-- Update existing keywords to associate with their workflows (if possible)
-- This is a best-effort migration - some keywords may remain without workflow_id
UPDATE keywords 
SET workflow_id = (
  SELECT iw.id 
  FROM intent_workflows iw 
  JOIN organization_competitors oc ON iw.organization_id = oc.organization_id 
  WHERE oc.id = keywords.competitor_url_id 
  AND iw.organization_id = keywords.organization_id
  LIMIT 1
)
WHERE workflow_id IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN keywords.workflow_id IS 'Workflow for isolation and Step 3 keyword retrieval';
COMMENT ON CONSTRAINT keywords_workflow_unique IS 'Ensures unique keywords per workflow within organization';
