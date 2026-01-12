-- Quick Formatting Check - Essential Analysis Only
-- Purpose: Get the key formatting information we need
-- Date: 2026-01-13

-- =============================================================================
-- SECTION 1: SECTIONS STRUCTURE (How content is stored)
-- =============================================================================

SELECT 
    'SECTIONS STRUCTURE' as analysis_type,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN sections IS NOT NULL THEN 1 END) as has_sections_data,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'array' THEN 1 END) as sections_is_array,
    COUNT(CASE WHEN sections IS NOT NULL AND jsonb_typeof(sections) = 'array' AND jsonb_array_length(sections) > 0 THEN 1 END) as has_array_sections
FROM articles;

-- =============================================================================
-- SECTION 2: CONTENT FORMATTING PATTERNS
-- =============================================================================

SELECT 
    'CONTENT FORMATTING' as analysis_type,
    COUNT(DISTINCT a.id) as articles_with_content,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%<%' AND section->>'content' LIKE '%>%' THEN a.id END) as has_html_tags,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' THEN a.id END) as has_brackets,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%##%' THEN a.id END) as has_headers,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%References%' THEN a.id END) as has_references
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND jsonb_typeof(a.sections) = 'array'
    AND section->>'content' IS NOT NULL;

-- =============================================================================
-- SECTION 3: SAMPLE CONTENT (Most Recent)
-- =============================================================================

SELECT 
    'SAMPLE CONTENT' as analysis_type,
    a.id as article_id,
    a.status,
    (section->>'section_index') as section_index,
    (section->>'title') as section_title,
    LEFT(section->>'content', 300) as content_preview
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.sections IS NOT NULL 
    AND jsonb_typeof(a.sections) = 'array'
    AND section->>'content' IS NOT NULL 
    AND section->>'content' != ''
ORDER BY a.created_at DESC
LIMIT 3;

-- =============================================================================
-- SECTION 4: FAILED ARTICLES (if any)
-- =============================================================================

SELECT 
    'FAILED ARTICLES' as analysis_type,
    COUNT(*) as failed_count,
    COUNT(CASE WHEN error_details IS NOT NULL THEN 1 END) as with_errors,
    LEFT(error_details->>'message', 100) as sample_error
FROM articles 
WHERE status = 'failed'
GROUP BY error_details->>'message'
LIMIT 3;
