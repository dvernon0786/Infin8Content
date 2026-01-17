-- Check All Table Structures
-- Run this to see actual column names for all tables

-- Check articles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' 
ORDER BY ordinal_position;

-- Check article_progress table structure  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'article_progress' 
ORDER BY ordinal_position;

-- Check team_invitations table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_invitations' 
ORDER BY ordinal_position;

-- Also check if these tables exist at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'article_progress', 'team_invitations', 'activities')
ORDER BY table_name;
