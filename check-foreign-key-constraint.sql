-- Check which table the competitor_url_id foreign key references
-- This will tell us the correct table structure for the foreign key

SELECT
  conname,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'keywords_competitor_url_id_fkey';

-- Also check all competitor-related tables to understand the structure
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%competitor%' 
ORDER BY table_name;

-- Check the structure of organization_competitors table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organization_competitors'
ORDER BY ordinal_position;
