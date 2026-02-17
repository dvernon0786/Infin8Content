/**
 * Long-Tail Keyword Expander Service (Hardened + Parallelized)
 * Production-grade implementation
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { RetryPolicy, retryWithPolicy } from './retry-utils'
import { emitAnalyticsEvent } from '../analytics/event-emitter'
import { resolveLocationCode, resolveLanguageCode } from '@/lib/config/dataforseo-geo'

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

export const LONGTAIL_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  maxDelayMs: 8000
}

const DATAFORSEO_BASE = 'https://api.dataforseo.com/v3'

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export interface SeedKeyword {
  id: string
  keyword: string
  organization_id: string
  competitor_url_id: string
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

interface DataForSEOResponse {
  status_code: number
  status_message: string
  tasks_error?: number
  tasks?: Array<{
    status_code: number
    status_message: string
    result?: any[]
  }>
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

/* -------------------------------------------------------------------------- */
/*                              API CORE LAYER                                */
/* -------------------------------------------------------------------------- */

async function makeDataForSEORequest(
  endpoint: string,
  payload: unknown
): Promise<DataForSEOResponse> {

  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured')
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64')

  const response = await fetch(`${DATAFORSEO_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/* -------------------------------------------------------------------------- */
/*                          RESPONSE VALIDATION LAYER                         */
/* -------------------------------------------------------------------------- */

function extractTaskItems(
  response: DataForSEOResponse,
  endpoint: string
): any[] {

  if (
    response.status_code !== 20000 ||
    (typeof response.tasks_error === 'number' && response.tasks_error > 0)
  ) {
    throw new Error(
      `${endpoint} failed: ${response.status_message} (code=${response.status_code})` 
    )
  }

  const task = response.tasks?.[0]

  if (!task || task.status_code !== 20000) {
    throw new Error(`${endpoint} task failed: ${task?.status_message ?? 'unknown'}`)
  }

  if (!Array.isArray(task.result) || task.result.length === 0) {
    return []
  }

  const block = task.result[0]

  if (!block || !Array.isArray(block.items)) {
    return []
  }

  return block.items
}

/* -------------------------------------------------------------------------- */
/*                              DATA MAPPERS                                  */
/* -------------------------------------------------------------------------- */

function mapCompetitionLevel(value: unknown): 'low' | 'medium' | 'high' {
  if (value === null || value === undefined) return 'low'

  if (typeof value === 'string') {
    const v = value.toLowerCase()
    if (v.includes('low')) return 'low'
    if (v.includes('medium')) return 'medium'
    if (v.includes('high')) return 'high'
  }

  const num = Number(value)
  if (isNaN(num)) return 'low'

  // Detect 0–1 scale
  if (num <= 1) {
    if (num <= 0.33) return 'low'
    if (num <= 0.66) return 'medium'
    return 'high'
  }

  // 0–100 scale
  if (num <= 33) return 'low'
  if (num <= 66) return 'medium'
  return 'high'
}

function normalizeCompetitionIndex(value: unknown): number {
  const num = Number(value ?? 0)
  if (isNaN(num)) return 0

  // 0–1 scale → convert to 0–100
  if (num <= 1) {
    return Math.round(num * 100)
  }

  return Math.round(num)
}

function normalizeInteger(value: unknown): number {
  const num = Number(value ?? 0)
  if (isNaN(num)) return 0
  return Math.round(num)
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase()
}

function deduplicate(keywords: LongtailKeywordData[]): LongtailKeywordData[] {
  const seen = new Set<string>()
  return keywords.filter(k => {
    const norm = normalizeKeyword(k.keyword)
    if (!norm || seen.has(norm)) return false
    seen.add(norm)
    return true
  })
}

/* -------------------------------------------------------------------------- */
/*                             SOURCE FETCHERS                                */
/* -------------------------------------------------------------------------- */

async function fetchSource(
  endpoint: string,
  source: LongtailKeywordData['source'],
  seed: string,
  locationCode: number,
  languageCode: string
): Promise<LongtailKeywordData[]> {

  const payload = [{
    keyword: seed,
    location_code: locationCode,
    language_code: languageCode,
    limit: 3
  }]

  const response = await retryWithPolicy(
    () => makeDataForSEORequest(endpoint, payload),
    LONGTAIL_RETRY_POLICY,
    `DataForSEO:${source}` 
  )

  const items = extractTaskItems(response, source)

  return items.map((item: any): LongtailKeywordData | null => {

    if (source === 'autocomplete') {
      const keyword = item.keyword || item.q
      if (!keyword || !keyword.trim()) return null

      return {
        keyword: keyword.trim(),
        search_volume: 0,
        competition_level: 'low',
        competition_index: 0,
        keyword_difficulty: 0,
        source
      }
    }

    const data = item.keyword_data
    const info = data?.keyword_info ?? {}

    if (!data?.keyword) return null

    return {
      keyword: data.keyword,
      search_volume: info.search_volume ?? 0,
      competition_level: mapCompetitionLevel(info.competition),
      competition_index: normalizeCompetitionIndex(info.competition),
      keyword_difficulty: normalizeInteger(
        data?.keyword_properties?.keyword_difficulty
      ),
      cpc: info.cpc,
      source
    }
  }).filter((k): k is LongtailKeywordData => k !== null)
}

/* -------------------------------------------------------------------------- */
/*                           SEED EXPANSION LOGIC                             */
/* -------------------------------------------------------------------------- */

async function expandSingleSeed(
  seed: SeedKeyword,
  locationCode: number,
  languageCode: string
) {

  const endpoints = [
    ['/dataforseo_labs/google/related_keywords/live', 'related'],
    ['/dataforseo_labs/google/keyword_suggestions/live', 'suggestions'],
    ['/dataforseo_labs/google/keyword_ideas/live', 'ideas'],
    ['/serp/google/autocomplete/live/advanced', 'autocomplete']
  ] as const

  const results = await Promise.allSettled(
    endpoints.map(([endpoint, source]) =>
      fetchSource(endpoint, source, seed.keyword, locationCode, languageCode)
    )
  )

  const collected: LongtailKeywordData[] = []
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      collected.push(...result.value)
    } else {
      errors.push(result.reason?.message ?? 'Unknown error')
    }
  }

  const unique = deduplicate(collected).slice(0, 12)

  return {
    seed_keyword_id: seed.id,
    seed_keyword: seed.keyword,
    longtails_created: unique.length,
    longtails: unique,
    errors
  }
}

/* -------------------------------------------------------------------------- */
/*                          PERSISTENCE (BULK INSERT)                         */
/* -------------------------------------------------------------------------- */

async function persistLongtails(
  workflowId: string,
  seed: SeedKeyword,
  longtails: LongtailKeywordData[]
) {
  const supabase = createServiceRoleClient()

  if (longtails.length) {
    const rows = longtails.map(lt => ({
      workflow_id: workflowId,
      organization_id: seed.organization_id,
      competitor_url_id: seed.competitor_url_id,
      seed_keyword: seed.keyword,
      keyword: lt.keyword,
      search_volume: lt.search_volume,
      competition_level: lt.competition_level,
      competition_index: lt.competition_index,
      keyword_difficulty: lt.keyword_difficulty,
      cpc: lt.cpc,
      parent_seed_keyword_id: seed.id,
      longtail_status: 'not_started',
      subtopics_status: 'not_started',
      article_status: 'not_started'
    }))

    const { error } = await supabase.from('keywords').insert(rows)

    if (error && error.code !== '23505') {
      throw new Error(`Bulk insert failed: ${error.message}`)
    }
  }

  // ALWAYS mark seed completed - ensures deterministic workflow integrity
  const { error: updateError } = await supabase
    .from('keywords')
    .update({ longtail_status: 'completed' })
    .eq('id', seed.id)

  if (updateError) {
    throw new Error(`Seed status update failed: ${updateError.message}`)
  }
}

/* -------------------------------------------------------------------------- */
/*                            MAIN ENTRYPOINT                                 */
/* -------------------------------------------------------------------------- */

export async function expandSeedKeywordsToLongtails(
  workflowId: string
) {

  const supabase = createServiceRoleClient()

  const { data: workflow, error: workflowError } = await supabase
    .from('intent_workflows')
    .select('organization_id')
    .eq('id', workflowId)
    .single()

  if (workflowError || !workflow) throw new Error('Workflow not found')

  const orgId = (workflow as unknown as { organization_id: string }).organization_id

  const { data: seeds, error: seedsError } = await supabase
    .from('keywords')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('organization_id', orgId)
    .is('parent_seed_keyword_id', null)
    .eq('longtail_status', 'not_started')

  if (seedsError || !seeds?.length) {
    return {
      workflow_id: workflowId,
      seeds_processed: 0,
      total_longtails_created: 0,
      results: []
    }
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('keyword_settings')
    .eq('id', orgId)
    .single()

  if (orgError || !org) {
    throw new Error('Organization not found')
  }

  const orgData = org as { keyword_settings?: { target_region?: string; language_code?: string } }
  const locationCode = resolveLocationCode(orgData.keyword_settings?.target_region)
  const languageCode = resolveLanguageCode(orgData.keyword_settings?.language_code)

  const results = []
  let total = 0

  for (const seed of seeds as unknown as SeedKeyword[]) {
    const expansion = await expandSingleSeed(seed, locationCode, languageCode)

    await persistLongtails(workflowId, seed, expansion.longtails)

    results.push(expansion)
    total += expansion.longtails_created

    emitAnalyticsEvent({
      event_type: 'longtail_keywords_expanded',
      timestamp: new Date().toISOString(),
      organization_id: orgId,
      workflow_id: workflowId,
      seed_keyword: seed.keyword,
      longtails_created: expansion.longtails_created
    })
  }

  return {
    workflow_id: workflowId,
    seeds_processed: seeds.length,
    total_longtails_created: total,
    results
  }
}
