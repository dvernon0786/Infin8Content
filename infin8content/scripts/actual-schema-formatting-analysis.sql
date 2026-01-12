-- Actual Schema Formatting Analysis
-- Purpose: Analyze formatting issues based on real database structure
-- Date: 2026-01-13
-- Schema: articles.sections (JSONB), tavily_research_cache (JSONB)

-- =============================================================================
-- SECTION 1: ARTICLES OVERVIEW
-- =============================================================================

SELECT 
    'ARTICLES OVERVIEW' as analysis_type,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_articles,
    COUNT(CASE WHEN status = 'generating' THEN 1 END) as generating_articles,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_articles,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_articles,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_articles,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'array' THEN 1 END) as articles_with_array_sections,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'object' THEN 1 END) as articles_with_object_sections,
    COUNT(CASE WHEN sections IS NOT NULL THEN 1 END) as articles_with_sections_data
FROM articles;

-- =============================================================================
-- SECTION 2: SECTIONS JSONB ANALYSIS
-- =============================================================================

-- Analyze sections structure and content
SELECT 
    'SECTIONS STRUCTURE' as analysis_type,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN sections IS NOT NULL THEN 1 END) as has_sections_data,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'array' THEN 1 END) as sections_is_array,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'object' THEN 1 END) as sections_is_object,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'array' AND jsonb_array_length(sections) > 0 THEN 1 END) as has_array_sections,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'array' THEN jsonb_array_length(sections) END) as total_sections_count
FROM articles;

-- =============================================================================
-- SECTION 3: CONTENT FORMATTING ANALYSIS (FROM JSONB)
-- =============================================================================

-- Extract content from sections JSONB and analyze formatting (only for array sections)
SELECT 
    'CONTENT FORMATTING ANALYSIS' as analysis_type,
    COUNT(DISTINCT a.id) as articles_with_content,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%<%' AND section->>'content' LIKE '%>%' THEN a.id END) as has_html_tags,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' AND section->>'content' LIKE '%(%' AND section->>'content' LIKE '%)%' THEN a.id END) as has_markdown_links,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%##%' THEN a.id END) as has_headers,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%References%' THEN a.id END) as has_references,
    COUNT(DISTINCT CASE WHEN LENGTH(section->>'content') > 5000 THEN a.id END) as long_content_articles,
    ROUND(AVG(LENGTH(section->>'content')), 2) as avg_content_length
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND jsonb_typeof(a.sections) = 'array'
    AND section->>'content' IS NOT NULL 
    AND section->>'content' != '';

-- =============================================================================
-- SECTION 4: FORMATTING PROBLEM PATTERNS
-- =============================================================================

-- Specific formatting problems in section content
SELECT 
    'FORMATTING PROBLEMS' as analysis_type,
    problem_type,
    COUNT(DISTINCT article_id) as affected_articles,
    COUNT(*) as total_occurrences
FROM (
    SELECT 
        a.id as article_id,
        CASE 
            WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' AND section->>'content' LIKE '%(%' AND section->>'content' LIKE '%)%' 
                 AND section->>'content' NOT LIKE '%\[%[^]]*\]([^)]*\)%' THEN 'MALFORMED_MARKDOWN_LINKS'
            WHEN section->>'content' LIKE '%<%' AND section->>'content' LIKE '%>%' 
                 AND section->>'content' NOT LIKE '%<[a-zA-Z][^>]*>%' THEN 'MALFORMED_HTML_TAGS'
            WHEN section->>'content' LIKE '%. %' AND section->>'content' LIKE '%.%' 
                 AND LENGTH(SUBSTRING(section->>'content' FROM '\. \.')) > 0 THEN 'DOUBLE_PERIODS'
            WHEN section->>'content' LIKE '%  %' THEN 'EXTRA_SPACES'
            WHEN section->>'content' LIKE '%[[]%' OR section->>'content' LIKE '%[]]%' THEN 'BRACKET_ISSUES'
            ELSE 'OTHER_PATTERN'
        END as problem_type
    FROM articles a,
         jsonb_array_elements(a.sections) as section
    WHERE a.sections IS NOT NULL 
        AND jsonb_typeof(a.sections) = 'array'
        AND section->>'content' IS NOT NULL 
        AND section->>'content' != ''
) pattern_analysis
GROUP BY problem_type
ORDER BY affected_articles DESC, total_occurrences DESC;

-- =============================================================================
-- SECTION 5: RESEARCH CACHE ANALYSIS
-- =============================================================================

-- Analyze research cache for citation formatting issues
SELECT 
    'RESEARCH CACHE ANALYSIS' as analysis_type,
    COUNT(*) as total_cached_research,
    COUNT(DISTINCT organization_id) as organizations_with_cache,
    COUNT(CASE WHEN research_results IS NOT NULL THEN 1 END) as has_results,
    COUNT(CASE WHEN research_results IS NOT NULL AND jsonb_typeof(research_results) = 'array' THEN 1 END) as results_is_array,
    COUNT(CASE WHEN research_results IS NOT NULL AND jsonb_typeof(research_results) = 'array' THEN jsonb_array_length(research_results) END) as total_sources_count
FROM tavily_research_cache;

-- =============================================================================
-- SECTION 6: CITATION FORMATTING IN RESEARCH CACHE
-- =============================================================================

