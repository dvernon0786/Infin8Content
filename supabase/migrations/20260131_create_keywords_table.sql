-- Migration: Create keywords table for seed keyword storage
-- Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
-- Date: 2026-01-31

-- Create keywords table for storing seed keywords extracted from competitors
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_url_id UUID NOT NULL REFERENCES organization_competitors(id) ON DELETE CASCADE,
  seed_keyword TEXT NOT NULL,
  keyword TEXT NOT NULL,
  search_volume INTEGER NOT NULL DEFAULT 0,
  competition_level TEXT NOT NULL CHECK (competition_level IN ('low', 'medium', 'high')),
  competition_index INTEGER NOT NULL DEFAULT 0,
  keyword_difficulty INTEGER NOT NULL DEFAULT 0,
  cpc DECIMAL(10, 2),
  longtail_status TEXT NOT NULL DEFAULT 'not_started' CHECK (longtail_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  subtopics_status TEXT NOT NULL DEFAULT 'not_started' CHECK (subtopics_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  article_status TEXT NOT NULL DEFAULT 'not_started' CHECK (article_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_keywords_organization_id 
ON keywords(organization_id);

CREATE INDEX IF NOT EXISTS idx_keywords_competitor_url_id 
ON keywords(competitor_url_id);

CREATE INDEX IF NOT EXISTS idx_keywords_organization_competitor 
ON keywords(organization_id, competitor_url_id);

CREATE INDEX IF NOT EXISTS idx_keywords_search_volume 
ON keywords(search_volume DESC);

CREATE INDEX IF NOT EXISTS idx_keywords_longtail_status 
ON keywords(longtail_status) 
WHERE longtail_status != 'completed';

CREATE INDEX IF NOT EXISTS idx_keywords_subtopics_status 
ON keywords(subtopics_status) 
WHERE subtopics_status != 'completed';

CREATE INDEX IF NOT EXISTS idx_keywords_article_status 
ON keywords(article_status) 
WHERE article_status != 'completed';

-- Add comments for documentation
COMMENT ON TABLE keywords IS 'Stores seed keywords extracted from competitor URLs via DataForSEO, forming the foundation of the hub-and-spoke SEO model';
COMMENT ON COLUMN keywords.seed_keyword IS 'The original seed keyword extracted from DataForSEO';
COMMENT ON COLUMN keywords.keyword IS 'Normalized keyword field (same as seed_keyword at this stage)';
COMMENT ON COLUMN keywords.search_volume IS 'Monthly search volume from DataForSEO';
COMMENT ON COLUMN keywords.competition_level IS 'Competition level (low/medium/high) derived from competition_index';
COMMENT ON COLUMN keywords.competition_index IS 'Competition index from DataForSEO (0-100)';
COMMENT ON COLUMN keywords.keyword_difficulty IS 'Keyword difficulty score from DataForSEO';
COMMENT ON COLUMN keywords.longtail_status IS 'Status of long-tail keyword expansion (not_started/in_progress/completed/failed)';
COMMENT ON COLUMN keywords.subtopics_status IS 'Status of subtopic generation (not_started/in_progress/completed/failed)';
COMMENT ON COLUMN keywords.article_status IS 'Status of article generation (not_started/in_progress/completed/failed)';

-- Enable RLS for security
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS keywords_org_access ON keywords;

-- Create RLS policy for organization access
-- Users can only access keywords from their organization
CREATE POLICY keywords_org_access ON keywords
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM public.users 
      WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM public.users 
      WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL
    )
  );
