/**
 * Long-Tail Keyword Expander Service
 * Story 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model)
 * 
 * Expands seed keywords into long-tail keywords using four DataForSEO endpoints:
 * 1. Related Keywords
 * 2. Keyword Suggestions  
 * 3. Keyword Ideas
 * 4. Google Autocomplete
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { 
  RetryPolicy, 
  retryWithPolicy 
} from './retry-utils'
import { emitAnalyticsEvent } from '../analytics/event-emitter'
import { resolveLocationCode, resolveLanguageCode } from '@/lib/config/dataforseo-geo'

export const LONGTAIL_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,        // initial + 2 retries
  initialDelayMs: 2000,  // 2 seconds
  backoffMultiplier: 2,  // exponential (2s, 4s, 8s)
  maxDelayMs: 8000      // 8 second cap
}

export interface SeedKeyword {
  id: string
  keyword: string
  organization_id: string
  competitor_url_id: string
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
}

export interface LongtailKeywordData {
  keyword: string
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
  source: 'related' | 'suggestions' | 'ideas' | 'autocomplete'
}

export interface LongtailExpansionResult {
  seed_keyword_id: string
  seed_keyword: string
  longtails_created: number
  longtails: LongtailKeywordData[]
  errors: string[]
}

export interface ExpansionSummary {
  workflow_id: string
  seeds_processed: number
  total_longtails_created: number
  results: LongtailExpansionResult[]
}

// DataForSEO API interfaces
interface DataForSEORequest {
  [key: string]: any
}

interface DataForSEOResponse {
  version?: string
  status_code: number
  status_message: string
  time?: string
  cost?: number
  result_count?: number
  tasks_error?: number
  tasks?: Array<{
    id?: string
    status_code: number
    status_message: string
    time?: string
    cost?: number
    result_count?: number
    result?: any[]
  }>
}

/**
 * Make authenticated request to DataForSEO API
 */
export async function makeDataForSEORequest(
  endpoint: string,
  data: DataForSEORequest
): Promise<DataForSEOResponse> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured')
  }

  const url = `https://api.dataforseo.com/v3${endpoint}`
  const auth = Buffer.from(`${login}:${password}`).toString('base64')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`DataForSEO API error: HTTP ${response.status} ${response.statusText}`)
  }

  const jsonResponse = await response.json()
  console.log('[DataForSEO DEBUG] HTTP Response:', {
    url,
    status: response.status,
    statusText: response.statusText,
    response: jsonResponse
  })

  return jsonResponse
}

/**
 * Fetch related keywords for a seed keyword
 */
export async function fetchRelatedKeywords(
  seedKeyword: string,
  locationCode: number,
  languageCode: string
): Promise<LongtailKeywordData[]> {
  const endpoint = '/dataforseo_labs/google/related_keywords/live'
  
  const data = [{
    keyword: seedKeyword,
    location_code: locationCode,
    language_code: languageCode,
    limit: 3
  }]

  const response = await retryWithPolicy(
    () => makeDataForSEORequest(endpoint, data),
    LONGTAIL_RETRY_POLICY,
    `fetchRelatedKeywords(${seedKeyword})`
  )
  
  // Debug: Log raw response
  console.log('[DataForSEO DEBUG] Raw related response:', JSON.stringify(response, null, 2))
  
  // Validate response structure and status codes
  if (response.status_code !== 20000 || response.tasks_error !== 0) {
    throw new Error(`Related keywords API failed: ${response.status_message} (status_code: ${response.status_code}, tasks_error: ${response.tasks_error})`)
  }

  const task = response.tasks?.[0]
  if (!task || task.status_code !== 20000) {
    throw new Error(`Related keywords task failed: ${task?.status_message || 'No task data'} (task_status_code: ${task?.status_code})`)
  }

  const block = task.result?.[0]
  if (!block?.items) {
    console.log('[DataForSEO DEBUG] No items found in related keywords response')
    return []
  }

  const results = block.items.slice(0, 3)
  
  return results.map((item: any) => {
    const data = item.keyword_data
    const info = data?.keyword_info ?? {}

    return {
      keyword: data?.keyword,
      search_volume: info.search_volume ?? 0,
      competition_level: mapCompetitionLevel(info.competition ?? 0),
      competition_index: info.competition ?? 0,
      keyword_difficulty: data?.keyword_properties?.keyword_difficulty ?? 0,
      cpc: info.cpc,
      source: 'related' as const
    }
  })
}

/**
 * Fetch keyword suggestions for a seed keyword
 */
