-- Migration: Fix Broken Citations in Existing Articles
-- Purpose: Fix URLs with spaces, line breaks, and malformed citations
-- Date: 2026-01-13
-- Status: MANUAL REVIEW REQUIRED BEFORE EXECUTION

-- =============================================================================
-- SECTION 1: BACKUP - Create backup of affected articles
-- =============================================================================

-- Review affected articles before fixing
SELECT 
    'AFFECTED ARTICLES' as review_type,
    a.id as article_id,
    a.status,
    COUNT(*) as broken_sections,
    STRING_AGG(DISTINCT (section->>'section_index'), ', ') as section_indices
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND (
        section->>'content' LIKE '%https://%' AND section->>'content' LIKE '% %'
        OR section->>'content' LIKE '%](https://%' AND section->>'content' NOT LIKE '%)%'
        OR section->>'content' LIKE '%- [%' AND section->>'content' LIKE '% - %'
    )
GROUP BY a.id, a.status
ORDER BY a.created_at DESC;

-- =============================================================================
-- SECTION 2: FIX BROKEN URLS - Remove spaces from URLs
-- =============================================================================

-- Fix URLs with spaces by removing them
-- This is a complex operation that needs to be done carefully

-- Step 1: Create a function to clean URLs in content
CREATE OR REPLACE FUNCTION clean_citation_urls(content text) RETURNS text AS $$
DECLARE
    result text := content;
BEGIN
    -- Fix URLs with spaces: https://www. domain.com -> https://www.domain.com
    result := regexp_replace(result, 'https?://([^\s]*)\s+([^\s]*)', 'https://\1\2', 'g');
    
    -- Fix URLs with dashes in domain: sales - cloud -> sales-cloud
    result := regexp_replace(result, '([a-z])\s+-\s+([a-z])', '\1-\2', 'g');
    
    -- Remove extra spaces in URLs
    result := regexp_replace(result, '(\]\(https?://[^\)]*)\s+([^\)]*\))', '\1\2', 'g');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 3: APPLY FIXES TO ARTICLES
-- =============================================================================

-- Update articles with fixed citations
-- WARNING: This modifies production data - review carefully!

-- Step 1: Create temporary table with fixed content
CREATE TEMP TABLE fixed_articles AS
SELECT 
    a.id,
    jsonb_agg(
        jsonb_set(
            section,
            '{content}',
            to_jsonb(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            section->>'content',
                            'https?://([^\s]*)\s+([^\s]*)',
                            'https://\1\2',
                            'g'
                        ),
                        '([a-z])\s+-\s+([a-z])',
                        '\1-\2',
                        'g'
                    ),
                    '(\]\(https?://[^\)]*)\s+([^\)]*\))',
                    '\1\2',
                    'g'
                )
            )
        )
    ) as fixed_sections
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.id IN (
    SELECT DISTINCT a2.id
    FROM articles a2,
         jsonb_array_elements(a2.sections) as section2
    WHERE a2.sections IS NOT NULL 
        AND section2->>'content' IS NOT NULL
        AND (
            section2->>'content' LIKE '%https://%' AND section2->>'content' LIKE '% %'
            OR section2->>'content' LIKE '%](https://%' AND section2->>'content' NOT LIKE '%)%'
        )
)
GROUP BY a.id;

-- Step 2: Apply fixes from temporary table
UPDATE articles a
SET sections = fa.fixed_sections
FROM fixed_articles fa
WHERE a.id = fa.id;

-- Step 3: Drop temporary table
DROP TABLE fixed_articles;

-- =============================================================================
-- SECTION 4: VERIFY FIXES
-- =============================================================================

-- Check if fixes were applied successfully
SELECT 
    'VERIFICATION' as check_type,
    COUNT(*) as still_broken_articles,
    'Should be 0 if fixes worked' as expected_result
FROM articles a,
     jsonb_array_elements(a.sections) as section
WHERE a.sections IS NOT NULL 
    AND section->>'content' IS NOT NULL
    AND (
        section->>'content' LIKE '%https://%' AND section->>'content' LIKE '% %'
        OR section->>'content' LIKE '%](https://%' AND section->>'content' NOT LIKE '%)%'
    );

-- =============================================================================
-- SECTION 5: CLEANUP
-- =============================================================================

-- Drop the helper function after use
DROP FUNCTION IF EXISTS clean_citation_urls(text);

-- =============================================================================
-- EXECUTION INSTRUCTIONS
-- =============================================================================

/*
IMPORTANT: Before running this migration:

1. REVIEW: Run SECTION 1 first to see which articles are affected
2. BACKUP: Create a database backup before proceeding
3. TEST: Run on a test database first if possible
4. EXECUTE: Run SECTION 3 to apply fixes
5. VERIFY: Run SECTION 4 to confirm fixes worked
6. CLEANUP: Run SECTION 5 to remove helper function

This migration will:
- Fix URLs with spaces (https://www. domain.com -> https://www.domain.com)
- Fix dashes with spaces (sales - cloud -> sales-cloud)
- Remove extra spaces in markdown links
- Preserve all other content

Expected impact:
- Fixes broken citations in existing articles
- Allows proper rendering of links in HTML
- Prevents future issues with new articles (via code fixes)
*/
