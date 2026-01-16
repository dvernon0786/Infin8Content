-- Create recommendations table for analytics
-- Story 32-3: Analytics Dashboard and Reporting
-- Task 3.2: Create recommendation engine based on metrics

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recommendation_id VARCHAR(255) UNIQUE NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('performance', 'ux', 'maintenance', 'growth')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action TEXT NOT NULL,
  impact VARCHAR(20) NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  effort VARCHAR(20) NOT NULL CHECK (effort IN ('low', 'medium', 'high')),
  expected_improvement TEXT NOT NULL,
  metrics TEXT[] NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  implemented BOOLEAN DEFAULT FALSE,
  implementation_date TIMESTAMPTZ,
  actual_improvement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_shares table for report sharing
-- Story 32-3: Analytics Dashboard and Reporting
-- Task 2.2: Add data export capabilities (CSV, PDF)

CREATE TABLE IF NOT EXISTS analytics_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  report_data JSONB NOT NULL,
  recipients TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  message TEXT,
  include_password BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendations_organization_id ON recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_implemented ON recommendations(implemented);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_shares_organization_id ON analytics_shares(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_shares_token ON analytics_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_analytics_shares_expires_at ON analytics_shares(expires_at);

-- Enable Row Level Security
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations
CREATE POLICY "Users can view recommendations for their organization" ON recommendations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recommendations for their organization" ON recommendations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recommendations for their organization" ON recommendations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recommendations for their organization" ON recommendations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for analytics_shares
CREATE POLICY "Users can view shares for their organization" ON analytics_shares
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their organization" ON analytics_shares
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_recommendations_updated_at 
  BEFORE UPDATE ON recommendations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment access count
CREATE OR REPLACE FUNCTION increment_share_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to increment access count when share is accessed
CREATE TRIGGER increment_analytics_shares_access_count 
  BEFORE UPDATE ON analytics_shares 
  FOR EACH ROW 
  WHEN (OLD.access_count IS DISTINCT FROM NEW.access_count)
  EXECUTE FUNCTION increment_share_access();
