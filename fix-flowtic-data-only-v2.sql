-- CRITICAL FIX: Backfill Flowtic's broken onboarding data ONLY
-- Organization ID: 345a53c9-6ba0-4b22-aa34-33b6c5da4aef
-- 
-- This script ONLY updates data - no table creation
-- Run this after the table already exists

-- STEP 1: Find a valid user ID for this organization
-- First, let's get the actual user ID that belongs to this organization
DO $$
DECLARE
  valid_user_id UUID;
BEGIN
  -- Try to find a user for this organization
  SELECT id INTO valid_user_id
  FROM auth.users
  WHERE raw_user_meta_data->>'organization_id' = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef'
  LIMIT 1;
  
  -- If no user found, we'll skip competitor insertion for now
  IF valid_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found user ID: %', valid_user_id;
    
    -- STEP 2: Update core business fields with actual data
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

    -- STEP 3: Populate keyword_settings with defaults
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
    AND (keyword_settings = '{}' OR keyword_settings IS NULL);

    -- STEP 4: Populate content_defaults with defaults
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
    AND (content_defaults = '{}' OR content_defaults IS NULL);

    -- STEP 5: Add sample competitors (user can update later)
    -- Only run if organization_competitors table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'organization_competitors'
      AND table_schema = 'public'
    ) THEN
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
        valid_user_id -- Use actual user ID
      FROM (
        VALUES 
          ('WordPress.org', 'https://wordpress.org', 'wordpress.org'),
          ('Medium', 'https://medium.com', 'medium.com'),
          ('Substack', 'https://substack.com', 'substack.com')
      ) AS comp(name, url, domain)
      ON CONFLICT (organization_id, domain) DO NOTHING;
    END IF;

    -- STEP 6: Derive onboarding completion status
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

  ELSE
    RAISE NOTICE 'No user found for organization, skipping competitor insertion';
    -- Still update the organization data without competitors
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
      keyword_settings = COALESCE(
        keyword_settings,
        jsonb_build_object(
          'target_region', 'United States',
          'language_code', 'en',
          'auto_generate_keywords', true,
          'monthly_keyword_limit', 100
        )
      ),
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
    WHERE id = '345a53c9-6ba0-4b22-aa34-33b6c5da4aef';
  END IF;
END $$;

-- STEP 7: Verify the fix
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
