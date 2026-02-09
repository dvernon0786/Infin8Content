-- Add article workflow linking fields
-- Migration: 20260203023916_add_article_workflow_linking_fields.sql

-- Add fields to articles table for workflow linking
ALTER TABLE articles 
ADD COLUMN workflow_link_status TEXT DEFAULT 'not_linked' CHECK (workflow_link_status IN ('not_linked', 'linking', 'linked', 'failed')),
ADD COLUMN linked_at TIMESTAMP WITH TIME ZONE;

-- Add fields to intent_workflows table for article linking tracking
ALTER TABLE intent_workflows 
ADD COLUMN article_link_count INTEGER DEFAULT 0,
ADD COLUMN article_linking_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN article_linking_completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance optimization
CREATE INDEX idx_articles_workflow_linking ON articles(intent_workflow_id, status, workflow_link_status);
CREATE INDEX idx_articles_linked_at ON articles(linked_at) WHERE linked_at IS NOT NULL;
CREATE INDEX idx_workflows_article_link_count ON intent_workflows(article_link_count) WHERE article_link_count > 0;

-- Add comments for documentation
COMMENT ON COLUMN articles.workflow_link_status IS 'Status of article linking to intent workflow: not_linked, linking, linked, failed';
COMMENT ON COLUMN articles.linked_at IS 'Timestamp when article was linked to intent workflow';
COMMENT ON COLUMN intent_workflows.article_link_count IS 'Count of articles successfully linked to this workflow';
COMMENT ON COLUMN intent_workflows.article_linking_started_at IS 'Timestamp when article linking process started';
COMMENT ON COLUMN intent_workflows.article_linking_completed_at IS 'Timestamp when article linking process completed';
