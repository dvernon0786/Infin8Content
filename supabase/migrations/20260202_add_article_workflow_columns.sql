-- Story 38.1: Queue Approved Subtopics for Article Generation
-- Add workflow context columns to articles table

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS intent_workflow_id UUID REFERENCES intent_workflows(id),
ADD COLUMN IF NOT EXISTS subtopic_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cluster_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS icp_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitor_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS article_structure JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_intent_workflow_id ON articles(intent_workflow_id);
CREATE INDEX IF NOT EXISTS idx_articles_intent_workflow_status ON articles(intent_workflow_id, status);
