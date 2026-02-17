-- Get CHECK constraints on keywords table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'keywords'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';
