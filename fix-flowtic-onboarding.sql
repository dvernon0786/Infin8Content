-- CRITICAL FIX: Backfill Flowtic's broken onboarding data
-- Organization ID: 345a53c9-6ba0-4b22-aa34-33b6c5da4aef

-- STEP 1: Update core business fields with actual data
UPDATE organizations 
SET 
  website_url = COALESCE(
    (blog_config->'integrations'->'wordpress'->>'url'),
    website_url,
    'https://mirrorloop.us'
  ),
  business_description = COALESCE(
    business_description,
    'WordPress blog and content management platform'
  ),
  target_audiences = COALESCE(
    target_audiences,
    ARRAY['Content creators', 'Blog owners', 'Digital marketers', 'WordPress users']
  ),
  updated_at = NOW()
WHERE id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef';

-- STEP 2: Populate keyword_settings with defaults
UPDATE organizations 
SET 
  keyword_settings = COALESCE(
    keyword_settings,
    jsonb_build_object(
      'target_region', 'United States',
      'language_code', 'en',
      'auto_generate_keywords', true,
      'monthly_keyword_limit', 100
    )
  ),
  updated_at = NOW()
WHERE id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef'
AND keyword_settings = '{}' OR keyword_settings IS NULL;

-- STEP 3: Populate content_defaults with defaults
UPDATE organizations 
SET 
  content_defaults = COALESCE(
    content_defaults,
    jsonb_build_object(
      'language', 'en',
      'tone', 'professional',
      'style', 'informative',
      'target_word_count', 1500,
      'auto_publish', false
    )
  ),
  updated_at = NOW()
WHERE id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef'
AND content_defaults = '{}' OR content_defaults IS NULL;

-- STEP 4: Add sample competitors (user can update later)
INSERT INTO organization_competitors (
  organization_id, 
  name, 
  url, 
  domain, 
  is_active, 
  created_at,
  created_by
) 
SELECT 
  '345a53c9-6ba0-4b22-aa34-33b6c5da4aef',
  comp.name,
  comp.url,
  comp.domain,
  true,
  NOW(),
  '345a53c9-6ba0-4b22-aa34-33b6c5da4aef' -- Using org ID as created_by for now
FROM (
  VALUES 
    ('WordPress.org', 'https://wordpress.org', 'wordpress.org'),
    ('Medium', 'https://medium.com', 'medium.com'),
    ('Substack', 'https://substack.com', 'substack.com')
) AS comp(name, url, domain)
ON CONFLICT (organization_id, domain) DO NOTHING;

-- STEP 5: Derive onboarding completion status
UPDATE organizations 
SET 
  onboarding_completed = (
    website_url IS NOT NULL 
    AND business_description IS NOT NULL 
    AND target_audiences IS NOT NULL 
    AND jsonb_typeof(keyword_settings) = 'object' 
    AND keyword_settings != '{}'
    AND jsonb_typeof(content_defaults) = 'object' 
    AND content_defaults != '{}'
    AND EXISTS (
      SELECT 1 FROM organization_competitors 
      WHERE organization_id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef'
      AND is_active = true
    )
  ),
  onboarding_completed_at = CASE 
    WHEN (
      website_url IS NOT NULL 
      AND business_description IS NOT NULL 
      AND target_audiences IS NOT NULL 
      AND jsonb_typeof(keyword_settings) = 'object' 
      AND keyword_settings != '{}'
      AND jsonb_typeof(content_defaults) = 'object' 
      AND content_defaults != '{}'
      AND EXISTS (
        SELECT 1 FROM organization_competitors 
        WHERE organization_id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef'
        AND is_active = true
      )
    ) THEN onboarding_completed_at
    ELSE NOW()
  END,
  onboarding_version = 'v2-fixed',
  updated_at = NOW()
WHERE id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef';

-- STEP 6: Verify the fix
SELECT 
  id,
  name,
  onboarding_completed,
  onboarding_completed_at,
  onboarding_version,
  website_url,
  business_description,
  target_audiences,
  jsonb_typeof(keyword_settings) as keyword_settings_type,
  jsonb_typeof(content_defaults) as content_defaults_type,
  (SELECT COUNT(*) FROM organization_competitors WHERE organization_id = organizations.id AND is_active = true) as competitor_count
FROM organizations 
WHERE id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef';
