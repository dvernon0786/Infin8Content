-- Simple Database Alignment Analysis for Formatting Issues
-- Purpose: Quick analysis without complex schema dependencies
-- Date: 2026-01-13

-- =============================================================================
-- SECTION 1: BASIC TABLE STRUCTURE CHECK
-- =============================================================================

-- Check what tables exist and their basic structure
SELECT 
    'TABLE STRUCTURE' as analysis_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('articles', 'article_sections', 'research_sources', 'article_quality_checks')
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 2: ARTICLES OVERVIEW
-- =============================================================================

-- Basic articles overview
SELECT 
    'ARTICLES OVERVIEW' as analysis_type,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_articles,
    COUNT(CASE WHEN status = 'generating' THEN 1 END) as generating_articles,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_articles,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_articles,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_articles
FROM articles;

-- =============================================================================
-- SECTION 3: SECTIONS ANALYSIS
-- =============================================================================

-- Basic sections analysis
SELECT 
    'SECTIONS ANALYSIS' as analysis_type,
    COUNT(*) as total_sections,
    COUNT(DISTINCT article_id) as articles_with_sections,
    COUNT(CASE WHEN content IS NOT NULL THEN 1 END) as sections_with_content,
    ROUND(AVG(LENGTH(COALESCE(content, ''))), 2) as avg_content_length,
    COUNT(CASE WHEN LENGTH(content) > 5000 THEN 1 END) as long_sections,
    COUNT(CASE WHEN LENGTH(content) < 50 THEN 1 END) as short_sections
FROM article_sections;

-- =============================================================================
-- SECTION 4: FORMATTING PATTERNS IN SECTIONS
-- =============================================================================

-- Look for common formatting patterns
SELECT 
    'FORMATTING PATTERNS' as analysis_type,
    'MARKDOWN_LINKS' as pattern_type,
    COUNT(DISTINCT article_id) as articles_with_pattern,
    COUNT(*) as total_occurrences
FROM article_sections 
WHERE content LIKE '%[%' AND content LIKE '%]%' AND content LIKE '%(%' AND content LIKE '%)%'

UNION ALL

SELECT 
    'FORMATTING PATTERNS' as analysis_type,
    'HTML_TAGS' as pattern_type,
    COUNT(DISTINCT article_id) as articles_with_pattern,
    COUNT(*) as total_occurrences
FROM article_sections 
WHERE content LIKE '%<%' AND content LIKE '%>%'

UNION ALL

SELECT 
    'FORMATTING PATTERNS' as analysis_type,
    'HEADERS' as pattern_type,
    COUNT(DISTINCT article_id) as articles_with_pattern,
    COUNT(*) as total_occurrences
FROM article_sections 
WHERE content LIKE '%##%'

UNION ALL

SELECT 
    'FORMATTING PATTERNS' as analysis_type,
    'REFERENCES' as pattern_type,
    COUNT(DISTINCT article_id) as articles_with_pattern,
    COUNT(*) as total_occurrences
FROM article_sections 
WHERE content LIKE '%References%';

-- =============================================================================
-- SECTION 5: RESEARCH SOURCES ANALYSIS
-- =============================================================================

-- Research sources overview
SELECT 
    'RESEARCH SOURCES' as analysis_type,
    COUNT(*) as total_sources,
    COUNT(DISTINCT article_id) as articles_with_sources,
    COUNT(CASE WHEN url IS NOT NULL AND url != '' THEN 1 END) as sources_with_url,
    COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as sources_with_title,
    COUNT(CASE WHEN url LIKE '%[%' OR url LIKE '%]%' THEN 1 END) as urls_with_brackets,
    COUNT(CASE WHEN title LIKE '%[%' OR title LIKE '%]%' THEN 1 END) as titles_with_brackets
FROM research_sources;

-- =============================================================================
-- SECTION 6: FAILED ARTICLES ANALYSIS
-- =============================================================================

-- Failed articles and error patterns
SELECT 
    'FAILED ARTICLES' as analysis_type,
    COUNT(*) as failed_articles,
    COUNT(CASE WHEN error_details IS NOT NULL AND error_details != '' THEN 1 END) as with_error_details,
    COUNT(CASE WHEN error_details LIKE '%format%' THEN 1 END) as format_errors,
    COUNT(CASE WHEN error_details LIKE '%citation%' THEN 1 END) as citation_errors,
    COUNT(CASE WHEN error_details LIKE '%markdown%' THEN 1 END) as markdown_errors,
    COUNT(CASE WHEN error_details LIKE '%html%' THEN 1 END) as html_errors
FROM articles 
WHERE status = 'failed';

-- =============================================================================
-- SECTION 7: RECENT ACTIVITY
-- =============================================================================

-- Recent articles (last 24 hours)
SELECT 
    'RECENT ACTIVITY' as analysis_type,
    COUNT(*) as recent_articles,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_recent,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_recent,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM article_sections s WHERE s.article_id = a.id AND s.content LIKE '%[%' AND s.content LIKE '%]%' AND s.content LIKE '%(%' AND s.content LIKE '%)%') THEN 1 END) as with_citations,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM article_sections s WHERE s.article_id = a.id AND s.content LIKE '%## References%') THEN 1 END) as with_references
FROM articles a
WHERE a.created_at >= NOW() - INTERVAL '24 hours';

-- =============================================================================
-- SECTION 8: SAMPLE CONTENT PREVIEW
-- =============================================================================

-- Sample content from recent articles
SELECT 
    'SAMPLE CONTENT' as analysis_type,
    a.id as article_id,
    a.status,
    s.section_index,
    LEFT(s.content, 200) as content_preview,
    LENGTH(s.content) as content_length,
    CASE 
        WHEN s.content LIKE '%[%' AND s.content LIKE '%]%' AND s.content LIKE '%(%' AND s.content LIKE '%)%' THEN 'HAS_CITATIONS'
        ELSE 'NO_CITATIONS'
    END as citation_status
FROM articles a
JOIN article_sections s ON s.article_id = a.id
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
    AND s.content IS NOT NULL 
    AND s.content != ''
ORDER BY a.created_at DESC, s.section_index
LIMIT 10;

-- =============================================================================
-- SECTION 9: ORPHANED RECORDS CHECK
-- =============================================================================

-- Check for orphaned records
SELECT 
    'ORPHANED RECORDS' as analysis_type,
    'SECTIONS' as record_type,
    COUNT(*) as orphaned_count
FROM article_sections s
LEFT JOIN articles a ON s.article_id = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 
    'ORPHANED RECORDS' as analysis_type,
    'SOURCES' as record_type,
    COUNT(*) as orphaned_count
FROM research_sources r
LEFT JOIN articles a ON r.article_id = a.id
WHERE a.id IS NULL;
