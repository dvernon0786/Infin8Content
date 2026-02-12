/**
 * ICP Generator Service
 *
 * Production Configuration
 * Primary Model: perplexity/sonar
 * Fallback Model: openai/gpt-4o-mini
 * Temperature: 0.3
 * Max Tokens: 700 (optimized for structured JSON)
 * Fallback: Enabled (controlled)
 * Cost Tracking: Enabled
 * Model Normalization: Enabled
 */

import { generateContent, type OpenRouterMessage, MODEL_PRICING } from '@/lib/services/openrouter/openrouter-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'
import {
  isRetryableError,
  calculateBackoffDelay,
  sleep,
  classifyErrorType,
  DEFAULT_RETRY_POLICY,
  type RetryPolicy
} from './retry-utils'

export interface ICPData {
  industries: string[]
  buyerRoles: string[]
  painPoints: string[]
  valueProposition: string
  generatedAt: string
  apiVersion: string
}

export interface ICPGenerationRequest {
  organizationName: string
  organizationUrl: string
  organizationLinkedInUrl: string
}

export interface ICPGenerationResult {
  icp_data: ICPData
  tokensUsed: number
  promptTokens: number
  completionTokens: number
  modelUsed: string
  generatedAt: string
  cost: number
  retryCount?: number
  lastError?: string
}

/**
 * Extract JSON from LLM response, handling markdown-wrapped JSON
 * @param raw - Raw LLM response text
 * @returns Clean JSON string ready for JSON.parse()
 * @throws Error if response is not valid JSON
 */
function extractJson(raw: string): string {
  const trimmed = raw.trim()

  // Case 1: Markdown fenced JSON
  if (trimmed.startsWith('```')) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (!match) {
      throw new Error('JSON markdown block malformed')
    }
    return match[1].trim()
  }

  // Case 2: Raw JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed
  }

  // Anything else is invalid
  throw new Error('Response is not valid JSON')
}

/**
 * Generate ICP document using Perplexity API via OpenRouter with automatic retry
 * 
 * @param request - Organization profile data for ICP generation
 * @param organizationId - Organization ID for tracking and storage
 * @param timeoutMs - Timeout per attempt in milliseconds
 * @param retryPolicy - Retry configuration (uses defaults if not provided)
 * @param idempotencyKey - Idempotency key for retry safety (generated at request boundary)
 * @returns Generated ICP data with metadata including retry information
 */
export async function generateICPDocument(
  request: ICPGenerationRequest,
  organizationId: string,
  timeoutMs: number = 300000, // 5 minutes default
  retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY,
  workflowId: string = '',
  idempotencyKey: string = `${workflowId}:step_1_icp`
): Promise<ICPGenerationResult> {
  let lastError: Error | null = null
  let retryCount = 0

  for (let attempt = 0; attempt < retryPolicy.maxAttempts; attempt++) {
    try {
      const result = await generateICPDocumentAttempt(request, organizationId, timeoutMs, retryCount, workflowId)
      
      // Success on first attempt or after retry
      if (attempt > 0) {
        result.retryCount = attempt
        console.log(`[ICP-Generator] ICP generation succeeded on retry attempt ${attempt}`)
      }
      
      return result
    } catch (error) {
      lastError = error as Error
      retryCount = attempt + 1

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error(`[ICP-Generator] Non-retryable error on attempt ${attempt + 1}:`, error)
        throw error
      }

      // Check if we have more attempts
      if (attempt < retryPolicy.maxAttempts - 1) {
        const delayMs = calculateBackoffDelay(attempt, retryPolicy)
        const errorType = classifyErrorType(error)
        
        console.warn(
          `[ICP-Generator] Retryable error on attempt ${attempt + 1} (${errorType}). ` +
          `Retrying in ${delayMs}ms...`,
          error
        )

        // Emit retry analytics event
        emitAnalyticsEvent({
          event_type: 'workflow_step_retry',
          organization_id: organizationId,
          workflow_id: workflowId,
          attempt_number: attempt + 1,
          error_type: errorType,
          delay_before_retry_ms: delayMs,
          timestamp: new Date().toISOString()
        })

        await sleep(delayMs)
      }
    }
  }

  // All retries exhausted
  const finalError = lastError || new Error('ICP generation failed after all retry attempts')
  const errorType = classifyErrorType(finalError)
  
  console.error(
    `[ICP-Generator] ICP generation failed after ${retryCount} attempts. ` +
    `Final error type: ${errorType}`,
    finalError
  )

  // Emit terminal failure analytics event
  emitAnalyticsEvent({
    event_type: 'workflow_step_terminal_failure',
    organization_id: organizationId,
    workflow_id: workflowId,
    total_attempts: retryCount,
    final_error_type: errorType,
    final_error_message: finalError.message,
    timestamp: new Date().toISOString()
  })

  throw finalError
}

