-- Fix tavily_research_cache unique constraint for proper UPSERT support
-- Story 4a.3: Real-Time Research Per Section (Tavily Integration)
-- Fixes error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Drop the existing unnamed unique constraint and recreate it with a name
-- First, find and drop the auto-generated constraint
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'tavily_research_cache'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE tavily_research_cache DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Add the named unique constraint that Supabase can reference
ALTER TABLE tavily_research_cache
ADD CONSTRAINT tavily_research_cache_org_query_key 
UNIQUE (organization_id, research_query);

