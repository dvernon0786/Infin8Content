-- Database Alignment Analysis for Formatting Issues
-- Purpose: Analyze articles table for formatting problems and alignment issues
-- Date: 2026-01-13
-- Status: Manual execution required

-- =============================================================================
-- SECTION 1: ARTICLES OVERVIEW AND STATUS
-- =============================================================================

-- Basic articles overview
SELECT 
    'ARTICLES OVERVIEW' as analysis_type,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_articles,
    COUNT(CASE WHEN status = 'generating' THEN 1 END) as generating_articles,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_articles,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_articles,
    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, created_at) - created_at))/60), 2) as avg_generation_time_minutes
FROM articles;

-- =============================================================================
-- SECTION 2: CONTENT FORMATTING ANALYSIS
-- =============================================================================

-- Articles with potential formatting issues (from sections)
SELECT 
    'CONTENT FORMATTING ISSUES' as analysis_type,
    COUNT(DISTINCT s.article_id) as total_articles_with_issues,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%<%' AND s.content LIKE '%>%' THEN s.article_id END) as has_html_tags,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%[%' AND s.content LIKE '%]%' AND s.content LIKE '%(%' AND s.content LIKE '%)%' THEN s.article_id END) as has_markdown_links,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%##%' THEN s.article_id END) as has_headers,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%\n\n%' THEN s.article_id END) as has_paragraph_breaks,
    COUNT(DISTINCT CASE WHEN LENGTH(s.content) > 10000 THEN s.article_id END) as very_long_content,
    COUNT(DISTINCT CASE WHEN LENGTH(s.content) < 100 THEN s.article_id END) as very_short_content
FROM article_sections s
WHERE s.content IS NOT NULL AND s.content != '';

-- Specific formatting problem patterns in sections
SELECT 
    'FORMATTING PROBLEM PATTERNS' as analysis_type,
    pattern_type,
    COUNT(DISTINCT article_id) as affected_articles,
    COUNT(*) as total_occurrences
FROM (
    SELECT 
        s.article_id,
        CASE 
            WHEN s.content LIKE '%[%' AND s.content LIKE '%]%' AND s.content LIKE '%(%' AND s.content LIKE '%)%' AND s.content NOT LIKE '%\[%[^]]*\]([^)]*\)%' THEN 'MALFORMED_MARKDOWN_LINKS'
            WHEN s.content LIKE '%<%' AND s.content LIKE '%>%' AND s.content NOT LIKE '%<[a-zA-Z][^>]*>%' THEN 'MALFORMED_HTML_TAGS'
            WHEN s.content LIKE '%. %' AND s.content LIKE '%.%' AND LENGTH(SUBSTRING(s.content FROM '\. \.')) > 0 THEN 'DOUBLE_PERIODS'
            WHEN s.content LIKE '%  %' THEN 'EXTRA_SPACES'
            WHEN s.content LIKE '%\n[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n%' THEN 'EXCESSIVE_LINE_BREAKS'
            WHEN s.content LIKE '%[[]%' OR s.content LIKE '%[]]%' THEN 'BRACKET_ISSUES'
            ELSE 'OTHER_PATTERN'
        END as pattern_type
    FROM article_sections s
    WHERE s.content IS NOT NULL AND s.content != ''
) pattern_analysis
GROUP BY pattern_type
ORDER BY affected_articles DESC, total_occurrences DESC;

-- =============================================================================
-- SECTION 3: SECTIONS FORMATTING ANALYSIS
-- =============================================================================

-- Sections with formatting issues
SELECT 
    'SECTIONS FORMATTING ANALYSIS' as analysis_type,
    COUNT(*) as total_sections,
    COUNT(CASE WHEN content LIKE '%<%' AND content LIKE '%>%' THEN 1 END) as sections_with_html,
    COUNT(CASE WHEN content LIKE '%[%' AND content LIKE '%]%' THEN 1 END) as sections_with_links,
    COUNT(CASE WHEN LENGTH(content) > 2000 THEN 1 END) as long_sections,
    COUNT(CASE WHEN LENGTH(content) < 50 THEN 1 END) as short_sections,
    ROUND(AVG(LENGTH(content)), 2) as avg_section_length
FROM article_sections 
WHERE content IS NOT NULL AND content != '';

-- Section content problems
SELECT 
    'SECTION CONTENT PROBLEMS' as analysis_type,
    problem_type,
    COUNT(*) as occurrences