/**
 * Get current AI cost for a workflow (fallback method)
 */
async function getWorkflowCurrentCost(workflowId: string): Promise<number> {
  const supabase = createServiceRoleClient()
  const { data: existing } = await supabase
    .from('intent_workflows')
    .select('workflow_data')
    .eq('id', workflowId)
    .single()
  
  if (!existing) {
    return 0
  }
  
  return (existing as any)?.workflow_data?.total_ai_cost ?? 0
}

/**
 * Atomically check if workflow can accept additional cost (no update)
 */
async function checkWorkflowCostLimit(
  workflowId: string, 
  estimatedCost: number, 
  maxCost: number = 1.00
): Promise<boolean> {
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .rpc('check_workflow_cost_limit', {
      p_workflow_id: workflowId,
      p_additional_cost: estimatedCost,
      p_max_cost: maxCost
    })
  
  if (error) {
    console.error('Cost limit check failed:', error)
    throw new Error('Cost enforcement system error')
  }
  
  return data === true
}

/**
 * Single attempt at ICP generation (internal)
 */
async function generateICPDocumentAttempt(
  request: ICPGenerationRequest,
  organizationId: string,
  timeoutMs: number = 300000,
  retryCount: number = 0,
  workflowId?: string
): Promise<ICPGenerationResult> {
  const startTime = Date.now()

  // Pre-call atomic cost guard to prevent spending before API call
  if (workflowId) {
    // Calculate estimated max cost based on centralized pricing table
    const maxInputTokens = 800 // Conservative estimate for prompt
    const maxOutputTokens = 700 // Max tokens allowed
    const sonarPricing = MODEL_PRICING['perplexity/sonar']
    
    const estimatedMaxCost = (
      (maxInputTokens / 1000) * sonarPricing.inputPer1k +
      (maxOutputTokens / 1000) * sonarPricing.outputPer1k
    )
    
    const canProceed = await checkWorkflowCostLimit(
      workflowId, 
      estimatedMaxCost, 
      1.00 // $1.00 max per workflow
    )
    
    if (!canProceed) {
      throw new Error(`Workflow AI cost limit exceeded (estimated: $${estimatedMaxCost.toFixed(4)})`)
    }
  }

  // Validate inputs
  if (!request.organizationName || !request.organizationUrl || !request.organizationLinkedInUrl) {
    throw new Error('Organization name, URL, and LinkedIn URL are required')
  }

  // Validate URL formats
  try {
    new URL(request.organizationUrl)
    new URL(request.organizationLinkedInUrl)
  } catch (e) {
    throw new Error('Invalid URL format for organization_url or organization_linkedin_url')
  }

  // System prompt for ICP analysis
  const systemPrompt = `## Role
You are an expert Business Intelligence Analyst specializing in creating comprehensive Ideal Customer Profile (ICP) analyses.
Your purpose is to research and analyze companies to develop detailed customer personas, pain points, and market positioning insights for strategic business development.

## Constraints
- Must research all three provided inputs (company name, URL, LinkedIn URL) thoroughly
- Generate specific, actionable ICP insights rather than generic business descriptions
- Focus on B2B customer characteristics and pain points
- Ensure all sections are completed with detailed, research-backed information
- Maintain professional business analysis tone throughout
- Base conclusions on actual company data found through research
- If insufficient data is found, clearly indicate limitations and provide best estimates
- Do not make assumptions about company operations without supporting evidence`

  // User prompt with organization data
  const userPrompt = `## Inputs
- **Company Name** (required): ${request.organizationName}
- **Company URL** (required): ${request.organizationUrl}
- **Company LinkedIn URL** (required): ${request.organizationLinkedInUrl}

## Instructions

### Research Phase:
1. Search for comprehensive company information using the company name and URL
2. Analyze the company's website to understand their products, services, and target market
3. Research the company's LinkedIn presence for additional business insights
4. Gather information about company size, industry, and business model
5. Identify key stakeholders and decision-makers from available sources

### Analysis Phase:
1. Synthesize research findings to create detailed ICP components
2. Develop specific product/service descriptions based on actual offerings
3. Identify target customer segments based on company positioning
4. Analyze market challenges the company's customers likely face
5. Determine customer objectives and current solution approaches

### Output Generation:
Generate a comprehensive ICP analysis with the following five sections:

1. **Product Description**
   - Detailed explanation of the company's core product or service offering
   - Key features and benefits that differentiate the solution
   - Implementation approach and delivery method
   - Target use cases and applications

2. **Who are the ICP?**
   - Specific business characteristics (size, revenue, industry)
   - Geographic and operational details
   - Key decision-maker roles and demographics
   - Organizational structure and team composition

3. **Pain Points / Challenges**
   - Primary operational challenges faced by target customers
   - Technical or process limitations in current state
   - Resource constraints and capability gaps
   - Market or competitive pressures affecting the business

4. **Key Goals / Objectives**
   - Strategic business objectives driving purchasing decisions
   - Operational improvements sought by target customers
   - Performance metrics and success criteria
   - Growth and scaling aspirations

5. **How do they currently solve their problems?**
   - Existing tools, systems, and processes in use
   - Workarounds and manual solutions currently employed
   - Current solution limitations and gaps

## Error Handling
- If company information is limited or unclear, indicate data limitations and provide analysis based on available information
- If the company URL is inaccessible, focus research on company name and LinkedIn data
- If LinkedIn URL provides minimal information, supplement with additional web searches
- If the company operates in an unfamiliar industry, research industry standards and common practices
- If conflicting information is found across sources, prioritize the most recent and authoritative data
- If the company appears to serve multiple market segments, identify the primary ICP and note secondary segments

## Output Rules (CRITICAL)

You MUST return STRICT JSON only.

- Do NOT wrap in markdown.
- Do NOT include commentary.
- Do NOT include explanations.
- Do NOT include section headings.
- Output must be valid JSON parsable by JSON.parse().

Return EXACTLY:

{
  "industries": string[],
  "buyerRoles": string[],
  "painPoints": string[],
  "valueProposition": string
}`

  // Call OpenRouter API with Perplexity model
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]

  try {
    // Wrap API call with timeout enforcement
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`ICP generation timeout: exceeded ${timeoutMs}ms limit`))
      }, timeoutMs)
    })

    const result = await Promise.race([
      generateContent(messages, {
        model: 'perplexity/sonar',
        maxTokens: 700,
        temperature: 0.3,
        maxRetries: 1,
        disableFallback: false
      }),
      timeoutPromise
    ])

    // Validate model used is in our allowed set (using normalized comparison)
    const allowedModels = ['perplexity/sonar', 'openai/gpt-4o-mini']
    const normalizedUsedModel = result.modelUsed.startsWith('perplexity/sonar') ? 'perplexity/sonar' :
                               result.modelUsed.startsWith('openai/gpt-4o-mini') ? 'openai/gpt-4o-mini' :
                               result.modelUsed

    if (!allowedModels.includes(normalizedUsedModel)) {
      throw new Error(`Model drift detected: expected one of ${allowedModels.join(', ')}, got ${result.modelUsed}`)
    }

    console.log(`[ICP] Model Used: ${result.modelUsed}, Cost: $${result.cost}`)

    // Parse JSON response (strip markdown formatting if present)
    let icpData: ICPData
    try {
      const jsonString = extractJson(result.content)
      const parsed = JSON.parse(jsonString)
      icpData = {
        industries: parsed.industries || [],
        buyerRoles: parsed.buyerRoles || [],
        painPoints: parsed.painPoints || [],
        valueProposition: parsed.valueProposition || '',
        generatedAt: new Date().toISOString(),
        apiVersion: '1.0'
      }
    } catch (parseError) {
      throw new Error(`Failed to parse ICP response: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

    // Validate ICP data structure
    validateICPData(icpData)

    const duration = Date.now() - startTime
    console.log(`[ICPGenerator] ICP generation completed in ${duration}ms using model: ${result.modelUsed}`)

    return {
      icp_data: icpData,
      tokensUsed: result.tokensUsed,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      modelUsed: result.modelUsed,
      generatedAt: new Date().toISOString(),
      cost: result.cost
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[ICPGenerator] ICP generation failed after ${duration}ms:`, error)
    throw error
  }
}

