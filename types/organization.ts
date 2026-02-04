/**
 * Organization types and interfaces
 * Includes onboarding-related types and interfaces for frontend consumption
 */

// Base organization interface
export interface Organization {
  id: string
  name: string
  plan: string
  created_at: string
  updated_at: string
  onboarding_completed: boolean
  onboarding_version: string
  website_url?: string | null
  business_description?: string | null
  target_audiences?: string[] | null
  blog_config: BlogConfig
  content_defaults: ContentDefaults
  keyword_settings: KeywordSettings
  onboarding_completed_at?: string | null
}

// Blog configuration interface
export interface BlogConfig {
  competitors?: Competitor[]
  blog?: {
    name: string
    description: string
    category: string
    post_frequency: 'daily' | 'weekly' | 'monthly'
  }
  integrations?: {
    wordpress?: {
      url?: string
      username?: string
    }
    webflow?: {
      url?: string
    }
    other?: Record<string, any>
  }
}

// Competitor interface
export interface Competitor {
  name: string
  url: string
  description?: string
}

// Content defaults interface
export interface ContentDefaults {
  language: string
  tone: 'professional' | 'casual' | 'formal' | 'friendly'
  style: 'informative' | 'persuasive' | 'educational'
  target_word_count: number
  auto_publish: boolean
}

// Keyword settings interface
export interface KeywordSettings {
  target_region: string
  language_code: string
  auto_generate_keywords: boolean
  monthly_keyword_limit: number
}

// Onboarding step interfaces for API requests
export interface BusinessInput {
  website_url?: string
  business_description?: string
  target_audiences?: string[]
}

export interface CompetitorsInput {
  competitors: Competitor[]
}

export interface BlogInput {
  blog_name: string
  blog_description: string
  blog_category: string
  post_frequency: 'daily' | 'weekly' | 'monthly'
}

export interface ContentDefaultsInput {
  language: string
  tone: 'professional' | 'casual' | 'formal' | 'friendly'
  style: 'informative' | 'persuasive' | 'educational'
  target_word_count: number
  auto_publish: boolean
}

export interface KeywordSettingsInput {
  target_region: string
  language_code: string
  auto_generate_keywords: boolean
  monthly_keyword_limit: number
}

export interface IntegrationInput {
  wordpress_url?: string
  wordpress_username?: string
  webflow_url?: string
  other_integrations?: Record<string, any>
}

export interface CompleteInput {
  // No input required for completion
}

// API response interfaces
export interface OnboardingSuccessResponse {
  success: true
  organization: {
    id: string
    website_url?: string
    business_description?: string
    target_audiences?: string[]
    blog_config?: BlogConfig
    content_defaults?: ContentDefaults
    keyword_settings?: KeywordSettings
    competitor_data?: any
    integration_config?: any
  }
}

export interface OnboardingCompleteResponse {
  success: true
  organization: {
    id: string
    onboarding_completed: true
    onboarding_completed_at: string
  }
  redirectTo: '/dashboard'
}

export interface OnboardingErrorResponse {
  error: string
  details?: {
    field?: string
    message?: string
  }
}

// Onboarding progress tracking
export interface OnboardingProgress {
  business: boolean
  competitors: boolean
  blog: boolean
  content_defaults: boolean
  keyword_settings: boolean
  integration: boolean
  completed: boolean
}
