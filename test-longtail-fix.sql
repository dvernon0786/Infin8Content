-- Test the longtail fix by checking a specific workflow
-- This should show the improved behavior after the fix

-- Check workflow with the issue
SELECT 
  w.id,
  w.state,
  COUNT(k.id) as total_keywords,
  COUNT(CASE WHEN k.parent_seed_keyword_id IS NULL THEN 1 END) as seed_keywords,
  COUNT(CASE WHEN k.parent_seed_keyword_id IS NOT NULL THEN 1 END) as longtail_keywords
FROM intent_workflows w
LEFT JOIN keywords k ON w.id = k.workflow_id
WHERE w.id = 'edfabfa1-48aa-4c42-9f68-22e296e7bc13'
GROUP BY w.id, w.state;

-- Check for self-referential longtails (should be 0 after fix)
SELECT 
  'SELF-REFERENTIAL LONGTAILS' as check_type,
  COUNT(*) as count
FROM keywords k1
JOIN keywords k2 ON k1.keyword = k2.keyword
WHERE k1.workflow_id = 'edfabfa1-48aa-4c42-9f68-22e296e7bc13'
  AND k2.workflow_id = 'edfabfa1-48aa-4c42-9f68-22e296e7bc13'
  AND k1.parent_seed_keyword_id IS NULL
  AND k2.parent_seed_keyword_id IS NOT NULL
  AND k1.id = k2.parent_seed_keyword_id;

-- Show seed vs longtail keyword matches (should be reduced after fix)
SELECT 
  k1.keyword as seed_keyword,
  k2.keyword as longtail_keyword,
  k1.parent_seed_keyword_id as seed_parent,
  k2.parent_seed_keyword_id as longtail_parent
FROM keywords k1
JOIN keywords k2 ON k1.keyword = k2.keyword
WHERE k1.workflow_id = 'edfabfa1-48aa-4c42-9f68-22e296e7bc13'
  AND k2.workflow_id = 'edfabfa1-48aa-4c42-9f68-22e296e7bc13'
  AND k1.parent_seed_keyword_id IS NULL
  AND k2.parent_seed_keyword_id IS NOT NULL
ORDER BY k1.keyword;
