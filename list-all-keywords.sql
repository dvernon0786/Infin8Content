-- List all keywords in the system
-- This query shows all keywords with their organization, competitor, and status information

SELECT 
  k.id,
  k.seed_keyword,
  k.keyword,
  k.search_volume,
  k.competition_level,
  k.competition_index,
  k.keyword_difficulty,
  k.cpc,
  k.longtail_status,
  k.subtopics_status,
  k.article_status,
  k.created_at,
  k.updated_at,
  o.name as organization_name,
  oc.url as competitor_url,
  oc.competitor_name
FROM keywords k
JOIN organizations o ON k.organization_id = o.id
JOIN organization_competitors oc ON k.competitor_url_id = oc.id
ORDER BY 
  o.name,
  oc.competitor_name,
  k.search_volume DESC,
  k.created_at DESC;

-- Count keywords by organization
SELECT 
  o.name as organization_name,
  COUNT(k.id) as total_keywords,
  COUNT(CASE WHEN k.longtail_status = 'completed' THEN 1 END) as longtail_completed,
  COUNT(CASE WHEN k.subtopics_status = 'completed' THEN 1 END) as subtopics_completed,
  COUNT(CASE WHEN k.article_status = 'completed' THEN 1 END) as articles_completed
FROM organizations o
LEFT JOIN keywords k ON o.id = k.organization_id
GROUP BY o.id, o.name
ORDER BY total_keywords DESC;

-- Count keywords by status
SELECT 
  longtail_status,
  subtopics_status,
  article_status,
  COUNT(*) as count
FROM keywords
GROUP BY longtail_status, subtopics_status, article_status
ORDER BY count DESC;

-- Show keywords with no search volume (potential issues)
SELECT 
  k.seed_keyword,
  k.search_volume,
  o.name as organization_name,
  oc.competitor_name
FROM keywords k
JOIN organizations o ON k.organization_id = o.id
JOIN organization_competitors oc ON k.competitor_url_id = oc.id
WHERE k.search_volume = 0
ORDER BY o.name, oc.competitor_name;
