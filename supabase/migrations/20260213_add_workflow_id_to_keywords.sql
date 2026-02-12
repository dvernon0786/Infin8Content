-- Add workflow_id column to keywords table for workflow isolation
-- This is critical for multi-workflow safety and prevents cross-workflow contamination

-- Add workflow_id column
ALTER TABLE keywords 
ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES intent_workflows(id) ON DELETE CASCADE;

-- Add index for workflow-based queries
CREATE INDEX IF NOT EXISTS idx_keywords_workflow_id ON keywords(workflow_id);

-- Add composite index for workflow isolation
CREATE INDEX IF NOT EXISTS idx_keywords_workflow_organization ON keywords(organization_id, workflow_id);

-- Update existing unique constraint to include workflow_id
-- First drop the old constraint
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_organization_competitor_seed_keyword_unique;

-- Add new unique constraint that includes workflow_id
ALTER TABLE keywords 
ADD CONSTRAINT keywords_unique_workflow_keyword 
UNIQUE (organization_id, workflow_id, seed_keyword);

-- Add comment explaining the workflow isolation
COMMENT ON COLUMN keywords.workflow_id IS 'Links keywords to specific workflows for multi-tenant isolation';