-- Check for formatting issues in cached research sources
SELECT 
    'CITATION FORMATTING ISSUES' as analysis_type,
    COUNT(DISTINCT organization_id) as orgs_with_issues,
    COUNT(*) as total_sources_with_issues,
    COUNT(CASE WHEN source->>'url' LIKE '%[%' OR source->>'url' LIKE '%]%' THEN 1 END) as urls_with_brackets,
    COUNT(CASE WHEN source->>'title' LIKE '%[%' OR source->>'title' LIKE '%]%' THEN 1 END) as titles_with_brackets,
    COUNT(CASE WHEN source->>'url' IS NULL OR source->>'url' = '' THEN 1 END) as missing_urls,
    COUNT(CASE WHEN source->>'title' IS NULL OR source->>'title' = '' THEN 1 END) as missing_titles,
    COUNT(CASE WHEN source->>'url' NOT LIKE 'http%' AND source->>'url' != '' THEN 1 END) as invalid_urls
FROM tavily_research_cache trc,
     jsonb_array_elements(trc.research_results) as source
WHERE trc.research_results IS NOT NULL 
    AND jsonb_typeof(trc.research_results) = 'array'
    AND source IS NOT NULL;

-- =============================================================================
-- SECTION 7: FAILED ARTICLES ANALYSIS
-- =============================================================================

-- Analyze failed articles and error patterns
SELECT 
    'FAILED ARTICLES ANALYSIS' as analysis_type,
    COUNT(*) as failed_articles,
    COUNT(CASE WHEN error_details IS NOT NULL THEN 1 END) as with_error_details,
    COUNT(CASE WHEN error_details->>'type' LIKE '%format%' THEN 1 END) as format_errors,
    COUNT(CASE WHEN error_details->>'type' LIKE '%citation%' THEN 1 END) as citation_errors,
    COUNT(CASE WHEN error_details->>'type' LIKE '%markdown%' THEN 1 END) as markdown_errors,
    COUNT(CASE WHEN error_details->>'type' LIKE '%html%' THEN 1 END) as html_errors,
    COUNT(CASE WHEN error_details->>'message' LIKE '%content%' THEN 1 END) as content_errors
FROM articles 
WHERE status = 'failed';

-- =============================================================================
-- SECTION 8: RECENT ARTICLES FORMATTING CHECK
-- =============================================================================

-- Recent articles (last 24 hours) formatting status
SELECT 
    'RECENT ARTICLES FORMATTING' as analysis_type,
    COUNT(DISTINCT a.id) as recent_articles,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' AND section->>'content' LIKE '%(%' AND section->>'content' LIKE '%)%' THEN a.id END) as has_citations,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%## References%' THEN a.id END) as has_references,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%<%' AND section->>'content' LIKE '%>%' THEN a.id END) as has_html,
    COUNT(DISTINCT CASE WHEN LENGTH(section->>'content') > 5000 THEN a.id END) as long_content,
    ROUND(AVG(LENGTH(section->>'content')), 2) as avg_content_length
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.created_at >= NOW() - INTERVAL '24 hours' 
    AND a.sections IS NOT NULL 
    AND jsonb_typeof(a.sections) = 'array'
    AND section->>'content' IS NOT NULL;

-- =============================================================================
-- SECTION 9: SAMPLE CONTENT PREVIEW
-- =============================================================================

-- Sample content from recent articles for manual review
SELECT 
    'SAMPLE CONTENT PREVIEW' as analysis_type,
    a.id as article_id,
    a.status,
    (section->>'section_index') as section_index,
    (section->>'title') as section_title,
    LENGTH(section->>'content') as content_length,
    CASE 
        WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' AND section->>'content' LIKE '%(%' AND section->>'content' LIKE '%)%' THEN 'HAS_CITATIONS'
        ELSE 'NO_CITATIONS'
    END as citation_status,
    CASE 
        WHEN section->>'content' LIKE '%## References%' THEN 'HAS_REFERENCES'
        ELSE 'NO_REFERENCES'
    END as reference_status,
    LEFT(section->>'content', 200) as content_preview
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.sections IS NOT NULL 
    AND jsonb_typeof(a.sections) = 'array'
    AND section->>'content' IS NOT NULL 
    AND section->>'content' != ''
ORDER BY a.created_at DESC, (section->>'section_index')::numeric
LIMIT 10;

-- =============================================================================
-- SECTION 10: ARTICLE PROGRESS ANALYSIS
-- =============================================================================

-- Analyze article progress table for formatting-related issues
SELECT 
    'ARTICLE PROGRESS ANALYSIS' as analysis_type,
    COUNT(*) as total_progress_records,
    COUNT(DISTINCT article_id) as unique_articles,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_progress,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_progress,
    COUNT(CASE WHEN error_message IS NOT NULL AND error_message != '' THEN 1 END) as with_errors,
    COUNT(CASE WHEN error_message LIKE '%format%' THEN 1 END) as format_errors,
    COUNT(CASE WHEN error_message LIKE '%citation%' THEN 1 END) as citation_errors,
    ROUND(AVG(word_count), 2) as avg_word_count,
    ROUND(AVG(citations_count), 2) as avg_citations_count
FROM article_progress;

-- =============================================================================
-- EXECUTION NOTES
-- =============================================================================

-- This query is designed for the actual database structure:
-- - articles.sections is a JSONB array containing section objects
-- - tavily_research_cache.research_results is a JSONB array containing source objects
-- - Content is stored in section->>'content' fields within the JSONB
-- - Error details are stored in JSONB format in error_details column

-- Expected output will show:
-- 1. Overall article statistics and section distribution
-- 2. Content formatting patterns and issues
-- 3. Research cache citation formatting problems
-- 4. Failed articles error patterns
-- 5. Recent articles formatting status
-- 6. Sample content for manual review
-- 7. Article progress tracking analysis