FROM (
    SELECT 
        CASE 
            WHEN content LIKE '%[%' AND content LIKE '%]%' AND content LIKE '%(%' AND content LIKE '%)%' AND content NOT LIKE '%\[%[^]]*\]([^)]*\)%' THEN 'SECTION_MALFORMED_LINKS'
            WHEN content LIKE '%<%' AND content LIKE '%>%' AND content NOT LIKE '%<[a-zA-Z][^>]*>%' THEN 'SECTION_MALFORMED_HTML'
            WHEN content LIKE '%. %' AND LENGTH(SUBSTRING(content FROM '\. \.')) > 0 THEN 'SECTION_DOUBLE_PERIODS'
            WHEN content LIKE '%  %' THEN 'SECTION_EXTRA_SPACES'
            WHEN LENGTH(content) > 5000 THEN 'SECTION_TOO_LONG'
            WHEN LENGTH(content) < 20 THEN 'SECTION_TOO_SHORT'
            ELSE 'SECTION_OTHER'
        END as problem_type
    FROM article_sections 
    WHERE content IS NOT NULL AND content != ''
) section_problems
GROUP BY problem_type
ORDER BY occurrences DESC;

-- =============================================================================
-- SECTION 4: CITATIONS AND REFERENCES ANALYSIS
-- =============================================================================

-- Research sources and citations analysis
SELECT 
    'CITATIONS ANALYSIS' as analysis_type,
    COUNT(*) as total_sources,
    COUNT(CASE WHEN url LIKE '%[%' OR url LIKE '%]%' THEN 1 END) as sources_with_brackets,
    COUNT(CASE WHEN title LIKE '%[%' OR title LIKE '%]%' THEN 1 END) as titles_with_brackets,
    COUNT(CASE WHEN url IS NULL OR url = '' THEN 1 END) as missing_urls,
    COUNT(CASE WHEN title IS NULL OR title = '' THEN 1 END) as missing_titles,
    COUNT(CASE WHEN url NOT LIKE 'http%' AND url != '' THEN 1 END) as invalid_urls
FROM research_sources;

-- Articles with reference sections (from sections content)
SELECT 
    'REFERENCE SECTIONS ANALYSIS' as analysis_type,
    COUNT(DISTINCT s.article_id) as total_articles_with_refs,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%## References%' THEN s.article_id END) as has_proper_references,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%## References\n\n%' THEN s.article_id END) as has_formatted_references,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%- [%' THEN s.article_id END) as has_reference_list,
    ROUND(AVG(LENGTH(SUBSTRING(s.content FROM '## References'))), 2) as avg_reference_length
FROM article_sections s 
WHERE s.content IS NOT NULL AND s.content LIKE '%References%';

-- =============================================================================
-- SECTION 5: RECENT ARTICLES FORMATTING CHECK
-- =============================================================================

-- Recent articles (last 24 hours) formatting status
SELECT 
    'RECENT ARTICLES FORMATTING' as analysis_type,
    COUNT(DISTINCT a.id) as recent_articles,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%[%' AND s.content LIKE '%]%' AND s.content LIKE '%(%' AND s.content LIKE '%)%' THEN a.id END) as has_citations,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%## References%' THEN a.id END) as has_references,
    COUNT(DISTINCT CASE WHEN s.content LIKE '%<%' AND s.content LIKE '%>%' THEN a.id END) as has_html,
    COUNT(DISTINCT CASE WHEN LENGTH(s.content) > 5000 THEN a.id END) as long_content,
    ROUND(AVG(LENGTH(s.content)), 2) as avg_content_length
FROM articles a
LEFT JOIN article_sections s ON s.article_id = a.id
WHERE a.created_at >= NOW() - INTERVAL '24 hours' AND s.content IS NOT NULL;

-- =============================================================================
-- SECTION 6: ERROR AND FAILED ARTICLES ANALYSIS
-- =============================================================================

-- Failed articles analysis
SELECT 
    'FAILED ARTICLES ANALYSIS' as analysis_type,
    COUNT(*) as failed_articles,
    COUNT(CASE WHEN error_details LIKE '%format%' THEN 1 END) as format_errors,
    COUNT(CASE WHEN error_details LIKE '%citation%' THEN 1 END) as citation_errors,
    COUNT(CASE WHEN error_details LIKE '%markdown%' THEN 1 END) as markdown_errors,
    COUNT(CASE WHEN error_details LIKE '%html%' THEN 1 END) as html_errors,
    COUNT(CASE WHEN error_details IS NULL OR error_details = '' THEN 1 END) as unknown_errors
FROM articles 
WHERE status = 'failed';

-- =============================================================================
-- SECTION 7: QUALITY METRICS ANALYSIS
-- =============================================================================

-- Quality metrics from sections
SELECT 
    'QUALITY METRICS ANALYSIS' as analysis_type,
    COUNT(*) as sections_with_metrics,
    COUNT(CASE WHEN quality_metrics->>'readability_score' IS NOT NULL THEN 1 END) as has_readability_score,
    COUNT(CASE WHEN quality_metrics->>'keyword_density' IS NOT NULL THEN 1 END) as has_keyword_density,
    COUNT(CASE WHEN quality_metrics->>'quality_passed' = 'true' THEN 1 END) as quality_passed,
    COUNT(CASE WHEN quality_metrics->>'quality_passed' = 'false' THEN 1 END) as quality_failed,
    ROUND(AVG((quality_metrics->>'readability_score')::numeric), 2) as avg_readability_score
