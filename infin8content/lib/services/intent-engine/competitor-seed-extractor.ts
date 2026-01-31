/**
 * Competitor Seed Keyword Extractor Service
 * Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
 * 
 * Extracts up to 3 seed keywords per competitor URL using DataForSEO's
 * keywords_for_site endpoint, establishing the foundation for the hub-and-spoke
 * SEO model.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { RetryPolicy, isRetryableError, calculateBackoffDelay, sleep, classifyErrorType } from './retry-utils'
import { emitAnalyticsEvent } from '../analytics/event-emitter'

export const COMPETITOR_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 4,        // initial + 3 retries
  initialDelayMs: 1000,  // 1 second
  backoffMultiplier: 2,  // exponential
  maxDelayMs: 30000      // 30 second cap
}

export interface CompetitorData {
  id: string
  url: string
  domain: string
  name?: string
  is_active: boolean
}

export interface SeedKeywordData {
  seed_keyword: string
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number
  keyword_difficulty: number
  cpc?: number
}

export interface DataForSEOKeywordResult {
  keyword: string
  search_volume: number
  competition_index: number
  keyword_difficulty?: number
  cpc?: number
}

export interface CompetitorSeedExtractionResult {
  competitor_id: string
  competitor_url: string
  seed_keywords_created: number
  keywords: SeedKeywordData[]
  error?: string
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

export interface ExtractSeedKeywordsResult {
  total_keywords_created: number
  competitors_processed: number
  competitors_failed: number
  results: CompetitorSeedExtractionResult[]
  error?: string
}

/**
 * Extract seed keywords from competitor URLs using DataForSEO
 * 
 * @param request - Extraction request with competitors and organization context
 * @returns Result with created keywords and processing status
 */
