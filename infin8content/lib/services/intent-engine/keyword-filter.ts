/**
 * Keyword Filter Service
 * Story 36.1: Filter Keywords for Quality and Relevance
 * 
 * Mechanically filters expanded long-tail keywords for basic quality issues:
 * - Duplicate and near-duplicate removal
 * - Minimum search-volume filtering
 * - Deterministic, mechanical rules only
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { 
  RetryPolicy, 
  isRetryableError, 
  calculateBackoffDelay, 
  sleep, 
  classifyErrorType,
  retryWithPolicy 
} from './retry-utils'
import { emitAnalyticsEvent } from '../analytics/event-emitter'

export const FILTER_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,        // initial + 2 retries
  initialDelayMs: 2000,  // 2 seconds
  backoffMultiplier: 2,  // exponential (2s, 4s, 8s)
  maxDelayMs: 8000      // 8 second cap
}

export interface Keyword {
  id: string
  organization_id: string
  competitor_url_id?: string
  seed_keyword?: string
  keyword: string
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
  longtail_status: string
  subtopics_status: string
  article_status: string
  parent_seed_keyword_id?: string
  is_filtered_out?: boolean
  filtered_reason?: 'duplicate' | 'low_volume'
  filtered_at?: string
  created_at: string
  updated_at: string
}

export interface FilterResult {
  total_keywords: number
  filtered_keywords_count: number
  removal_breakdown: {
    duplicates: number
    low_volume: number
  }
  remaining_keywords: Keyword[]
}

export interface FilterOptions {
  min_search_volume: number
  similarity_threshold: number
}

/**
 * Normalize keyword for comparison
 */
export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[_\-]/g, ' ') // Replace underscores and hyphens with spaces first
    .replace(/[^\w\s]/g, '') // Remove other punctuation and special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim()
}

/**
 * Calculate string similarity ratio using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeKeyword(str1)
  const normalized2 = normalizeKeyword(str2)
  
  if (normalized1 === normalized2) return 1.0
  
  const matrix = Array(normalized2.length + 1).fill(null).map(() => 
    Array(normalized1.length + 1).fill(null)
  )
  
  for (let i = 0; i <= normalized1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= normalized2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      const indicator = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  const distance = matrix[normalized2.length][normalized1.length]
  const maxLength = Math.max(normalized1.length, normalized2.length)
  return maxLength === 0 ? 1.0 : (maxLength - distance) / maxLength
}

/**
 * Filter keywords for quality and relevance
 */
export async function filterKeywords(
  workflowId: string,
  organizationId: string,
  options: FilterOptions
): Promise<FilterResult> {
  const supabase = createServiceRoleClient()
  
  try {
    // Get all long-tail keywords for the workflow
    const keywords = await retryWithPolicy(
      async () => {
        const { data, error } = await supabase
          .from('keywords')
          .select('*')
          .eq('organization_id', organizationId)
          .is('parent_seed_keyword_id', 'not null') // Only long-tail keywords
          .is('is_filtered_out', false) // Only active keywords
          .order('search_volume', { ascending: false })
        
        if (error) throw new Error(`Failed to fetch keywords: ${error.message}`)
        return data as unknown as Keyword[]
      },
      FILTER_RETRY_POLICY,
      'fetch keywords for filtering'
    )
    
    if (!keywords || keywords.length === 0) {
      return {
        total_keywords: 0,
        filtered_keywords_count: 0,
        removal_breakdown: { duplicates: 0, low_volume: 0 },
        remaining_keywords: []
      }
    }
    
    // Step 1: Remove duplicates and near-duplicates
    const { deduplicatedKeywords, duplicateCount } = removeDuplicates(
      keywords, 
      options.similarity_threshold
    )
    
    // Step 2: Filter by minimum search volume
    const { volumeFilteredKeywords, lowVolumeCount } = filterBySearchVolume(
      deduplicatedKeywords, 
      options.min_search_volume
    )
    
    // Step 3: Update filtered keywords in database
    await updateFilteredKeywords(keywords, volumeFilteredKeywords, supabase)
    
    const totalFiltered = duplicateCount + lowVolumeCount
    
    return {
      total_keywords: keywords.length,
      filtered_keywords_count: totalFiltered,
      removal_breakdown: {
        duplicates: duplicateCount,
        low_volume: lowVolumeCount
      },
      remaining_keywords: volumeFilteredKeywords
    }
    
  } catch (error) {
    console.error('Keyword filtering failed:', error)
    throw error
  }
}

