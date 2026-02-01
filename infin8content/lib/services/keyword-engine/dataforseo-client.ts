// DataForSEO client specialized for subtopic generation
// Story 37.1: Generate Subtopic Ideas via DataForSEO

export interface KeywordSubtopic {
  title: string
  keywords: string[]
}

export interface SubtopicGenerationParams {
  topic: string
  language: string
  locationCode: number
  limit?: number
}

interface DataForSEOSubtopicRequest {
  topic: string
  language: string
  location_code: number
  limit: number
}

interface DataForSEOSubtopicResponse {
  version?: string
  status_code: number
  status_message: string
  time?: string
  cost?: number
  result_count?: number
  tasks?: Array<{
    id?: string
    status_code: number
    status_message: string
    time?: string
    cost?: number
    result_count?: number
    path?: string[]
    data?: {
      api?: string
      function?: string
      topic?: string
      language?: string
      location_code?: number
      limit?: number
    }
    result?: Array<{
      title: string
      type: string
      keywords: string[]
    }>
  }>
}

export class DataForSEOSubtopicClient {
  private login: string
  private password: string
  private baseUrl = 'https://api.dataforseo.com'
  private maxRetries = 3
  private retryDelays = [2000, 4000, 8000] // Exponential backoff: 2s, 4s, 8s

  constructor(login: string, password: string) {
    this.login = login
    this.password = password
  }

  async generateSubtopics(
    topic: string,
    language: string,
    locationCode: number,
    limit: number = 3
  ): Promise<KeywordSubtopic[]> {
    // Validate required parameters
    if (!topic.trim()) {
      throw new Error('Topic is required')
    }
    if (!language.trim()) {
      throw new Error('Language is required')
    }
    if (!locationCode) {
      throw new Error('Location code is required')
    }

    const requestBody: DataForSEOSubtopicRequest[] = [{
      topic: topic.trim(),
      language: language.trim(),
      location_code: locationCode,
      limit: Math.min(limit, 10) // Cap at 10 for safety
    }]

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64')

    let lastError: Error | null = null

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${this.baseUrl}/v3/content_generation/generate_sub_topics/live`,
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

        const data: DataForSEOSubtopicResponse = await response.json()

        // Check for API-level errors
        if (data.status_code !== 20000) {
          const errorMessage = `DataForSEO API error: ${data.status_message}`
          
          // Handle rate limiting with Retry-After header (only retry for rate limits)
          if (data.status_code === 42900 && attempt < this.maxRetries - 1) {
            const retryAfter = response.headers.get('Retry-After')
            if (retryAfter) {
              const delay = parseInt(retryAfter, 10) * 1000
              console.warn(`DataForSEO API rate limited (attempt ${attempt + 1}/${this.maxRetries}), retrying after ${delay}ms...`)
              await this.delay(delay)
              continue
            }
          }
          
          // Don't retry for API errors (40000, 40100, 40200, etc.) - throw immediately
          // Use a custom error that won't be caught for retry
          const apiError = new Error(errorMessage) as Error & { isApiError: boolean }
          apiError.isApiError = true
          throw apiError
        }

        // Validate response structure
        if (!data.tasks || data.tasks.length === 0) {
          throw new Error('Invalid DataForSEO response format: no tasks found')
        }

        const task = data.tasks[0]
        if (task.status_code !== 20000) {
          throw new Error(`DataForSEO API error: ${task.status_message}`)
        }

        if (!task.result || !Array.isArray(task.result)) {
          throw new Error('Invalid DataForSEO response format: no result array found')
        }

        // Parse and validate subtopics
        const subtopics = task.result
          .filter(item => item.type === 'subtopic' && item.title && Array.isArray(item.keywords))
          .map(item => ({
            title: item.title.trim(),
            keywords: item.keywords.map(k => k.trim()).filter(k => k.length > 0)
          }))
          .filter(subtopic => subtopic.title.length > 0 && subtopic.keywords.length > 0)

        if (subtopics.length === 0) {
          console.warn('No valid subtopics found in DataForSEO response')
          return []
        }

        // Return exactly the requested number of subtopics
        return subtopics.slice(0, limit)

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry API errors (40000, 40100, 40200, etc.) - throw immediately
        if ((error as Error & { isApiError?: boolean }).isApiError) {
          throw error
        }
        
        // If not the last attempt, wait before retrying (only for network errors)
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelays[attempt]
          console.warn(`DataForSEO API call failed (attempt ${attempt + 1}/${this.maxRetries}), retrying in ${delay}ms...`, lastError.message)
          await this.delay(delay)
        }
      }
    }

    // All retries exhausted
    console.error('DataForSEO API call failed after all retries:', lastError)
    throw lastError || new Error('DataForSEO API call failed')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance for the application
let subtopicClientInstance: DataForSEOSubtopicClient | null = null

export function getDataForSEOSubtopicClient(): DataForSEOSubtopicClient {
  if (!subtopicClientInstance) {
    const login = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD
    
    if (!login) {
      throw new Error('DATAFORSEO_LOGIN environment variable is not set')
    }
    
    if (!password) {
      throw new Error('DATAFORSEO_PASSWORD environment variable is not set')
    }
    
    subtopicClientInstance = new DataForSEOSubtopicClient(login, password)
  }
  
  return subtopicClientInstance
}

/**
 * Generate subtopics using DataForSEO API
 * @param topic The main topic/keyword
 * @param language Language code (e.g., 'en')
 * @param locationCode Location code (e.g., 2840 for US)
 * @param limit Maximum number of subtopics to generate (default: 3)
 * @returns Array of subtopic ideas
 */
export async function generateSubtopics(
  topic: string,
  language: string,
  locationCode: number,
  limit: number = 3
): Promise<KeywordSubtopic[]> {
  const client = getDataForSEOSubtopicClient()
  return client.generateSubtopics(topic, language, locationCode, limit)
}