export async function fetchKeywordSuggestions(
  seedKeyword: string,
  locationCode: number,
  languageCode: string
): Promise<LongtailKeywordData[]> {
  const endpoint = '/dataforseo_labs/google/keyword_suggestions/live'
  
  const data = [{
    keyword: seedKeyword,
    location_code: locationCode,
    language_code: languageCode,
    limit: 3
  }]

  const response = await retryWithPolicy(
    () => makeDataForSEORequest(endpoint, data),
    LONGTAIL_RETRY_POLICY,
    `fetchKeywordSuggestions(${seedKeyword})`
  )
  
  // Validate response structure and status codes
  if (response.status_code !== 20000 || response.tasks_error !== 0) {
    throw new Error(`Keyword suggestions API failed: ${response.status_message} (status_code: ${response.status_code}, tasks_error: ${response.tasks_error})`)
  }

  const task = response.tasks?.[0]
  if (!task || task.status_code !== 20000) {
    throw new Error(`Keyword suggestions task failed: ${task?.status_message || 'No task data'} (task_status_code: ${task?.status_code})`)
  }

  const block = task.result?.[0]
  if (!block?.items) {
    console.log('[DataForSEO DEBUG] No items found in keyword suggestions response')
    return []
  }

  const results = block.items.slice(0, 3)
  
  return results.map((item: any) => {
    const data = item.keyword_data
    const info = data?.keyword_info ?? {}

    return {
      keyword: data?.keyword,
      search_volume: info.search_volume ?? 0,
      competition_level: mapCompetitionLevel(info.competition ?? 0),
      competition_index: info.competition ?? 0,
      keyword_difficulty: data?.keyword_properties?.keyword_difficulty ?? 0,
      cpc: info.cpc,
      source: 'suggestions' as const
    }
  })
}

/**
 * Fetch keyword ideas for a seed keyword
 */
export async function fetchKeywordIdeas(
  seedKeyword: string,
  locationCode: number,
  languageCode: string
): Promise<LongtailKeywordData[]> {
  const endpoint = '/dataforseo_labs/google/keyword_ideas/live'
  
  const data = [{
    keyword: seedKeyword,
    location_code: locationCode,
    language_code: languageCode,
    limit: 3
  }]

  const response = await retryWithPolicy(
    () => makeDataForSEORequest(endpoint, data),
    LONGTAIL_RETRY_POLICY,
    `fetchKeywordIdeas(${seedKeyword})`
  )
  
  // Validate response structure and status codes
  if (response.status_code !== 20000 || response.tasks_error !== 0) {
    throw new Error(`Keyword ideas API failed: ${response.status_message} (status_code: ${response.status_code}, tasks_error: ${response.tasks_error})`)
  }

  const task = response.tasks?.[0]
  if (!task || task.status_code !== 20000) {
    throw new Error(`Keyword ideas task failed: ${task?.status_message || 'No task data'} (task_status_code: ${task?.status_code})`)
  }

  const block = task.result?.[0]
  if (!block?.items) {
    console.log('[DataForSEO DEBUG] No items found in keyword ideas response')
    return []
  }

  const results = block.items.slice(0, 3)
  
  return results.map((item: any) => {
    const data = item.keyword_data
    const info = data?.keyword_info ?? {}

    return {
      keyword: data?.keyword,
      search_volume: info.search_volume ?? 0,
      competition_level: mapCompetitionLevel(info.competition ?? 0),
      competition_index: info.competition ?? 0,
      keyword_difficulty: data?.keyword_properties?.keyword_difficulty ?? 0,
      cpc: info.cpc,
      source: 'ideas' as const
    }
  })
}

/**
 * Fetch Google autocomplete suggestions for a seed keyword
 */
export async function fetchGoogleAutocomplete(
  seedKeyword: string,
  locationCode: number,
  languageCode: string
): Promise<LongtailKeywordData[]> {
  const endpoint = '/serp/google/autocomplete/live/advanced'
  
  const data = [{
    keyword: seedKeyword,
    location_code: locationCode,
    language_code: languageCode,
    limit: 3
  }]

  const response = await retryWithPolicy(
    () => makeDataForSEORequest(endpoint, data),
    LONGTAIL_RETRY_POLICY,
    `fetchGoogleAutocomplete(${seedKeyword})`
  )
  
  // Validate response structure and status codes
  if (response.status_code !== 20000 || response.tasks_error !== 0) {
    throw new Error(`Google autocomplete API failed: ${response.status_message} (status_code: ${response.status_code}, tasks_error: ${response.tasks_error})`)
  }

  const task = response.tasks?.[0]
  if (!task || task.status_code !== 20000) {
    throw new Error(`Google autocomplete task failed: ${task?.status_message || 'No task data'} (task_status_code: ${task?.status_code})`)
  }

  const block = task.result?.[0]
  if (!block?.items) {
    console.log('[DataForSEO DEBUG] No items found in google autocomplete response')
    return []
  }

  const results = block.items.slice(0, 3)
  
  return results
    .map((item: any) => {
      // Autocomplete response structure is different - no keyword_data nesting
      const keyword = item.keyword || item.q || ''
      
      // Defensive: Filter out empty/undefined keywords
      if (!keyword.trim()) {
        return null
      }
      
      return {
        keyword: keyword.trim(),
        search_volume: 0, // Autocomplete doesn't provide search volume
        competition_level: 'low' as const, // Default to low
        competition_index: 0,
        keyword_difficulty: 0,
        cpc: undefined,
        source: 'autocomplete' as const
      }
    })
    .filter((item: any): item is LongtailKeywordData => item !== null)
}