/**
 * Remove duplicate and near-duplicate keywords
 */
function removeDuplicates(
  keywords: Keyword[], 
  similarityThreshold: number
): { deduplicatedKeywords: Keyword[]; duplicateCount: number } {
  const seen = new Map<string, Keyword>()
  const duplicates: Keyword[] = []
  
  for (const keyword of keywords) {
    const normalized = normalizeKeyword(keyword.keyword)
    let isDuplicate = false
    
    // Check for exact match first
    if (seen.has(normalized)) {
      isDuplicate = true
    } else {
      // Check for near-duplicates
      for (const [seenNormalized, seenKeyword] of seen.entries()) {
        const similarity = calculateSimilarity(keyword.keyword, seenKeyword.keyword)
        if (similarity >= similarityThreshold) {
          isDuplicate = true
          break
        }
      }
    }
    
    if (isDuplicate) {
      duplicates.push(keyword)
      
      // Keep the variant with highest search volume
      const existingKeyword = seen.get(normalized)
      if (existingKeyword && keyword.search_volume > existingKeyword.search_volume) {
        seen.set(normalized, keyword)
      }
    } else {
      seen.set(normalized, keyword)
    }
  }
  
  return {
    deduplicatedKeywords: Array.from(seen.values()),
    duplicateCount: duplicates.length
  }
}

/**
 * Filter keywords by minimum search volume
 */
function filterBySearchVolume(
  keywords: Keyword[], 
  minSearchVolume: number
): { volumeFilteredKeywords: Keyword[]; lowVolumeCount: number } {
  const filtered: Keyword[] = []
  const lowVolume: Keyword[] = []
  
  for (const keyword of keywords) {
    if (keyword.search_volume < minSearchVolume) {
      lowVolume.push(keyword)
    } else {
      filtered.push(keyword)
    }
  }
  
  return {
    volumeFilteredKeywords: filtered,
    lowVolumeCount: lowVolume.length
  }
}

/**
 * Update filtered keywords in database
 */
async function updateFilteredKeywords(
  allKeywords: Keyword[],
  remainingKeywords: Keyword[],
  supabase: any
): Promise<void> {
  const remainingIds = new Set(remainingKeywords.map(k => k.id))
  const keywordsToUpdate = allKeywords.filter(k => !remainingIds.has(k.id))
  
  if (keywordsToUpdate.length === 0) return
  
  const now = new Date().toISOString()
  
  // Batch update filtered keywords
  await retryWithPolicy(
    async () => {
      const updates = keywordsToUpdate.map(keyword => {
        const normalized = normalizeKeyword(keyword.keyword)
        const isLowVolume = keyword.search_volume < 100 // Default threshold
        const filteredReason = isLowVolume ? 'low_volume' : 'duplicate'
        
        return {
          id: keyword.id,
          is_filtered_out: true,
          filtered_reason: filteredReason,
          filtered_at: now
        }
      })
      
      // Update in batches to avoid request size limits
      const batchSize = 100
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        const { error } = await supabase
          .from('keywords')
          .upsert(batch, { onConflict: 'id' })
        
        if (error) throw new Error(`Failed to update batch: ${error.message}`)
      }
      
      return true
    },
    FILTER_RETRY_POLICY,
    'update filtered keywords'
  )
}

/**
 * Get organization's minimum search volume setting
 */
export async function getOrganizationFilterSettings(
  organizationId: string
): Promise<FilterOptions> {
  const supabase = createServiceRoleClient()
  
  try {
    const settings = await retryWithPolicy(
      async () => {
        const { data, error } = await supabase
          .from('organization_settings')
          .select('min_search_volume')
          .eq('organization_id', organizationId)
          .single()
        
        if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch settings: ${error.message}`) // PGRST116 = no rows
        return data
      },
      FILTER_RETRY_POLICY,
      'fetch organization filter settings'
    )
    
    return {
      min_search_volume: (settings as any)?.min_search_volume || 100,
      similarity_threshold: 0.85
    }
  } catch (error) {
    console.warn('Failed to fetch organization settings, using defaults:', error)
    return {
      min_search_volume: 100,
      similarity_threshold: 0.85
    }
  }
}

// Export internal functions for testing
export { removeDuplicates, filterBySearchVolume }
