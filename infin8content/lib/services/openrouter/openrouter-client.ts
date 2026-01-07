/**
 * OpenRouter API Client
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens: number
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: 'stop' | 'length' | 'content_filter'
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenRouterGenerationOptions {
  maxRetries?: number
  retryDelay?: number
}

export interface OpenRouterGenerationResult {
  content: string
  tokensUsed: number
  modelUsed: string
  promptTokens: number
  completionTokens: number
}

/**
 * Free models available via OpenRouter (in priority order)
 */
export const FREE_MODELS = [
  'tns-standard/tns-standard-8-7.5-chimera', // Primary choice
  'meta-llama/llama-3bmo-v1-turbo', // Fast backup
  'nvidia/nemotron-3-demo-70b', // High quality
] as const

/**
 * Generate content using OpenRouter API
 * 
 * @param messages - System and user messages for the LLM
 * @param options - Optional retry configuration and model selection
 * @returns Generated content with token usage and model information
 */
export async function generateContent(
  messages: OpenRouterMessage[],
  options: OpenRouterGenerationOptions & {
    maxTokens?: number
    temperature?: number
    model?: string
  } = {}
): Promise<OpenRouterGenerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required')
  }

  const maxRetries = options.maxRetries ?? 3
  const baseDelay = options.retryDelay ?? 1000 // 1 second base delay
  const maxTokens = options.maxTokens ?? 2000
  const temperature = options.temperature ?? 0.7
  const requestedModel = options.model

  // Model selection with fallback chain
  const modelsToTry = requestedModel 
    ? [requestedModel, ...FREE_MODELS]
    : [...FREE_MODELS]

  let lastError: Error | null = null

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const requestBody: OpenRouterRequest = {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          top_p: 0.9,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://infin8content.com',
            'X-Title': 'Infin8Content'
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const error = new Error(
            `OpenRouter API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
          )
          
          // Don't retry on 401 (invalid API key)
          if (response.status === 401) {
            throw error
          }

          // Retry on 429 (rate limit) or 500 (server error) with exponential backoff
          if (response.status === 429 || response.status === 500) {
            lastError = error
            if (attempt < maxRetries - 1) {
              const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff: 1s, 2s, 4s
              await new Promise(resolve => setTimeout(resolve, delay))
              continue
            }
            // If this is the last model, throw error
            if (model === modelsToTry[modelsToTry.length - 1]) {
              throw error
            }
            // Otherwise, try next model
            break
          }

          throw error
        }

        const data: OpenRouterResponse = await response.json()
        
        if (!data.choices || data.choices.length === 0) {
          // Non-retryable error: API returned invalid response
          // Try next model if available
          if (model === modelsToTry[modelsToTry.length - 1]) {
            throw new Error('OpenRouter API returned no choices')
          }
          break // Try next model
        }

        const content = data.choices[0].message.content
        if (!content) {
          // Non-retryable error: API returned empty content
          // Try next model if available
          if (model === modelsToTry[modelsToTry.length - 1]) {
            throw new Error('OpenRouter API returned empty content')
          }
          break // Try next model
        }

        return {
          content,
          tokensUsed: data.usage.total_tokens,
          modelUsed: data.model,
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens
        }
      } catch (error) {
        // If it's a 401 error, don't retry
        if (error instanceof Error && error.message.includes('401')) {
          throw error
        }

        // Check if it's a non-retryable API response error
        if (error instanceof Error && (
          error.message.includes('no choices') || 
          error.message.includes('empty content')
        )) {
          // Already handled above, but if we get here, try next model
          if (model === modelsToTry[modelsToTry.length - 1]) {
            throw error
          }
          break
        }

        // Network errors or other retryable errors
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        // If this is the last model, throw error
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw lastError
        }
        // Otherwise, try next model
        break
      }
    }
  }

  // If we get here, all models failed
  throw lastError || new Error('All OpenRouter models failed')
}

