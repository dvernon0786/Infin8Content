/**
 * Tavily API Client
 * Story 4a.3: Real-Time Research Per Section (Tavily Integration)
 */

export interface TavilySource {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  relevance_score: number
}

export interface TavilyResearchOptions {
  maxRetries?: number
  retryDelay?: number
  maxResults?: number  // Maximum number of results to request from Tavily API (default: 20)
  maxSources?: number   // Maximum number of sources to return after ranking (default: 10)
}

/**
 * Research query using Tavily API
 * 
 * @param query - Research query string
 * @param options - Optional configuration (retry settings, result limits)
 * @returns Array of research sources ranked by relevance
 */
export async function researchQuery(
  query: string,
  options: TavilyResearchOptions = {}
): Promise<TavilySource[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY environment variable is required')
  }

  const maxRetries = options.maxRetries ?? 3
  const baseDelay = options.retryDelay ?? 1000 // 1 second base delay
  
  // Get configurable limits from options or environment variables (with defaults)
  const maxResults = options.maxResults ?? 
    parseInt(process.env.TAVILY_MAX_RESULTS || '20', 10)
  const maxSources = options.maxSources ?? 
    parseInt(process.env.TAVILY_MAX_SOURCES || '10', 10)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          query,
          search_depth: 'advanced',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: maxResults, // Configurable via options or TAVILY_MAX_RESULTS env var
          include_domains: [],
          exclude_domains: []
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(
          `Tavily API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        )
        
        // Don't retry on 401 (invalid API key)
        if (response.status === 401) {
          throw error
        }

        // Retry on 429 (rate limit) or 500 (server error)
        if (response.status === 429 || response.status === 500) {
          lastError = error
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          throw error
        }

        throw error
      }

      const data = await response.json()
      
      // Parse and rank sources by relevance score
      const sources: TavilySource[] = (data.results || [])
        .map((result: any) => ({
          title: result.title || '',
          url: result.url || '',
          excerpt: result.content || '',
          published_date: result.published_date || null,
          author: result.author || null,
          relevance_score: result.score || 0
        }))
        .sort((a: TavilySource, b: TavilySource) => b.relevance_score - a.relevance_score) // Descending order
        .slice(0, maxSources) // Select top N sources (configurable via options or TAVILY_MAX_SOURCES env var)

      return sources
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError
      }

      // Exponential backoff before retry
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Research query failed after retries')
}