export async function extractSeedKeywords(
  request: ExtractSeedKeywordsRequest
): Promise<ExtractSeedKeywordsResult> {
  const {
    competitors,
    organizationId,
    workflowId,
    maxSeedsPerCompetitor = 3,
    locationCode = 2840,
    languageCode = 'en',
    timeoutMs = 600000
  } = request

  if (!competitors || competitors.length === 0) {
    throw new Error('No competitors provided for seed keyword extraction')
  }

  if (!organizationId) {
    throw new Error('Organization ID is required for seed keyword extraction')
  }

  console.log(`[CompetitorSeedExtractor] Starting extraction for ${competitors.length} competitors`)

  const results: CompetitorSeedExtractionResult[] = []
  let totalKeywordsCreated = 0
  let competitorsProcessed = 0
  let competitorsFailed = 0
  let totalRetryCount = 0

  // Distribute timeout across competitors (with 10% buffer for database operations)
  const perCompetitorTimeoutMs = Math.floor((timeoutMs * 0.9) / competitors.length)
  const startTime = Date.now()

  for (const competitor of competitors) {
    try {
      // Check if we've exceeded overall timeout
      const elapsedMs = Date.now() - startTime
      if (elapsedMs >= timeoutMs) {
        throw new Error('Seed keyword extraction timed out')
      }

      const keywords = await extractKeywordsFromCompetitor(
        competitor.url,
        maxSeedsPerCompetitor,
        locationCode,
        languageCode,
        perCompetitorTimeoutMs,
        workflowId,
        organizationId
      )

      await persistSeedKeywords(organizationId, competitor.id, keywords)
      totalKeywordsCreated += keywords.length
      competitorsProcessed++

      results.push({
        competitor_id: competitor.id,
        competitor_url: competitor.url,
        seed_keywords_created: keywords.length,
        keywords
      })

      console.log(`[CompetitorSeedExtractor] Created ${keywords.length} seed keywords for ${competitor.url}`)
    } catch (error) {
      competitorsFailed++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[CompetitorSeedExtractor] Failed to process competitor ${competitor.url}: ${errorMessage}`)

      results.push({
        competitor_id: competitor.id,
        competitor_url: competitor.url,
        seed_keywords_created: 0,
        keywords: [],
        error: errorMessage
      })
    }
  }

  if (competitorsProcessed === 0) {
    // Update workflow status to failed with retry metadata
    if (workflowId) {
      await updateWorkflowStatus(workflowId, organizationId, 'failed', 'All competitors failed during seed keyword extraction', totalRetryCount)
    }
    throw new Error('All competitors failed during seed keyword extraction')
  }

  // Update workflow status to success with retry metadata
  if (workflowId) {
    await updateWorkflowStatus(workflowId, organizationId, 'step_2_competitors', undefined, totalRetryCount)
  }

  const totalElapsedMs = Date.now() - startTime
  console.log(
    `[CompetitorSeedExtractor] Extraction completed in ${totalElapsedMs}ms: ${totalKeywordsCreated} keywords created`
  )

  return {
    total_keywords_created: totalKeywordsCreated,
    competitors_processed: competitorsProcessed,
    competitors_failed: competitorsFailed,
    results
  }
}

/**
 * Extract keywords from a single competitor URL using DataForSEO with retry logic
 */
async function extractKeywordsFromCompetitor(
  url: string,
  maxKeywords: number,
  locationCode: number,
  languageCode: string,
  timeoutMs?: number,
  workflowId?: string,
  organizationId?: string
): Promise<SeedKeywordData[]> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured')
  }

  // Prepare DataForSEO request
  const requestBody = [{
    target: url,
    location_code: locationCode,
    language_code: languageCode,
    limit: maxKeywords
  }]

  const authHeader = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64')

  let lastError: Error | null = null

  // Retry logic using retry-utils
  for (let attempt = 0; attempt < COMPETITOR_RETRY_POLICY.maxAttempts; attempt++) {
    try {
      const response = await fetch(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live',
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check for API-level errors
      if (data.status_code !== 20000) {
        const errorMessage = `DataForSEO API error: ${data.status_message}`

        // Handle rate limiting with Retry-After header
        if (data.status_code === 42900 && attempt < COMPETITOR_RETRY_POLICY.maxAttempts - 1) {
          const retryAfter = response.headers.get('Retry-After')
          let delay: number
          
          // Use Retry-After header if valid, otherwise use exponential backoff
          if (retryAfter) {
            const delaySeconds = parseInt(retryAfter, 10)
            if (!isNaN(delaySeconds) && delaySeconds > 0) {
              delay = delaySeconds * 1000
              console.warn(`DataForSEO rate limited (attempt ${attempt + 1}/${COMPETITOR_RETRY_POLICY.maxAttempts}), retrying after ${delay}ms (from Retry-After header)...`)
            } else {
              // Invalid Retry-After header, fall back to exponential backoff
              delay = calculateBackoffDelay(attempt, COMPETITOR_RETRY_POLICY)
              console.warn(`DataForSEO rate limited (attempt ${attempt + 1}/${COMPETITOR_RETRY_POLICY.maxAttempts}), retrying in ${delay}ms (exponential backoff)...`)
            }
          } else {
            // No Retry-After header, use exponential backoff
            delay = calculateBackoffDelay(attempt, COMPETITOR_RETRY_POLICY)
            console.warn(`DataForSEO rate limited (attempt ${attempt + 1}/${COMPETITOR_RETRY_POLICY.maxAttempts}), retrying in ${delay}ms (exponential backoff)...`)
          }
          
          // Update retry metadata before retry
          if (workflowId && organizationId) {
            await updateWorkflowRetryMetadata(workflowId, organizationId, attempt + 1, errorMessage)
          }
          
          await sleep(delay)
          continue
        }

        // Don't retry for API errors - mark as non-retryable
        const apiError = new Error(errorMessage) as Error & { isApiError: boolean }
        apiError.isApiError = true
        throw apiError
      }

      // Extract results from first task
      const task = data.tasks?.[0]
      if (!task || task.status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${task?.status_message || 'Unknown error'}`)
      }

      const taskResults = task.result
      if (!Array.isArray(taskResults)) {
        throw new Error(`DataForSEO API error: Invalid result format - expected array, got ${typeof taskResults}`)
      }
      
      if (taskResults.length === 0) {
        console.warn(`No keyword results returned from DataForSEO for ${url}`)
        return []
      }

      // Sort by search volume (descending) and take top N
      const sortedKeywords = taskResults
        .sort((a: any, b: any) => (b.search_volume || 0) - (a.search_volume || 0))
        .slice(0, maxKeywords)

      // Map to seed keyword format
      return sortedKeywords.map((result: any) => ({
        seed_keyword: result.keyword,
        search_volume: result.search_volume || 0,
        competition_level: mapCompetitionLevel(result.competition_index),
        competition_index: result.competition_index || 0,
        keyword_difficulty: result.keyword_difficulty || result.competition_index || 0,
        cpc: result.cpc
      }))
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        console.error(`DataForSEO API call failed with non-retryable error: ${lastError.message}`)
        throw lastError
      }

      // If not the last attempt, wait before retrying
      if (attempt < COMPETITOR_RETRY_POLICY.maxAttempts - 1) {
        const delay = calculateBackoffDelay(attempt, COMPETITOR_RETRY_POLICY)
        const errorType = classifyErrorType(lastError)
        console.warn(`DataForSEO API call failed (attempt ${attempt + 1}/${COMPETITOR_RETRY_POLICY.maxAttempts}), retrying in ${delay}ms... Error: ${lastError.message}`)
        
        // Update retry metadata before retry
        if (workflowId && organizationId) {
          await updateWorkflowRetryMetadata(workflowId, organizationId, attempt + 1, lastError.message)
        }
        
        // Emit retry analytics event
        if (workflowId && organizationId) {
          await emitRetryEvent(workflowId, organizationId, url, attempt + 1, errorType, delay)
        }
        
        await sleep(delay)
      }
    }
  }

  // All retries exhausted
  const errorType = classifyErrorType(lastError)
  console.error('DataForSEO API call failed after all retries:', lastError?.message)
  
  // Update final retry metadata
  if (workflowId && organizationId) {
    await updateWorkflowRetryMetadata(workflowId, organizationId, COMPETITOR_RETRY_POLICY.maxAttempts, lastError?.message)
  }
  
  // Emit terminal failure analytics event
  if (workflowId && organizationId) {
    await emitFailureEvent(workflowId, organizationId, url, COMPETITOR_RETRY_POLICY.maxAttempts, lastError?.message || 'Unknown error')
  }
  
  throw lastError || new Error('DataForSEO API call failed')
}

