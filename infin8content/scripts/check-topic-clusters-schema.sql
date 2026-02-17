-- Check topic_clusters table schema
-- Date: 2026-02-17
-- Purpose: Understand actual structure before adding approval tracking

DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '=== TOPIC_CLUSTERS TABLE SCHEMA ===';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name='topic_clusters' AND table_schema='public'
    ) THEN
        RAISE NOTICE 'Topic_clusters table exists';
        
        -- Show all columns
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name='topic_clusters' AND table_schema='public'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: %, Type: %, Nullable: %, Default: %', 
                col_record.column_name, col_record.data_type, col_record.is_nullable, col_record.column_default;
        END LOOP;
        
        -- Show table constraints
        RAISE NOTICE '=== CONSTRAINTS ===';
        FOR col_record IN 
            SELECT constraint_name, constraint_type, check_clause
            FROM information_schema.table_constraints 
            WHERE table_name='topic_clusters' AND table_schema='public'
        LOOP
            RAISE NOTICE 'Constraint: %, Type: %, Check: %', 
                col_record.constraint_name, col_record.constraint_type, col_record.check_clause;
        END LOOP;
    ELSE
        RAISE NOTICE 'Topic_clusters table does NOT exist';
    END IF;
END $$;