/**
 * Validate ICP data structure
 */
function validateICPData(data: ICPData): void {
  if (!Array.isArray(data.industries) || data.industries.length === 0) {
    throw new Error('ICP data must include at least one industry')
  }
  if (!Array.isArray(data.buyerRoles) || data.buyerRoles.length === 0) {
    throw new Error('ICP data must include at least one buyer role')
  }
  if (!Array.isArray(data.painPoints) || data.painPoints.length === 0) {
    throw new Error('ICP data must include at least one pain point')
  }
  if (!data.valueProposition || data.valueProposition.trim().length === 0) {
    throw new Error('ICP data must include a value proposition')
  }
}

/**
 * Store ICP generation result in workflow
 * Uses single atomic transaction for financial settlement and workflow state update
 * Includes idempotency protection for network retry safety
 * 
 * @param workflowId - Workflow ID
 * @param organizationId - Organization ID
 * @param icpResult - ICP generation result with metadata
 * @param idempotencyKey - Idempotency key for retry safety (generated at request boundary)
 */
export async function storeICPGenerationResult(
  workflowId: string,
  organizationId: string,
  icpResult: ICPGenerationResult,
  idempotencyKey: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  // 🏆 Elite atomic transaction: financial settlement + workflow state in single call
  const { error: atomicError } = await supabase
    .rpc('record_usage_increment_and_complete_step', {
      p_workflow_id: workflowId,
      p_organization_id: organizationId,
      p_model: icpResult.modelUsed,
      p_prompt_tokens: icpResult.promptTokens,
      p_completion_tokens: icpResult.completionTokens,
      p_cost: icpResult.cost,
      p_icp_data: icpResult.icp_data,
      p_tokens_used: icpResult.tokensUsed,
      p_generated_at: icpResult.generatedAt,
      p_idempotency_key: idempotencyKey
    })

  if (atomicError) {
    console.error('Failed to record usage and complete ICP step:', atomicError)
    throw new Error('Financial recording and workflow update failed')
  }

  console.log(`[ICPGenerator] Successfully completed ICP generation for workflow ${workflowId}`)
}

