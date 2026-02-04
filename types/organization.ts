export interface BaseOrganization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingConfig {
  onboarding_completed: boolean;
  onboarding_version: string;
  website_url?: string;
  business_description?: string;
  target_audiences?: string[];
  blog_config: BlogConfig;
  content_defaults: ContentDefaults;
  keyword_settings: KeywordSettings;
}

export interface BlogConfig {
  blog_root?: string;
  sitemap_url?: string;
  reference_articles?: string[];
}

export interface ContentDefaults {
  language?: string;
  tone?: string;
  internal_links?: boolean;
  auto_publish?: boolean;
  global_instructions?: string;
}

export interface KeywordSettings {
  region?: string;
  auto_generate?: boolean;
  keyword_limits?: number;
}

// Extend existing Organization type
export interface Organization extends BaseOrganization {
  onboarding_completed: boolean;
  onboarding_version: string;
  website_url?: string;
  business_description?: string;
  target_audiences?: string[];
  blog_config: BlogConfig;
  content_defaults: ContentDefaults;
  keyword_settings: KeywordSettings;
}
