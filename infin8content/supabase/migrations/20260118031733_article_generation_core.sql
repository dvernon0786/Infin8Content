-- Article Generation Core
-- Story 4A-1: Article Generation Initiation and Queue Setup
-- Tier-1 Producer story for article generation infrastructure

-- Articles Table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    title TEXT,
    target_word_count INTEGER DEFAULT 2000,
    writing_style TEXT DEFAULT 'professional',
    target_audience TEXT DEFAULT 'general',
    custom_instructions TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'generating', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_section TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    generated_content JSONB DEFAULT '{}',
    outline JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    credits_used INTEGER DEFAULT 1,
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    actual_completion_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article Sections Table
CREATE TABLE IF NOT EXISTS article_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('introduction', 'h2', 'h3', 'conclusion', 'faq')),
    section_title TEXT NOT NULL,
    section_order INTEGER NOT NULL,
    content TEXT,
    word_count INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    research_data JSONB DEFAULT '{}',
    citations JSONB DEFAULT '[]',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article Generation Queue Table
CREATE TABLE IF NOT EXISTS article_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    worker_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article Usage Tracking Table
CREATE TABLE IF NOT EXISTS article_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    credits_used INTEGER NOT NULL,
    generation_time_ms INTEGER,
    api_costs DECIMAL(10, 6) DEFAULT 0,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_org_id ON articles(organization_id);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_keyword ON articles(keyword);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_status_progress ON articles(status, progress);

CREATE INDEX IF NOT EXISTS idx_article_sections_article_id ON article_sections(article_id);
CREATE INDEX IF NOT EXISTS idx_article_sections_status ON article_sections(status);
CREATE INDEX IF NOT EXISTS idx_article_sections_type_order ON article_sections(section_type, section_order);

CREATE INDEX IF NOT EXISTS idx_article_generation_queue_status ON article_generation_queue(status);
CREATE INDEX IF NOT EXISTS idx_article_generation_queue_position ON article_generation_queue(queue_position);
CREATE INDEX IF NOT EXISTS idx_article_generation_queue_worker ON article_generation_queue(worker_id);

CREATE INDEX IF NOT EXISTS idx_article_usage_org_id ON article_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_article_usage_user_id ON article_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_article_usage_date ON article_usage(usage_date);

-- Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own organization's articles" ON articles
    FOR SELECT USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can insert their own organization's articles" ON articles
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can update their own organization's articles" ON articles
    FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can delete their own organization's articles" ON articles
    FOR DELETE USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can view their own organization's article sections" ON article_sections
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_sections.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can insert their own organization's article sections" ON article_sections
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_sections.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can update their own organization's article sections" ON article_sections
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_sections.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can delete their own organization's article sections" ON article_sections
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_sections.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can view their own organization's queue entries" ON article_generation_queue
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_generation_queue.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can insert their own organization's queue entries" ON article_generation_queue
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_generation_queue.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can update their own organization's queue entries" ON article_generation_queue
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_generation_queue.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can delete their own organization's queue entries" ON article_generation_queue
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_generation_queue.article_id 
        AND articles.organization_id = current_setting('app.current_org_id')::uuid
    ));

CREATE POLICY "Users can view their own organization's article usage" ON article_usage
    FOR SELECT USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "Users can insert their own organization's article usage" ON article_usage
    FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

-- Updated timestamp triggers
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_sections_updated_at BEFORE UPDATE ON article_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_generation_queue_updated_at BEFORE UPDATE ON article_generation_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Queue position management function
CREATE OR REPLACE FUNCTION assign_queue_position()
RETURNS TRIGGER AS $$
BEGIN
    -- Assign the next available queue position
    NEW.queue_position = (
        SELECT COALESCE(MAX(queue_position), 0) + 1
        FROM article_generation_queue
        WHERE status = 'queued'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER assign_queue_position_trigger BEFORE INSERT ON article_generation_queue
    FOR EACH ROW EXECUTE FUNCTION assign_queue_position();

-- Article progress calculation function
CREATE OR REPLACE FUNCTION calculate_article_progress(article_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_sections INTEGER;
    completed_sections INTEGER;
BEGIN
    -- Count total sections
    SELECT COUNT(*) INTO total_sections
    FROM article_sections
    WHERE article_id = article_uuid;
    
    -- Count completed sections
    SELECT COUNT(*) INTO completed_sections
    FROM article_sections
    WHERE article_id = article_uuid AND status = 'completed';
    
    -- Calculate progress percentage
    IF total_sections = 0 THEN
        RETURN 0;
    ELSE
        RETURN (completed_sections * 100) / total_sections;
    END IF;
END;
$$ language 'plpgsql';

-- Function to update article progress
CREATE OR REPLACE FUNCTION update_article_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update article progress based on sections
    UPDATE articles
    SET progress = calculate_article_progress(NEW.article_id),
        updated_at = NOW()
    WHERE id = NEW.article_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_article_progress_trigger AFTER UPDATE ON article_sections
    FOR EACH ROW EXECUTE FUNCTION update_article_progress();

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_statistics(org_uuid UUID)
RETURNS TABLE(
    queued_count INTEGER,
    processing_count INTEGER,
    completed_count INTEGER,
    failed_count INTEGER,
    average_wait_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE status = 'queued')::INTEGER as queued_count,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing_count,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_count,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_count,
        AVG(completed_at - created_at) as average_wait_time
    FROM article_generation_queue
    WHERE EXISTS (
        SELECT 1 FROM articles 
        WHERE articles.id = article_generation_queue.article_id 
        AND articles.organization_id = org_uuid
    );
END;
$$ language 'plpgsql';