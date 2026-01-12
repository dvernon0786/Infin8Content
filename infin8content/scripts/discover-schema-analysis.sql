-- Schema Discovery and Formatting Analysis
-- Purpose: First discover actual table names, then analyze formatting
-- Date: 2026-01-13

-- =============================================================================
-- SECTION 1: DISCOVER ALL TABLES
-- =============================================================================

-- Find all tables in the database
SELECT 
    'ALL TABLES' as analysis_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================================================
-- SECTION 2: DISCOVER TABLES WITH ARTICLE-RELATED NAMES
-- =============================================================================

-- Look for tables that might contain article data
SELECT 
    'ARTICLE-RELATED TABLES' as analysis_type,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (
        table_name LIKE '%article%' 
        OR table_name LIKE '%section%'
        OR table_name LIKE '%content%'
        OR table_name LIKE '%research%'
        OR table_name LIKE '%source%'
        OR table_name LIKE '%citation%'
        OR table_name LIKE '%quality%'
    )
ORDER BY table_name;

-- =============================================================================
-- SECTION 3: GET COLUMN DETAILS FOR SUSPECTED TABLES
-- =============================================================================

-- Get detailed column information for article-related tables
SELECT 
    'TABLE COLUMNS' as analysis_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND (
            table_name LIKE '%article%' 
            OR table_name LIKE '%section%'
            OR table_name LIKE '%content%'
            OR table_name LIKE '%research%'
            OR table_name LIKE '%source%'
            OR table_name LIKE '%citation%'
            OR table_name LIKE '%quality%'
        )
    )
ORDER BY table_name, ordinal_position;

-- =============================================================================
-- SECTION 4: SAMPLE DATA FROM LIKELY TABLES
-- =============================================================================

-- This will be updated based on what we discover above
-- For now, let's try some common table name variations

-- Try to get sample from articles table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles' AND table_schema = 'public') THEN
        RAISE NOTICE '=== ARTICLES TABLE SAMPLE ===';
        EXECUTE 'SELECT 
            ''ARTICLES SAMPLE'' as analysis_type,
            COUNT(*) as total_count,
            COUNT(CASE WHEN status = ''completed'' THEN 1 END) as completed,
            COUNT(CASE WHEN status = ''failed'' THEN 1 END) as failed,
            MIN(created_at) as earliest,
            MAX(created_at) as latest
        FROM articles 
        LIMIT 1';
    END IF;
END $$;

-- Try to get sample from sections table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sections' AND table_schema = 'public') THEN
        RAISE NOTICE '=== SECTIONS TABLE SAMPLE ===';
        EXECUTE 'SELECT 
            ''SECTIONS SAMPLE'' as analysis_type,
            COUNT(*) as total_sections,
            COUNT(DISTINCT article_id) as articles_with_sections,
            COUNT(CASE WHEN content IS NOT NULL THEN 1 END) as with_content,
            ROUND(AVG(LENGTH(COALESCE(content, ''''))), 2) as avg_length
        FROM sections 
        LIMIT 1';
    END IF;
END $$;

-- =============================================================================
-- SECTION 5: DYNAMIC ANALYSIS BASED ON DISCOVERED TABLES
-- =============================================================================

-- This section will need to be updated based on the actual table names discovered
-- For now, let's create a template that can be easily modified

-- Template for analyzing content formatting (replace table_name with actual table)
/*
SELECT 
    'CONTENT FORMATTING' as analysis_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN content LIKE ''%[%'' AND content LIKE ''%]%'' THEN 1 END) as has_brackets,
    COUNT(CASE WHEN content LIKE ''%<%'' AND content LIKE ''%>%'' THEN 1 END) as has_html,
    COUNT(CASE WHEN content LIKE ''%##%'' THEN 1 END) as has_headers,
    COUNT(CASE WHEN content LIKE ''%References%'' THEN 1 END) as has_references
FROM table_name 
WHERE content IS NOT NULL;
*/

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

-- 1. Run this query first to discover the actual table structure
-- 2. Based on the results, I'll create a customized analysis query
-- 3. The query will show you:
--    - All tables in the database
--    - Article-related tables specifically
--    - Column details for those tables
--    - Sample data where possible

-- Expected output will help us understand:
-- - What tables actually exist (not article_sections, maybe sections, article_content, etc.)
-- - What columns contain the content we need to analyze
-- - How the data is structured
