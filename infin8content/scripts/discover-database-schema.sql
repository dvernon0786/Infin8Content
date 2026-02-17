-- Database Discovery Script - Check existing tables and columns
-- Date: 2026-02-17
-- Purpose: Understand current database structure before migration

-- List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if key tables exist and their columns
DO $$
DECLARE
    col_record RECORD;
    tbl_record RECORD;
BEGIN
    RAISE NOTICE '=== KEYWORDS TABLE ===';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='keywords' AND table_schema='public'
    ) THEN
        RAISE NOTICE 'Keywords table exists';
        -- Show columns
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name='keywords' AND table_schema='public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Keywords table does NOT exist';
    END IF;
    
    RAISE NOTICE '=== TOPIC_CLUSTERS TABLE ===';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='topic_clusters' AND table_schema='public'
    ) THEN
        RAISE NOTICE 'Topic_clusters table exists';
        -- Show columns
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name='topic_clusters' AND table_schema='public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Topic_clusters table does NOT exist';
    END IF;
    
    RAISE NOTICE '=== SUBTOPICS TABLE ===';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='subtopics' AND table_schema='public'
    ) THEN
        RAISE NOTICE 'Subtopics table exists';
        -- Show columns
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name='subtopics' AND table_schema='public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'Subtopics table does NOT exist';
    END IF;
    
    RAISE NOTICE '=== SEARCHING FOR SIMILAR TABLE NAMES ===';
    -- Look for tables with similar names
    FOR tbl_record IN 
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND (table_name LIKE '%subtopic%' OR table_name LIKE '%topic%' OR table_name LIKE '%cluster%')
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Found similar table: %', tbl_record.table_name;
    END LOOP;
END $$;
