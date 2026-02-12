/**
 * Seed Extractor Interface for Dependency Injection
 * Enables deterministic testing with fake implementations
 */

export interface CompetitorData {
  id: string
  url: string
  domain: string
  name?: string
  is_active: boolean
}

export interface ExtractSeedKeywordsRequest {
  competitors: CompetitorData[]
  organizationId: string
  workflowId?: string  // Optional workflow ID for retry tracking
  maxSeedsPerCompetitor?: number
  locationCode?: number
  languageCode?: string
  timeoutMs?: number
}

export interface SeedKeywordData {
  seed_keyword: string
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
  
  // AI Copilot metadata fields
  detected_language?: string
  is_foreign_language?: boolean
  main_intent?: string
  is_navigational?: boolean
  foreign_intent?: string[]
  ai_suggested?: boolean
  user_selected?: boolean
  decision_confidence?: number
  selection_source?: string
  selection_timestamp?: string
}

export interface CompetitorSeedExtractionResult {
  competitor_id: string
  competitor_url: string
  seed_keywords_created: number
  keywords: SeedKeywordData[]
  error?: string
}

export interface ExtractSeedKeywordsResult {
  total_keywords_created: number
  competitors_processed: number
  competitors_failed: number
  results: CompetitorSeedExtractionResult[]
  error?: string
}

export interface SeedExtractor {
  extract(request: ExtractSeedKeywordsRequest): Promise<ExtractSeedKeywordsResult>
  getExtractorType(): string
}
