-- Verify the keywords_longtail_status_check constraint definition
SELECT 
    conname,
    consrc,
    contable::regclass as table_name
FROM pg_constraint 
WHERE conname = 'keywords_longtail_status_check';

-- Also check all constraints on keywords table
SELECT 
    conname,
    contype,
    consrc
FROM pg_constraint 
WHERE contable::regclass = 'keywords'::regclass
ORDER BY conname;