/**
 * Handle ICP generation failure
 */
export async function handleICPGenerationFailure(
  workflowId: string,
  organizationId: string,
  error: Error,
  retryCount: number = 0,
  lastErrorMessage: string | null = null
): Promise<void> {
  const supabase = createServiceRoleClient()

  // CANONICAL FAILURE STATE: Retryable failure keeps current_step = 1
  // Failure ≠ terminal. Terminal is only successful completion (current_step = 10).
  // This allows users to retry the step without workflow regression.
  const { error: updateError } = await supabase
    .from('intent_workflows')
    .update({
      status: 'failed',
      current_step: 1,  // Keep at step 1 for retry, not terminal
      step_1_icp_error_message: error.message,
      retry_count: retryCount,
      step_1_icp_last_error_message: lastErrorMessage || error.message,
      workflow_data: {
        icp_generation_error: {
          message: error.message,
          timestamp: new Date().toISOString(),
          retryCount,
          lastErrorMessage
        }
      }
    })
    .eq('id', workflowId)
    .eq('organization_id', organizationId)

  if (updateError) {
    console.error(`Failed to update workflow error status: ${updateError.message}`)
  }

  console.log(`[ICPGenerator] ICP generation failure recorded for workflow ${workflowId}`)
}

/**
 * Emit retry analytics event
 * 
 * Logs a retry attempt event for audit trail and analytics tracking.
 * This event is emitted when a transient failure occurs and the system
 * decides to retry the ICP generation.
 * 
 * @param event - Event data containing workflow ID, organization ID, attempt number, error type, and delay
 * @param event.workflowId - Unique identifier for the workflow
 * @param event.organizationId - Organization ID for tracking and multi-tenancy
 * @param event.attemptNumber - Current attempt number (1-indexed)
 * @param event.errorType - Classified error type (timeout, rate_limit, server_error, etc.)
 * @param event.delayBeforeRetryMs - Milliseconds to wait before retry (exponential backoff)
 */
function emitRetryAnalyticsEvent(event: {
  workflowId: string
  organizationId: string
  attemptNumber: number
  errorType: string
  delayBeforeRetryMs: number
}): void {
  const analyticsEvent = {
    event_type: 'workflow_step_retried',
    step: 'step_1_icp',
    workflow_id: event.workflowId,
    organization_id: event.organizationId,
    attempt_number: event.attemptNumber,
    error_type: event.errorType,
    delay_before_retry_ms: event.delayBeforeRetryMs,
    timestamp: new Date().toISOString()
  }
  emitAnalyticsEvent(analyticsEvent)
}

/**
 * Emit terminal failure analytics event
 * 
 * Logs a terminal failure event when all retry attempts have been exhausted.
 * This event indicates that the ICP generation has permanently failed and
 * requires manual intervention or user retry.
 * 
 * @param event - Event data containing workflow ID, organization ID, total attempts, and final error message
 * @param event.workflowId - Unique identifier for the workflow
 * @param event.organizationId - Organization ID for tracking and multi-tenancy
 * @param event.totalAttempts - Total number of attempts made (including initial attempt)
 * @param event.finalErrorMessage - Error message from the final failed attempt
 */
function emitTerminalFailureAnalyticsEvent(event: {
  workflowId: string
  organizationId: string
  totalAttempts: number
  finalErrorMessage: string
}): void {
  const analyticsEvent = {
    event_type: 'workflow_step_failed',
    step: 'step_1_icp',
    workflow_id: event.workflowId,
    organization_id: event.organizationId,
    total_attempts: event.totalAttempts,
    final_error_message: event.finalErrorMessage,
    timestamp: new Date().toISOString()
  }
  emitAnalyticsEvent(analyticsEvent)
}
