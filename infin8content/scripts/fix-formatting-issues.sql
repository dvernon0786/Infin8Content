-- Fix Formatting Issues in Database
-- Purpose: Identify and fix malformed citations and content issues
-- Date: 2026-01-13

-- =============================================================================
-- SECTION 1: IDENTIFY MALFORMED CITATIONS
-- =============================================================================

-- Find articles with malformed citations (missing closing brackets/parentheses)
SELECT 
    'MALFORMED CITATIONS' as analysis_type,
    a.id as article_id,
    a.status,
    COUNT(*) as malformed_count,
    LEFT(section->>'content', 200) as sample_content
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND (
        -- Malformed citations: [text without closing ]
        section->>'content' ~ '\[[^\]]*$'
        OR section->>'content' ~ '\[[^\]]*\([^)]*$'
        -- Double periods or spacing issues
        OR section->>'content' ~ '\. \.'
        OR section->>'content' ~ '  +'
    )
GROUP BY a.id, a.status
ORDER BY malformed_count DESC;

-- =============================================================================
-- SECTION 2: IDENTIFY TRUNCATED CONTENT
-- =============================================================================

-- Find sections with unusually short content that might be truncated
SELECT 
    'TRUNCATED CONTENT' as analysis_type,
    a.id as article_id,
    (section->>'section_index') as section_index,
    (section->>'title') as section_title,
    LENGTH(section->>'content') as content_length,
    LEFT(section->>'content', 100) as content_preview
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND LENGTH(section->>'content') < 200
    AND (section->>'title') NOT ILIKE '%introduction%'
ORDER BY content_length ASC
LIMIT 10;

-- =============================================================================
-- SECTION 3: GENERATE FIX STATEMENTS
-- =============================================================================

-- Generate UPDATE statements to fix malformed citations
-- WARNING: Review these statements before executing!

SELECT 
    'FIX STATEMENTS' as analysis_type,
    'UPDATE articles' as fix_statement,
    'SET sections = sections' as fix_action,
    'WHERE id = ''' || a.id::text || '''' as fix_condition,
    'AND sections::text LIKE ''%['' as fix_reason
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND section->>'content' ~ '\[[^\]]*$'
GROUP BY a.id
LIMIT 5;

-- =============================================================================
-- SECTION 4: CONTENT QUALITY CHECK
-- =============================================================================

-- Check overall content quality metrics
SELECT 
    'CONTENT QUALITY' as analysis_type,
    COUNT(DISTINCT a.id) as total_articles,
    COUNT(DISTINCT CASE WHEN LENGTH(section->>'content') > 1000 THEN a.id END) as articles_with_long_content,
    COUNT(DISTINCT CASE WHEN section->>'content' ~ '\[[^\]]*\([^)]*\)' THEN a.id END) as articles_with_proper_citations,
    COUNT(DISTINCT CASE WHEN section->>'content' ~ '##' THEN a.id END) as articles_with_headers,
    ROUND(AVG(LENGTH(section->>'content')), 2) as avg_content_length
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL;