/**
 * Persist seed keywords to database
 */
async function persistSeedKeywords(
  organizationId: string,
  competitorUrlId: string,
  keywords: SeedKeywordData[]
): Promise<number> {
  const supabase = createServiceRoleClient()

  if (keywords.length === 0) {
    return 0
  }

  // Delete existing keywords for this competitor (idempotency)
  const { error: deleteError } = await supabase
    .from('keywords')
    .delete()
    .eq('organization_id', organizationId)
    .eq('competitor_url_id', competitorUrlId)

  if (deleteError) {
    throw new Error(`Failed to delete existing keywords for competitor ${competitorUrlId}: ${deleteError.message}`)
  }

  // Insert new keywords
  const keywordRecords = keywords.map(keyword => ({
    organization_id: organizationId,
    competitor_url_id: competitorUrlId,
    seed_keyword: keyword.seed_keyword,
    keyword: keyword.seed_keyword, // Same as seed_keyword at this stage
    search_volume: keyword.search_volume,
    competition_level: keyword.competition_level,
    competition_index: keyword.competition_index,
    keyword_difficulty: keyword.keyword_difficulty,
    cpc: keyword.cpc,
    longtail_status: 'not_started',
    subtopics_status: 'not_started',
    article_status: 'not_started',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  const { error: insertError, data } = await supabase
    .from('keywords')
    .insert(keywordRecords)
    .select('id')

  if (insertError) {
    throw new Error(`Failed to persist seed keywords: ${insertError.message}`)
  }

  return data?.length || 0
}

/**
 * Map competition index to competition level
 */
function mapCompetitionLevel(competitionIndex: number): 'low' | 'medium' | 'high' {
  if (competitionIndex < 33) return 'low'
  if (competitionIndex < 67) return 'medium'
  return 'high'
}

/**
 * Emit retry analytics event
 */
async function emitRetryEvent(
  workflowId: string,
  organizationId: string,
  url: string,
  attemptNumber: number,
  errorType: string,
  delayMs: number
): Promise<void> {
  emitAnalyticsEvent({
    event_type: 'workflow_step_retried',
    organization_id: organizationId,
    workflow_id: workflowId,
    step: 'step_2_competitors',
    attempt_number: attemptNumber,
    error_type: errorType,
    delay_before_retry_ms: delayMs,
    competitor_url: url,
    timestamp: new Date().toISOString()
  })
}

/**
 * Emit terminal failure analytics event
 */
async function emitFailureEvent(
  workflowId: string,
  organizationId: string,
  url: string,
  totalAttempts: number,
  finalErrorMessage: string
): Promise<void> {
  emitAnalyticsEvent({
    event_type: 'workflow_step_failed',
    organization_id: organizationId,
    workflow_id: workflowId,
    step: 'step_2_competitors',
    total_attempts: totalAttempts,
    final_error_message: finalErrorMessage,
    competitor_url: url,
    timestamp: new Date().toISOString()
  })
}


/**
 * Update workflow status after seed keyword extraction
 */
export async function updateWorkflowStatus(
  workflowId: string,
  organizationId: string,
  status: 'step_2_competitors' | 'failed',
  errorMessage?: string,
  retryCount?: number
): Promise<void> {
  const supabase = createServiceRoleClient()

  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'step_2_competitors') {
    updateData.step_2_competitor_completed_at = new Date().toISOString()
    // Preserve retry metadata on successful completion
    if (retryCount && retryCount > 0) {
      updateData.step_2_competitors_retry_count = retryCount
    }
  } else if (status === 'failed' && errorMessage) {
    updateData.step_2_competitors_last_error_message = errorMessage
    // Update retry metadata on failure
    if (retryCount !== undefined) {
      updateData.step_2_competitors_retry_count = retryCount
      updateData.step_2_competitors_last_error_message = errorMessage
    }
  }

  const { error } = await supabase
    .from('intent_workflows')
    .update(updateData)
    .eq('id', workflowId)
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to update workflow status: ${error.message}`)
  }

  console.log(`[CompetitorSeedExtractor] Workflow ${workflowId} status updated to ${status}`)
}

/**
 * Update workflow retry metadata during retry attempts
 */
export async function updateWorkflowRetryMetadata(
  workflowId: string,
  organizationId: string,
  retryCount: number,
  lastErrorMessage?: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  const updateData: any = {
    step_2_competitors_retry_count: retryCount,
    updated_at: new Date().toISOString()
  }

  if (lastErrorMessage) {
    updateData.step_2_competitors_last_error_message = lastErrorMessage
  }

  const { error } = await supabase
    .from('intent_workflows')
    .update(updateData)
    .eq('id', workflowId)
    .eq('organization_id', organizationId)

  if (error) {
    throw new Error(`Failed to update workflow retry metadata: ${error.message}`)
  }

  console.log(`[CompetitorSeedExtractor] Workflow ${workflowId} retry metadata updated: count=${retryCount}`)
}