FROM article_sections 
WHERE quality_metrics IS NOT NULL;

-- =============================================================================
-- SECTION 8: SPECIFIC FORMATTING ISSUE SAMPLES
-- =============================================================================

-- Sample articles with potential formatting issues (limit 5)
SELECT 
    'SAMPLE FORMATTING ISSUES' as analysis_type,
    a.id,
    a.status,
    COUNT(s.id) as section_count,
    SUM(LENGTH(s.content)) as total_content_length,
    CASE 
        WHEN EXISTS(SELECT 1 FROM article_sections s2 WHERE s2.article_id = a.id AND s2.content LIKE '%[%' AND s2.content LIKE '%]%' AND s2.content LIKE '%(%' AND s2.content LIKE '%)%') THEN 'HAS_CITATIONS'
        ELSE 'NO_CITATIONS'
    END as citation_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM article_sections s3 WHERE s3.article_id = a.id AND s3.content LIKE '%## References%') THEN 'HAS_REFERENCES'
        ELSE 'NO_REFERENCES'
    END as reference_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM article_sections s4 WHERE s4.article_id = a.id AND s4.content LIKE '%<%' AND s4.content LIKE '%>%') THEN 'HAS_HTML'
        ELSE 'NO_HTML'
    END as html_status,
    LEFT(s.content, 100) as content_preview
FROM articles a
LEFT JOIN article_sections s ON s.article_id = a.id
WHERE EXISTS (
    SELECT 1 FROM article_sections sx 
    WHERE sx.article_id = a.id 
    AND sx.content IS NOT NULL 
    AND sx.content != ''
    AND (
        sx.content LIKE '%[%' AND sx.content LIKE '%]%' AND sx.content LIKE '%(%' AND sx.content LIKE '%)%' 
        OR sx.content LIKE '%## References%'
        OR sx.content LIKE '%<%' AND sx.content LIKE '%>%'
    )
)
GROUP BY a.id, a.status
ORDER BY a.created_at DESC
LIMIT 5;

-- =============================================================================
-- SECTION 9: DATABASE ALIGNMENT CHECKS
-- =============================================================================

-- Check for orphaned records
SELECT 
    'ORPHANED RECORDS CHECK' as analysis_type,
    'ORPHANED_SECTIONS' as record_type,
    COUNT(*) as orphaned_count
FROM article_sections s
LEFT JOIN articles a ON s.article_id = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 
    'ORPHANED RECORDS CHECK' as analysis_type,
    'ORPHANED_SOURCES' as record_type,
    COUNT(*) as orphaned_count
FROM research_sources r
LEFT JOIN articles a ON r.article_id = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 
    'ORPHANED RECORDS CHECK' as analysis_type,
    'ORPHANED_QUALITY_CHECKS' as record_type,
    COUNT(*) as orphaned_count
FROM article_quality_checks q
LEFT JOIN articles a ON q.article_id = a.id
WHERE a.id IS NULL;

-- Data consistency checks
SELECT 
    'DATA CONSISTENCY CHECKS' as analysis_type,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN sections_count != actual_sections THEN 1 END) as section_count_mismatch,
    COUNT(CASE WHEN word_count IS NULL OR word_count = 0 THEN 1 END) as missing_word_count,
    COUNT(CASE WHEN tokens_used IS NULL OR tokens_used = 0 THEN 1 END) as missing_token_count,
    COUNT(CASE WHEN model_used IS NULL OR model_used = '' THEN 1 END) as missing_model_info
FROM (
    SELECT 
        a.id,
        a.word_count,
        a.tokens_used,
        a.model_used,
        (SELECT COUNT(*) FROM article_sections s WHERE s.article_id = a.id) as actual_sections,
        COALESCE(a.sections_count, 0) as sections_count
    FROM articles a
) consistency_check;

-- =============================================================================
-- EXECUTION INSTRUCTIONS
-- =============================================================================

-- Run this query manually and provide the complete output for analysis
-- The query will provide comprehensive insights into:
-- 1. Overall article status and formatting health
-- 2. Specific formatting problems and their frequency
-- 3. Citation and reference formatting issues
-- 4. Recent articles formatting status
-- 5. Failed articles and error patterns
-- 6. Quality metrics alignment
-- 7. Sample problematic content for review
-- 8. Database consistency and orphaned records

-- Expected output format: Multiple result sets with analysis_type, counts, and metrics
