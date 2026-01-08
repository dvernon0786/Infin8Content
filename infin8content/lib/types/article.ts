/**
 * Article-related TypeScript types
 * Shared types for article data structures
 */

export type ArticleStatus = 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'

export interface ArticleMetadata {
  id: string
  title: string | null
  keyword: string
  status: ArticleStatus
  target_word_count: number
  writing_style: string | null
  target_audience: string | null
  created_at: string
  updated_at: string
  org_id: string
}

export interface ArticleSection {
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  section_index: number
  h2_index?: number
  h3_index?: number
  title: string
  content: string
  word_count: number
  generated_at: string
  research_sources?: Array<{
    title: string
    url: string
    excerpt?: string
    published_date?: string | null
    author?: string | null
    relevance_score?: number
  }>
  citations_included?: number
  research_query?: string
  tokens_used?: number
  model_used?: string
  quality_metrics?: {
    word_count: number
    citations_included: number
    readability_score?: number
    keyword_density?: number
    quality_passed: boolean
    quality_retry_count: number
  }
}

export interface ArticleWithSections {
  sections: ArticleSection[] | null
}

