-- Simple Formatting Fix Analysis
-- Purpose: Identify formatting issues without complex regex
-- Date: 2026-01-13

-- =============================================================================
-- SECTION 1: BASIC CONTENT ANALYSIS
-- =============================================================================

-- Check overall content structure
SELECT 
    'CONTENT ANALYSIS' as analysis_type,
    COUNT(DISTINCT a.id) as total_articles,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%[%' THEN a.id END) as has_brackets,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%]%' THEN a.id END) as has_closing_brackets,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%(%' THEN a.id END) as has_parentheses,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%)%' THEN a.id END) as has_closing_parentheses,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%##%' THEN a.id END) as has_headers
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL;

-- =============================================================================
-- SECTION 2: POTENTIAL MALFORMED CITATIONS
-- =============================================================================

-- Find content that starts with [ but might be malformed
SELECT 
    'MALFORMED CITATIONS' as analysis_type,
    a.id as article_id,
    a.status,
    COUNT(*) as sections_with_brackets,
    LEFT(section->>'content', 150) as sample_content
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND section->>'content' LIKE '%[%'
    AND (
        section->>'content' NOT LIKE '%]%'
        OR section->>'content' NOT LIKE '%)%'
    )
GROUP BY a.id, a.status
ORDER BY sections_with_brackets DESC;

-- =============================================================================
-- SECTION 3: CONTENT LENGTH ANALYSIS
-- =============================================================================

-- Check content length distribution
SELECT 
    'CONTENT LENGTH' as analysis_type,
    CASE 
        WHEN LENGTH(section->>'content') < 100 THEN 'VERY_SHORT'
        WHEN LENGTH(section->>'content') < 500 THEN 'SHORT'
        WHEN LENGTH(section->>'content') < 1000 THEN 'MEDIUM'
        WHEN LENGTH(section->>'content') < 2000 THEN 'LONG'
        ELSE 'VERY_LONG'
    END as length_category,
    COUNT(*) as section_count,
    ROUND(AVG(LENGTH(section->>'content')), 2) as avg_length
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
GROUP BY length_category
ORDER BY avg_length;

-- =============================================================================
-- SECTION 4: SAMPLE CONTENT FOR REVIEW
-- =============================================================================

-- Get sample content from recent articles
SELECT 
    'SAMPLE CONTENT' as analysis_type,
    a.id as article_id,
    a.status,
    (section->>'section_index') as section_index,
    (section->>'title') as section_title,
    LENGTH(section->>'content') as content_length,
    CASE 
        WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' AND section->>'content' LIKE '%(%' AND section->>'content' LIKE '%)%' THEN 'PROPER_CITATION'
        WHEN section->>'content' LIKE '%[%' THEN 'MALFORMED_CITATION'
        ELSE 'NO_CITATION'
    END as citation_status,
    LEFT(section->>'content', 200) as content_preview
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL 
    AND section->>'content' != ''
ORDER BY a.created_at DESC
LIMIT 5;
