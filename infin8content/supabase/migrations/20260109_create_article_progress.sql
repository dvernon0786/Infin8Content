-- Create article_progress table for real-time progress tracking
-- Story 4a.6: Real-Time Progress Tracking and Updates

CREATE TABLE IF NOT EXISTS article_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'researching', 'writing', 'generating', 'completed', 'failed')),
  current_section INTEGER DEFAULT 1,
  total_sections INTEGER NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_stage TEXT NOT NULL,
  estimated_time_remaining INTEGER, -- seconds
  actual_time_spent INTEGER DEFAULT 0, -- seconds
  word_count INTEGER DEFAULT 0,
  citations_count INTEGER DEFAULT 0,
  api_cost DECIMAL(10,4) DEFAULT 0.0000,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_progress_article_id ON article_progress(article_id);
CREATE INDEX IF NOT EXISTS idx_article_progress_org_id ON article_progress(org_id);
CREATE INDEX IF NOT EXISTS idx_article_progress_status ON article_progress(status);
CREATE INDEX IF NOT EXISTS idx_article_progress_updated_at ON article_progress(updated_at);

-- Enable RLS (only if table exists and RLS is not already enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_progress' AND table_schema = 'public') THEN
        ALTER TABLE article_progress ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS Policies (create or replace)
DROP POLICY IF EXISTS "Users can view article progress in their org" ON article_progress;
CREATE POLICY "Users can view article progress in their org" ON article_progress
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert article progress in their org" ON article_progress;
CREATE POLICY "Users can insert article progress in their org" ON article_progress
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update article progress in their org" ON article_progress;
CREATE POLICY "Users can update article progress in their org" ON article_progress
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete article progress in their org" ON article_progress;
CREATE POLICY "Users can delete article progress in their org" ON article_progress
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (create or replace)
DROP TRIGGER IF EXISTS update_article_progress_updated_at ON article_progress;
CREATE TRIGGER update_article_progress_updated_at 
    BEFORE UPDATE ON article_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Real-time subscriptions enabled for this table
-- This will allow clients to subscribe to progress updates via Supabase realtime
