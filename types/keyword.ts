// Type definitions for keyword-related functionality
// Story 37.1: Generate Subtopic Ideas via DataForSEO

export interface KeywordSubtopic {
  title: string
  keywords: string[]
}

export interface KeywordRecord {
  id: string
  keyword: string
  longtail_keyword?: string
  organization_id: string
  competitor_url_id?: string
  parent_seed_keyword_id?: string
  search_volume?: number
  competition_level?: 'low' | 'medium' | 'high'
  competition_index?: number
  keyword_difficulty?: number
  cpc?: number
  longtail_status?: 'not_started' | 'in_progress' | 'complete' | 'failed'
  subtopics_status?: 'not_started' | 'in_progress' | 'complete' | 'failed'
  article_status?: 'not_started' | 'in_progress' | 'complete' | 'failed'
  subtopics?: KeywordSubtopic[]
  created_at?: string
  updated_at?: string
  created_by?: string
}

export interface SubtopicGenerationRequest {
  keyword_id: string
}

export interface SubtopicGenerationResponse {
  success: boolean
  data?: {
    keyword_id: string
    subtopics: KeywordSubtopic[]
    subtopics_count: number
  }
  error?: string
}

export interface OrganizationSettings {
  locationCode: number
  languageCode: string
}
