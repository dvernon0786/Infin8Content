-- Epic 13: Phase 2 Advanced Features
-- Stories: 13-1 (news), 13-2 (listicle+comparison), 13-3 (youtube-to-blog), 13-5 (multi-language)
-- Migration: Add article_type, article_type_config, video_url, video_transcript to articles table

-- Add article_type column with enum-like CHECK constraint (avoids needing a new pg type)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (article_type IN ('standard', 'news', 'listicle_comparison', 'video_conversion'));

-- Add JSONB column to hold type-specific config payloads
-- news: { topic, country, time_range, article_focus }
-- listicle_comparison: { list_type, topic, items_to_include, comparison_criteria, include_comparison_table, include_pros_cons, include_pricing, editors_choice }
-- video_conversion: { video_url, include_transcript, include_timestamps, include_embedded_video, language }
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS article_type_config JSONB DEFAULT NULL;

-- Add video-specific columns (13-3)
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS video_transcript TEXT DEFAULT NULL;

-- Index for filtering by article type (useful for dashboards and analytics)
CREATE INDEX IF NOT EXISTS idx_articles_article_type ON articles (article_type);
