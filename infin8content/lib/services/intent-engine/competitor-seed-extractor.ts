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

  if (!workflowId) {
    throw new Error('Workflow ID is required for seed keyword extraction')
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

  for (const competitor of competitors as CompetitorData[]) {
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

      const competitorId = competitor.id as string
      if (!competitorId) {
        throw new Error(`Competitor ID is required for ${competitor.url}`)
      }

      await persistSeedKeywords(organizationId, workflowId, competitorId, keywords)
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

  // Log partial success for visibility
  if (competitorsFailed > 0) {
    console.log(`[CompetitorSeedExtractor] Partial success: ${competitorsProcessed}/${competitors.length} competitors processed successfully`)
  }

  const totalElapsedMs = Date.now() - startTime
  console.log(
    `[CompetitorSeedExtractor] Extraction completed in ${totalElapsedMs}ms: ${totalKeywordsCreated} keywords created`
  )

  // Return neutral result - service layer is pure data collection
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

      // Extract actual keyword items from nested DataForSEO structure
      const taskResults = task.result?.flatMap((r: any) => r.items || []) || []

      if (!Array.isArray(taskResults) || taskResults.length === 0) {
        console.warn(`No keyword items returned from DataForSEO for ${url}`)
        return []
      }

      // Sort by keyword_info.search_volume (nested structure)
      const sortedKeywords = taskResults
        .sort((a: any, b: any) => 
          (b.keyword_info?.search_volume || 0) - (a.keyword_info?.search_volume || 0)
        )
        .slice(0, maxKeywords)

      console.log(`[DataForSEO DEBUG] Extracted ${taskResults.length} keyword items from DataForSEO response`)

      // DEBUG: Log the raw DataForSEO response structure
      console.log(`[DataForSEO DEBUG] Raw item structure for ${url}:`, JSON.stringify(taskResults.slice(0, 2), null, 2))
      
      // DEBUG: Log each result to understand filtering
      console.log(`[DataForSEO DEBUG] Analyzing ${taskResults.length} keyword items for filtering:`)
      taskResults.forEach((result: any, index: number) => {
        console.log(`[DataForSEO DEBUG] Item ${index}:`, {
          keyword: result.keyword,
          keywordType: typeof result.keyword,
          keywordLength: result.keyword?.length,
          keywordTrimmed: result.keyword?.trim(),
          keywordTrimmedLength: result.keyword?.trim()?.length,
          hasKeyword: !!result.keyword,
          isString: typeof result.keyword === 'string',
          passesLengthCheck: result.keyword && typeof result.keyword === 'string' && result.keyword.trim().length > 0,
          searchVolume: result.keyword_info?.search_volume,
          competitionLevel: result.keyword_info?.competition_level
        })
      })

      // Filter out null/undefined keywords and map to seed keyword format
      const validKeywords = sortedKeywords
        .filter((result: any) => result.keyword && typeof result.keyword === 'string' && result.keyword.trim().length > 0)
      
      console.log(`[DataForSEO DEBUG] Filtered ${validKeywords.length} valid keywords from ${sortedKeywords.length} total`)

      return validKeywords.map((result: any) => ({
          seed_keyword: result.keyword.trim(),
          search_volume: result.keyword_info?.search_volume ?? 0,
          competition_level: result.keyword_info?.competition_level ?? 'low',
          competition_index: result.keyword_info?.competition_index ?? 0,
          keyword_difficulty: result.keyword_properties?.keyword_difficulty ?? result.keyword_info?.competition_index ?? 0,
          cpc: result.keyword_info?.cpc ?? null,
          
          // NEW TAGGING FIELDS FOR DECISION TRACKING
          detected_language: result.keyword_properties?.detected_language ?? null,
          is_foreign_language: result.keyword_properties?.is_another_language ?? false,
          main_intent: result.search_intent_info?.main_intent ?? null,
          is_navigational: result.search_intent_info?.main_intent === 'navigational',
          foreign_intent: result.search_intent_info?.foreign_intent ?? null,
          
          // DECISION TRACKING FIELDS
          ai_suggested: true, // AI initially suggests all extracted keywords
          user_selected: true, // Default to selected for human review
          decision_confidence: calculateKeywordConfidence(result),
          selection_source: 'ai',
          selection_timestamp: new Date().toISOString()
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
 * Persist seed keywords to database with AI metadata
 */
export async function persistSeedKeywords(
  organizationId: string,
  workflowId: string,
  competitorUrlId: string,
  keywords: SeedKeywordData[]
): Promise<number> {
  const supabase = createServiceRoleClient()

  if (keywords.length === 0) {
    console.warn(`[persistSeedKeywords] No valid keywords to persist for competitor ${competitorUrlId}`)
    return 0
  }

  // Create keyword records with ALL AI metadata fields
  const keywordRecords = keywords
    .filter(keyword => keyword.seed_keyword && keyword.seed_keyword.trim().length > 0)
    .map(keyword => ({
      organization_id: organizationId,
      workflow_id: workflowId, // Critical for workflow isolation
      competitor_url_id: competitorUrlId,
      seed_keyword: keyword.seed_keyword.trim(),
      keyword: keyword.seed_keyword.trim(), // Same as seed_keyword at this stage
      search_volume: keyword.search_volume,
      competition_level: keyword.competition_level,
      competition_index: keyword.competition_index,
      keyword_difficulty: keyword.keyword_difficulty,
      cpc: keyword.cpc,
      longtail_status: 'not_started',
      subtopics_status: 'not_started',
      article_status: 'not_started',
      
      // AI Copilot metadata fields
      detected_language: keyword.detected_language,
      is_foreign_language: keyword.is_foreign_language,
      main_intent: keyword.main_intent,
      is_navigational: keyword.is_navigational,
      foreign_intent: keyword.foreign_intent,
      ai_suggested: keyword.ai_suggested,
      user_selected: keyword.user_selected,
      decision_confidence: keyword.decision_confidence,
      selection_source: keyword.selection_source,
      selection_timestamp: keyword.selection_timestamp,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

  if (keywordRecords.length === 0) {
    console.warn(`[persistSeedKeywords] No valid keyword records after filtering for competitor ${competitorUrlId}`)
    return 0
  }

  // Use enterprise-safe upsert that preserves human decisions
  const { error: upsertError, data } = await supabase
    .from('keywords')
    .upsert(keywordRecords, {
      onConflict: 'organization_id,workflow_id,seed_keyword'
    })
    .select('id')

  if (upsertError) {
    throw new Error(`Failed to persist seed keywords: ${upsertError.message}`)
  }

  // Enterprise safety: Detect actual database conflicts, not assumed reruns
  const keywordSeeds = keywordRecords.map(k => k.seed_keyword)
  
  if (keywordSeeds.length > 0) {
    try {
      // Check for actual existing keywords in database
      const { data: existingKeywords, error: checkError } = await supabase
        .from('keywords')
        .select('seed_keyword, selection_source, user_selected, decision_confidence')
        .in('seed_keyword', keywordSeeds)
        .eq('organization_id', organizationId)
        .eq('workflow_id', workflowId)

      if (checkError) {
        console.warn(`[persistSeedKeywords] Failed to check existing keywords: ${checkError.message}`)
      } else if (existingKeywords && Array.isArray(existingKeywords) && existingKeywords.length > 0) {
        // TRUE RERUN DETECTED: Actual database conflicts found
        console.warn(`[persistSeedKeywords] STEP 2 RERUN DETECTED - ${existingKeywords.length} existing keywords found`)
        console.warn(`[persistSeedKeywords] Workflow: ${workflowId}, Organization: ${organizationId}`)
        
        // Check for human decisions that could be overwritten
        const humanDecisions = existingKeywords.filter((k: any) => k.selection_source === 'user')
        if (humanDecisions.length > 0) {
          console.error(`[persistSeedKeywords] CRITICAL: ${humanDecisions.length} human decisions at risk of overwrite`)
          console.error(`[persistSeedKeywords] Keywords with human decisions: ${humanDecisions.map((k: any) => k.seed_keyword).join(', ')}`)
        } else {
          console.log(`[persistSeedKeywords] All existing keywords are AI-suggested - safe to update`)
        }
        
        // TODO: Implement conflict-safe upsert to preserve human decisions
        console.warn(`[persistSeedKeywords] NOTE: Human decision preservation not yet implemented - decisions may be overwritten`)
      } else {
        console.log(`[persistSeedKeywords] All ${keywordRecords.length} keywords are new for workflow ${workflowId}`)
      }
    } catch (error) {
      console.warn(`[persistSeedKeywords] Error checking existing keywords: ${error}`)
    }
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

// Service layer is pure - no state mutations here
// All workflow updates should be handled in the API layer

/**
 * Calculate AI confidence score for keyword selection (0.0-1.0)
 * Based on volume, CPC, and intent signals
 */
function calculateKeywordConfidence(result: any): number {
  let confidence = 0.5 // Base confidence

  // Volume factor (higher volume = higher confidence)
  const volume = result.keyword_info?.search_volume ?? 0
  if (volume > 1000) confidence += 0.3
  else if (volume > 100) confidence += 0.2
  else if (volume > 10) confidence += 0.1

  // CPC factor (has CPC = commercial value)
  const cpc = result.keyword_info?.cpc ?? 0
  if (cpc > 0) {
    confidence += 0.2
  }

  // Intent factor (commercial > informational > navigational)
  const intent = result.search_intent_info?.main_intent?.toLowerCase()
  if (intent === 'commercial') confidence += 0.2
  else if (intent === 'informational') confidence += 0.1
  else if (intent === 'navigational') confidence -= 0.1

  // Language factor (English preferred for most SEO campaigns)
  const isForeign = result.keyword_properties?.is_another_language ?? false
  if (!isForeign) {
    confidence += 0.1
  }

  // Cap at 1.0
  return Math.min(Math.max(confidence, 0.0), 1.0)
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
    updated_at: new Date().toISOString()
  }

  if (lastErrorMessage) {
    updateData.step_2_competitor_error_message = lastErrorMessage
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
