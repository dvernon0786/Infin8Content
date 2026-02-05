-- Create article_sections table for deterministic pipeline
-- Story B-1: Article Sections Data Model

CREATE TABLE article_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL,
  section_header TEXT NOT NULL,
  section_type TEXT NOT NULL,
  planner_payload JSONB NOT NULL DEFAULT '{}',
  research_payload JSONB,
  content_markdown TEXT,
  content_html TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'researching', 'researched', 'writing', 'completed', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (article_id, section_order)
);

-- Performance indexes
CREATE INDEX idx_article_sections_article_id ON article_sections(article_id);
CREATE INDEX idx_article_sections_status ON article_sections(status);
CREATE INDEX idx_article_sections_article_status ON article_sections(article_id, status);

-- RLS: Enable row level security
ALTER TABLE article_sections ENABLE ROW LEVEL SECURITY;

-- RLS: Organizations can only access their own article sections
-- This inherits isolation from the articles table
CREATE POLICY "Organizations can view their own article sections" ON article_sections
  FOR SELECT USING (
    article_id IN (
      SELECT id FROM articles 
      WHERE organization_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

CREATE POLICY "Organizations can insert their own article sections" ON article_sections
  FOR INSERT WITH CHECK (
    article_id IN (
      SELECT id FROM articles 
      WHERE organization_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

CREATE POLICY "Organizations can update their own article sections" ON article_sections
  FOR UPDATE USING (
    article_id IN (
      SELECT id FROM articles 
      WHERE organization_id = (current_setting('request.jwt.claims', true)::jsonb->>'org_id')::uuid
    )
  );

-- Comments for documentation
COMMENT ON TABLE article_sections IS 'Stores individual article sections for deterministic pipeline processing';
COMMENT ON COLUMN article_sections.planner_payload IS 'Structure and instructions from Planner Agent';
COMMENT ON COLUMN article_sections.research_payload IS 'Research results from Perplexity Sonar API';
COMMENT ON COLUMN article_sections.content_markdown IS 'Generated markdown content from Content Writing Agent';
COMMENT ON COLUMN article_sections.content_html IS 'Rendered HTML version of markdown content';
COMMENT ON COLUMN article_sections.status IS 'Processing status: pending → researching → researched → writing → completed/failed';
COMMENT ON COLUMN article_sections.error_details IS 'Error information if section processing failed';
