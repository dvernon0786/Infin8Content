-- Query to verify internal links configuration for the user
-- User: damien@flowtic.cloud
-- Org ID: e40d7133-bfb6-4349-abe9-7583b21ffe6e

-- 1. Check if organization exists and its basic info
SELECT
  id,
  name,
  created_at,
  updated_at
FROM organizations
WHERE id = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e';

-- 2. Check full content_defaults configuration
SELECT
  id,
  content_defaults ->> 'language' as language,
  content_defaults ->> 'tone' as tone,
  content_defaults ->> 'style' as style,
  content_defaults ->> 'target_word_count' as target_word_count,
  content_defaults ->> 'auto_publish' as auto_publish,
  content_defaults ->> 'brand_color' as brand_color,
  content_defaults ->> 'image_style' as image_style,
  content_defaults ->> 'add_youtube_video' as add_youtube_video,
  content_defaults ->> 'add_cta' as add_cta,
  content_defaults ->> 'add_infographics' as add_infographics,
  content_defaults ->> 'add_emojis' as add_emojis,
  content_defaults ->> 'internal_links' as internal_links_enabled,
  content_defaults ->> 'num_internal_links' as max_internal_links,
  content_defaults,
  created_at,
  updated_at
FROM organizations
WHERE id = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e';

-- 3. Check if any articles have been generated with internal links
SELECT
  id,
  title,
  slug,
  status,
  org_id,
  word_count,
  created_at,
  updated_at
FROM articles
WHERE org_id = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check article sections for internal links (if articles exist)
SELECT
  s.id,
  s.article_id,
  s.section_header,
  s.section_type,
  s.status,
  (s.content_html LIKE '%<a href=%' OR s.content_markdown LIKE '%[%](%' ) as has_links,
  s.created_at,
  s.updated_at
FROM article_sections s
JOIN articles a ON s.article_id = a.id
WHERE a.org_id = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e'
ORDER BY a.created_at DESC, s.section_order
LIMIT 20;

-- 5. Check website info (if website was provided during onboarding)
SELECT
  id,
  website_url,
  created_at,
  updated_at
FROM organizations
WHERE id = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e';

-- 6. Check user's organization details
SELECT
  u.id,
  u.email,
  u.org_id,
  u.role,
  u.created_at,
  o.name as org_name,
  o.created_at as org_created_at
FROM users u
JOIN organizations o ON u.org_id = o.id
WHERE u.org_id = 'e40d7133-bfb6-4349-abe9-7583b21ffe6e'
  AND u.email = 'damien@flowtic.cloud';
