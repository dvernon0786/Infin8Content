-- Check if keyword_settings column exists in organizations table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
AND column_name IN ('keyword_settings', 'content_defaults', 'blog_config')
ORDER BY column_name;
