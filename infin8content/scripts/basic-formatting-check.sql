-- Basic Formatting Check - Guaranteed to Work
-- Purpose: Simple analysis without complex patterns
-- Date: 2026-01-13

-- =============================================================================
-- SECTION 1: SIMPLE CONTENT ANALYSIS
-- =============================================================================

SELECT 
    'BASIC ANALYSIS' as analysis_type,
    COUNT(DISTINCT a.id) as total_articles,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%[%' THEN a.id END) as has_open_bracket,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%]%' THEN a.id END) as has_close_bracket,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%(%' THEN a.id END) as has_open_paren,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%)%' THEN a.id END) as has_close_paren
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL;

-- =============================================================================
-- SECTION 2: FIND POTENTIAL ISSUES
-- =============================================================================

SELECT 
    'POTENTIAL ISSUES' as analysis_type,
    a.id as article_id,
    a.status,
    COUNT(*) as sections_count,
    STRING_AGG(LEFT(section->>'content', 100), ' | ') as sample_contents
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND section->>'content' LIKE '%[%'
    AND (section->>'content' NOT LIKE '%]%' OR section->>'content' NOT LIKE '%)%')
GROUP BY a.id, a.status
ORDER BY sections_count DESC;

-- =============================================================================
-- SECTION 3: RECENT SAMPLES
-- =============================================================================

SELECT 
    'RECENT SAMPLES' as analysis_type,
    a.id as article_id,
    a.status,
    (section->>'section_index') as section_index,
    LENGTH(section->>'content') as content_length,
    LEFT(section->>'content', 150) as content_preview
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
    AND a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
ORDER BY a.created_at DESC
LIMIT 3;