/**
 * Map competition value to competition level
 */
function mapCompetitionLevel(competition: any): 'low' | 'medium' | 'high' {
  if (!competition) return 'low'
  
  const compValue = typeof competition === 'string' ? competition.toLowerCase() : competition.toString()
  
  if (compValue.includes('low')) return 'low'
  if (compValue.includes('medium')) return 'medium'
  if (compValue.includes('high')) return 'high'
  
  // If numeric, map 0-33=low, 34-66=medium, 67-100=high
  const numValue = parseFloat(compValue)
  if (!isNaN(numValue)) {
    if (numValue <= 33) return 'low'
    if (numValue <= 66) return 'medium'
    return 'high'
  }
  
  return 'low'
}

/**
 * Deduplicate keywords across all sources
 */
function deduplicateKeywords(keywords: LongtailKeywordData[]): LongtailKeywordData[] {
  const seen = new Set<string>()
  const deduplicated: LongtailKeywordData[] = []
  
  for (const keyword of keywords) {
    const normalized = keyword.keyword.toLowerCase().trim()
    if (!seen.has(normalized)) {
      seen.add(normalized)
      deduplicated.push(keyword)
    }
  }
  
  return deduplicated
}

/**
 * Expand a single seed keyword into long-tail keywords
 */
async function expandSeedKeyword(
  seedKeyword: SeedKeyword,
  locationCode: number,
  languageCode: string
): Promise<LongtailExpansionResult> {
  const errors: string[] = []
  const allLongtails: LongtailKeywordData[] = []

  console.log(`[LongtailExpander] Expanding seed keyword: "${seedKeyword.keyword}"`)

  // Fetch from all four sources - each function handles its own retry logic
  const sources = [
    { name: 'related', fetcher: fetchRelatedKeywords },
    { name: 'suggestions', fetcher: fetchKeywordSuggestions },
    { name: 'ideas', fetcher: fetchKeywordIdeas },
    { name: 'autocomplete', fetcher: fetchGoogleAutocomplete }
  ]

  for (const source of sources) {
    try {
      console.log(`[LongtailExpander] Fetching ${source.name} keywords`)
      const keywords = await source.fetcher(seedKeyword.keyword, locationCode, languageCode)
      allLongtails.push(...keywords)
      console.log(`[LongtailExpander] Got ${keywords.length} ${source.name} keywords`)
    } catch (error) {
      console.error(`[LongtailExpander] ${source.name} failed:`, error)
      errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Deduplicate and limit to 12 keywords max
  const deduplicated = deduplicateKeywords(allLongtails).slice(0, 12)
  
  console.log(`[LongtailExpander] Seed "${seedKeyword.keyword}" expanded to ${deduplicated.length} unique long-tails`)

  return {
    seed_keyword_id: seedKeyword.id,
    seed_keyword: seedKeyword.keyword,
    longtails_created: deduplicated.length,
    longtails: deduplicated,
    errors
  }
}

/**
 * Persist long-tail keywords to database
 */
async function persistLongtailKeywords(
  workflowId: string,
  seedKeyword: SeedKeyword,
  longtails: LongtailKeywordData[]
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  for (const longtail of longtails) {
    const { error } = await supabase
      .from('keywords')
      .insert({
        workflow_id: workflowId,
        organization_id: seedKeyword.organization_id,
        competitor_url_id: seedKeyword.competitor_url_id,
        seed_keyword: seedKeyword.keyword, // Keep original seed for reference
        keyword: longtail.keyword,
        search_volume: longtail.search_volume,
        competition_level: longtail.competition_level,
        competition_index: longtail.competition_index,
        keyword_difficulty: longtail.keyword_difficulty,
        cpc: longtail.cpc,
        parent_seed_keyword_id: seedKeyword.id,
        longtail_status: 'complete',
        subtopics_status: 'not_started',
        article_status: 'not_started'
      })
    
    if (error) {
      // Check if it's a duplicate key error (not a critical failure)
      if (error.code === '23505') {
        console.log(`[LongtailExpander] Skipping duplicate keyword: ${longtail.keyword}`)
        continue
      }
      throw new Error(`Failed to persist long-tail keyword "${longtail.keyword}": ${error.message}`)
    }
  }
}

/**
 * Update seed keyword status to complete
 */
async function updateSeedKeywordStatus(seedKeywordId: string): Promise<void> {
  const supabase = createServiceRoleClient()
  
  const { error } = await supabase
    .from('keywords')
    .update({ longtail_status: 'complete' })
    .eq('id', seedKeywordId)
  
  if (error) {
    throw new Error(`Failed to update seed keyword status: ${error.message}`)
  }
}

/**
 * Get organization location and language settings
 */
async function getOrganizationSettings(organizationId: string): Promise<{ locationCode: number; languageCode: string }> {
  const supabase = createServiceRoleClient()
  
  const { data: orgData } = await supabase
    .from('organizations')
    .select('keyword_settings')
    .eq('id', organizationId)
    .single()

  if (!orgData) {
    throw new Error(`Organization not found: ${organizationId}`)
  }

  const keywordSettings = (orgData as any)?.keyword_settings || {}

  const locationCode = resolveLocationCode(keywordSettings.target_region)
  const languageCode = resolveLanguageCode(keywordSettings.language_code)

  console.log(`[LongtailExpander] Using location ${locationCode} and language ${languageCode} for region "${keywordSettings.target_region}"`)

  return {
    locationCode,
    languageCode
  }
}


/**
 * Main function to expand seed keywords into long-tail keywords
 */
export async function expandSeedKeywordsToLongtails(workflowId: string, userId: string): Promise<ExpansionSummary> {
  const supabase = createServiceRoleClient()
  
  console.log(`[LongtailExpander] Starting long-tail expansion for workflow ${workflowId}`)
  
  // NOTE: Approval validation is now handled at route layer
  // Service assumes validation has passed and executes business logic only
  
  // Get workflow details
  const { data: workflow, error: workflowError } = await supabase
    .from('intent_workflows')
    .select('organization_id, state')
    .eq('id', workflowId)
    .single()
  
  if (workflowError || !workflow) {
    throw new Error(`Workflow not found: ${workflowError?.message || 'Unknown error'}`)
  }
  
  const organizationId = (workflow as any).organization_id

  // Get organization settings
  const { locationCode, languageCode } = await getOrganizationSettings(organizationId)

  // Get seed keywords for this workflow only
  const { data: seedKeywords, error: seedsError } = await supabase
    .from('keywords')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('organization_id', organizationId)
    .is('parent_seed_keyword_id', null) // Only seed keywords
    .eq('longtail_status', 'not_started')

  if (seedsError) {
    throw new Error(`Failed to fetch seed keywords: ${seedsError.message}`)
  }
  
  if (!seedKeywords || seedKeywords.length === 0) {
    throw new Error('No seed keywords found for long-tail expansion')
  }
  
  console.log(`[LongtailExpander] Processing ${seedKeywords.length} seed keywords`)
  
  const results: LongtailExpansionResult[] = []
  let totalLongtailsCreated = 0
  
  // Process each seed keyword
  for (const seedKeyword of seedKeywords as any[]) {
    try {
      const result = await expandSeedKeyword(seedKeyword as SeedKeyword, locationCode, languageCode)
      
      // Persist long-tail keywords
      if (result.longtails.length > 0) {
        await persistLongtailKeywords(workflowId, seedKeyword as SeedKeyword, result.longtails)
        await updateSeedKeywordStatus(seedKeyword.id)
      }
      
      results.push(result)
      totalLongtailsCreated += result.longtails_created
      
      // Emit analytics event
      emitAnalyticsEvent({
        event_type: 'longtail_keywords_expanded',
        timestamp: new Date().toISOString(),
        organization_id: organizationId,
        workflow_id: workflowId,
        seed_keyword: seedKeyword.keyword,
        longtails_created: result.longtails_created,
        sources: ['related', 'suggestions', 'ideas', 'autocomplete']
      })
      
    } catch (error) {
      console.error(`[LongtailExpander] Failed to expand seed keyword "${seedKeyword.keyword}":`, error)
      
      results.push({
        seed_keyword_id: seedKeyword.id,
        seed_keyword: seedKeyword.keyword,
        longtails_created: 0,
        longtails: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }
  
  console.log(`[LongtailExpander] Completed expansion. Created ${totalLongtailsCreated} long-tails from ${seedKeywords.length} seeds`)
  
  return {
    workflow_id: workflowId,
    total_longtails_created: totalLongtailsCreated,
    seeds_processed: seedKeywords.length,
    results
  }
}
