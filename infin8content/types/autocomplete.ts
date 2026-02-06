/**
 * Types for AI Autocomplete Service
 * Story A-5: Onboarding Agent AI Autocomplete
 */

export type AutocompleteContext = 'competitors' | 'business' | 'blog'

export type AutocompleteCategory = 'competitor' | 'industry' | 'best-practice' | 'template'

export type AutocompleteSource = 'ai' | 'cached' | 'fallback'

export interface AutocompleteSuggestion {
  id: string
  text: string
  category: AutocompleteCategory
  source: AutocompleteSource
}

export interface AutocompleteRequest {
  query: string
  context: AutocompleteContext
  limit?: number
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[]
  cached: boolean
  processingTime: number
}

export interface AutocompleteCacheEntry {
  suggestions: AutocompleteSuggestion[]
  timestamp: number
  ttl: number
}

export interface AutocompleteRateLimit {
  count: number
  resetTime: number
  windowMs: number
}
