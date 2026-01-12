-- Verify Formatting is Fixed
-- Purpose: Confirm no formatting issues exist
-- Date: 2026-01-13

-- Check if any articles have malformed citations
SELECT 
    'MALFORMED CHECK' as check_type,
    COUNT(*) as articles_with_issues,
    'Should be 0 if formatting is fixed' as interpretation
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND section->>'content' LIKE '%[%'
    AND (section->>'content' NOT LIKE '%]%' OR section->>'content' NOT LIKE '%)%');

-- Check overall content health
SELECT 
    'CONTENT HEALTH' as check_type,
    COUNT(DISTINCT a.id) as total_articles,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%[%' AND section->>'content' LIKE '%]%' THEN a.id END) as proper_citations,
    COUNT(DISTINCT CASE WHEN section->>'content' LIKE '%##%' THEN a.id END) as has_headers,
    ROUND(AVG(LENGTH(section->>'content')), 2) as avg_content_length
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL;
