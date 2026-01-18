-- Research Infrastructure Foundation
-- Story 3.0: Research Infrastructure Foundation
-- Tier-1 Producer story for research data structures

-- Research Projects Table
CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword Research Results Table
CREATE TABLE IF NOT EXISTS keyword_research_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    search_volume BIGINT,
    keyword_difficulty INTEGER CHECK (keyword_difficulty >= 0 AND keyword_difficulty <= 100),
    cpc DECIMAL(10, 4),
    competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
    trend_data JSONB DEFAULT '{}',
    research_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api_source TEXT NOT NULL,
    api_cost DECIMAL(10, 6) DEFAULT 0,
    cached_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research Sources Table
CREATE TABLE IF NOT EXISTS research_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    keyword_research_result_id UUID NOT NULL REFERENCES keyword_research_results(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_title TEXT,
    source_description TEXT,
    relevance_score DECIMAL(3, 2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
    publication_date TIMESTAMP WITH TIME ZONE,
    author TEXT,
    domain TEXT,
    research_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api_source TEXT NOT NULL,
    api_cost DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Usage Tracking Table
CREATE TABLE IF NOT EXISTS research_api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_source TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research Cache Table
CREATE TABLE IF NOT EXISTS research_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    cache_type TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_projects_org_id ON research_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_user_id ON research_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(status);

CREATE INDEX IF NOT EXISTS idx_keyword_research_org_id ON keyword_research_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_user_id ON keyword_research_results(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_project_id ON keyword_research_results(research_project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_keyword ON keyword_research_results(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_research_cached_until ON keyword_research_results(cached_until);

CREATE INDEX IF NOT EXISTS idx_research_sources_org_id ON research_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_result_id ON research_sources(keyword_research_result_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_relevance ON research_sources(relevance_score);

CREATE INDEX IF NOT EXISTS idx_research_api_usage_org_id ON research_api_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_api_usage_user_id ON research_api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_research_api_usage_date ON research_api_usage(usage_date);

CREATE INDEX IF NOT EXISTS idx_research_cache_key ON research_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_research_cache_expires ON research_cache(expires_at);

-- Row Level Security
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_research_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own organization's research projects" ON research_projects
    FOR SELECT USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can insert their own organization's research projects" ON research_projects
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can update their own organization's research projects" ON research_projects
    FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can delete their own organization's research projects" ON research_projects
    FOR DELETE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can view their own organization's keyword research results" ON keyword_research_results
    FOR SELECT USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can insert their own organization's keyword research results" ON keyword_research_results
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can update their own organization's keyword research results" ON keyword_research_results
    FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can delete their own organization's keyword research results" ON keyword_research_results
    FOR DELETE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can view their own organization's research sources" ON research_sources
    FOR SELECT USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can insert their own organization's research sources" ON research_sources
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can update their own organization's research sources" ON research_sources
    FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can delete their own organization's research sources" ON research_sources
    FOR DELETE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can view their own organization's API usage" ON research_api_usage
    FOR SELECT USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can insert their own organization's API usage" ON research_api_usage
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can update their own organization's API usage" ON research_api_usage
    FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can delete their own organization's API usage" ON research_api_usage
    FOR DELETE USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Cache table is system-wide, no RLS needed
CREATE POLICY "Allow all operations on research cache" ON research_cache
    FOR ALL USING (true);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_research_projects_updated_at BEFORE UPDATE ON research_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_research_results_updated_at BEFORE UPDATE ON keyword_research_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_sources_updated_at BEFORE UPDATE ON research_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_api_usage_updated_at BEFORE UPDATE ON research_api_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_cache_updated_at BEFORE UPDATE ON research_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();