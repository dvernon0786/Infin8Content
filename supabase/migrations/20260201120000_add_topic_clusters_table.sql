-- Create topic_clusters table for keyword clustering
-- This implements the hub-and-spoke topic model for Story 36.2

CREATE TABLE IF NOT EXISTS topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES intent_workflows(id) ON DELETE CASCADE,
  hub_keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  spoke_keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each spoke keyword belongs to exactly one cluster per workflow
  UNIQUE (workflow_id, spoke_keyword_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_clusters_workflow_id ON topic_clusters(workflow_id);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_hub_keyword_id ON topic_clusters(hub_keyword_id);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_spoke_keyword_id ON topic_clusters(spoke_keyword_id);

-- Add comments for documentation
COMMENT ON TABLE topic_clusters IS 'Hub-and-spoke topic clusters for keyword organization';
COMMENT ON COLUMN topic_clusters.workflow_id IS 'Reference to the intent workflow';
COMMENT ON COLUMN topic_clusters.hub_keyword_id IS 'Primary hub keyword for the cluster';
COMMENT ON COLUMN topic_clusters.spoke_keyword_id IS 'Supporting spoke keyword assigned to this hub';
COMMENT ON COLUMN topic_clusters.similarity_score IS 'Semantic similarity score between hub and spoke (0-1)';
