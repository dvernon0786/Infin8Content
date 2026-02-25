-- 1. DROP legacy queue tables
DROP TABLE IF EXISTS article_generation_queue CASCADE;
DROP TABLE IF EXISTS article_usage CASCADE;
DROP TABLE IF EXISTS article_progress CASCADE;

-- 2. ENSURE article_sections exists (inherited from legacy system)
CREATE TABLE IF NOT EXISTS article_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL CHECK (section_type IN ('introduction', 'h2', 'h3', 'conclusion', 'faq')),
    section_header TEXT NOT NULL,
    section_order INTEGER NOT NULL,
    content_markdown TEXT,
    content_html TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'processing', 'researching', 'researched', 'writing', 'completed', 'failed')),
    research_payload JSONB DEFAULT '{}'::jsonb,
    planner_payload JSONB DEFAULT '{}'::jsonb,
    error_details JSONB DEFAULT '{}'::jsonb,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NORMALIZE articles table
-- ... (rest of the migration)
-- Ensure org_id exists (it might be organization_id in some migrations)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'organization_id') THEN
        ALTER TABLE articles RENAME COLUMN organization_id TO org_id;
    END IF;
END $$;

-- Ensure intent_workflow_id exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'intent_workflow_id') THEN
        ALTER TABLE articles ADD COLUMN intent_workflow_id UUID REFERENCES intent_workflows(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add or normalize required columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS outline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_structure JSONB DEFAULT '{}'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE articles ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMP WITH TIME ZONE;

-- Remove legacy/conflicting columns
ALTER TABLE articles DROP COLUMN IF EXISTS generated_content;
ALTER TABLE articles DROP COLUMN IF EXISTS progress;
ALTER TABLE articles DROP COLUMN IF EXISTS current_section;
ALTER TABLE articles DROP COLUMN IF EXISTS error_message;
ALTER TABLE articles DROP COLUMN IF EXISTS credits_used;
ALTER TABLE articles DROP COLUMN IF EXISTS estimated_completion_time;
ALTER TABLE articles DROP COLUMN IF EXISTS actual_completion_time;
ALTER TABLE articles DROP COLUMN IF EXISTS inngest_event_id;
ALTER TABLE articles DROP COLUMN IF EXISTS word_count;
ALTER TABLE articles DROP COLUMN IF EXISTS reading_time_minutes;
ALTER TABLE articles DROP COLUMN IF EXISTS content_html;
ALTER TABLE articles DROP COLUMN IF EXISTS content_markdown;

-- 3. NORMALIZE article_sections table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'article_sections' AND column_name = 'section_title') THEN
        ALTER TABLE article_sections RENAME COLUMN section_title TO section_header;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'article_sections' AND column_name = 'content') THEN
        ALTER TABLE article_sections RENAME COLUMN content TO content_markdown;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'article_sections' AND column_name = 'research_data') THEN
        ALTER TABLE article_sections RENAME COLUMN research_data TO research_payload;
    END IF;
END $$;

ALTER TABLE article_sections ADD COLUMN IF NOT EXISTS content_html TEXT;
ALTER TABLE article_sections ADD COLUMN IF NOT EXISTS planner_payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE article_sections ADD COLUMN IF NOT EXISTS error_details JSONB DEFAULT '{}'::jsonb;

-- 4. Clean up RLS to match org_id
DROP POLICY IF EXISTS "Users can view their own organization's articles" ON articles;
CREATE POLICY "Users can view their own organization's articles" ON articles
    FOR SELECT USING (org_id = current_setting('app.current_org_id')::uuid);

DROP POLICY IF EXISTS "Users can insert their own organization's articles" ON articles;
CREATE POLICY "Users can insert their own organization's articles" ON articles
    FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id')::uuid);

DROP POLICY IF EXISTS "Users can update their own organization's articles" ON articles;
CREATE POLICY "Users can update their own organization's articles" ON articles
    FOR UPDATE USING (org_id = current_setting('app.current_org_id')::uuid);

-- 5. Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
