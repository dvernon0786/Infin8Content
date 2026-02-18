-- Complete enum validation - ensure ALL TypeScript states exist in Postgres
-- Run this to verify enum vs TypeScript alignment

-- Check for missing states one by one
DO $$
DECLARE
    missing_states TEXT[] := ARRAY[
        'step_9_articles_queued'  -- This one is critical and often missed
    ];
    state_name TEXT;
    state_exists BOOLEAN;
BEGIN
    FOREACH state_name IN ARRAY missing_states LOOP
        SELECT EXISTS (
            SELECT 1 FROM unnest(enum_range(NULL::workflow_state_enum)) 
            WHERE unnest::text = state_name
        ) INTO state_exists;
        
        IF NOT state_exists THEN
            RAISE NOTICE 'Missing state: %', state_name;
        ELSE
            RAISE NOTICE 'State exists: %', state_name;
        END IF;
    END LOOP;
END $$;

-- Show current enum count
SELECT 
    COUNT(*) as total_states,
    array_agg(unnest ORDER BY unnest) as all_states
FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest;

-- Check specifically for queued state
SELECT unnest
FROM unnest(enum_range(NULL::workflow_state_enum)) as unnest
WHERE unnest::text = 'step_9_articles_queued';

-- If missing, add it:
-- ALTER TYPE workflow_state_enum ADD VALUE IF NOT EXISTS 'step_9_articles_queued';
