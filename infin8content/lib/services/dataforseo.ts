// DataForSEO API client for keyword research
// Story 3.1: Keyword Research Interface and DataForSEO Integration

// Initialize DataForSEO API client (singleton pattern)
let dataforseoApiInstance: DataForSEOApi | null = null

interface DataForSEOApi {
  searchKeywords(params: SearchKeywordsParams): Promise<SearchKeywordsResponse>
}

function getDataForSEOClient(): DataForSEOApi {
  if (!dataforseoApiInstance) {
    const login = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD
    
    if (!login) {
      throw new Error('DATAFORSEO_LOGIN environment variable is not set')
    }
    
    if (!password) {
      throw new Error('DATAFORSEO_PASSWORD environment variable is not set')
    }
    
    dataforseoApiInstance = new DataForSEOApiClient(login, password)
  }
  
  return dataforseoApiInstance
}

// TypeScript interfaces for API request/response types
export interface SearchKeywordsParams {
  keywords: string[]
  locationCode: number // e.g., 2840 for United States
  languageCode: string // e.g., 'en'
  dateFrom?: string // Optional: 'YYYY-MM-DD'
  dateTo?: string // Optional: 'YYYY-MM-DD'
}

export interface SearchKeywordsResponse {
  success: true
  data: {
    keyword: string
    searchVolume: number
    keywordDifficulty: number // 0-100 score
    trend: number[] // 30-day trend data
    cpc?: number // Cost per click
    competition: 'Low' | 'Medium' | 'High'
  }
  cost: number // API cost
}

interface DataForSEOApiRequest {
  keywords: string[]
  location_code: number
  language_code: string
  date_from?: string
  date_to?: string
}

interface DataForSEOApiResponse {
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
      se?: string
      keywords?: string[]
      location_code?: number
      language_code?: string
    }
    result?: Array<{
      keyword: string
      location_code?: number
      language_code?: string
      search_volume: number
      competition?: number // 0.0-1.0
      competition_index: number // 0-100
      cpc?: number
      monthly_searches?: Array<{
        year: number
        month: number
        search_volume: number
      }>
      keyword_info?: {
        se_type?: string
        last_updated_time?: string
        competition?: string // 'LOW' | 'MEDIUM' | 'HIGH'
        cpc?: number
        search_volume?: number
        categories?: number[]
        monthly_searches?: Array<{
          year: number
          month: number
          search_volume: number
        }>
      }
    }>
  }>
}

class DataForSEOApiClient implements DataForSEOApi {
  private login: string
  private password: string
  private baseUrl = 'https://api.dataforseo.com'
  private maxRetries = 3
  private retryDelays = [1000, 2000, 4000] // Exponential backoff: 1s, 2s, 4s

  constructor(login: string, password: string) {
    this.login = login
    this.password = password
  }

  async searchKeywords(params: SearchKeywordsParams): Promise<SearchKeywordsResponse> {
    const requestBody: DataForSEOApiRequest[] = [{
      keywords: params.keywords,
      location_code: params.locationCode,
      language_code: params.languageCode,
      ...(params.dateFrom && { date_from: params.dateFrom }),
      ...(params.dateTo && { date_to: params.dateTo }),
    }]

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64')

    let lastError: Error | null = null

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${this.baseUrl}/v3/keywords_data/google_ads/search_volume/live`,
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

        const data: DataForSEOApiResponse = await response.json()

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

        // Extract results from first task
        const task = data.tasks?.[0]
        if (!task || task.status_code !== 20000) {
          throw new Error(`DataForSEO API error: ${task?.status_message || 'Unknown error'}`)
        }

        const keywordResult = task.result?.[0]
        if (!keywordResult) {
          throw new Error('No keyword results returned from DataForSEO API')
        }

        // Map competition level
        const competitionLevel = this.mapCompetitionLevel(
          keywordResult.keyword_info?.competition || 
          this.competitionIndexToLevel(keywordResult.competition_index)
        )

        // Extract trend data from monthly_searches
        const trend = this.extractTrendData(
          keywordResult.monthly_searches || 
          keywordResult.keyword_info?.monthly_searches || 
          []
        )

        return {
          success: true,
          data: {
            keyword: keywordResult.keyword,
            searchVolume: keywordResult.search_volume,
            keywordDifficulty: keywordResult.competition_index,
            trend,
            cpc: keywordResult.cpc ?? keywordResult.keyword_info?.cpc,
            competition: competitionLevel,
          },
          cost: task.cost ?? data.cost ?? 0,
        }
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

  private mapCompetitionLevel(competition: string): 'Low' | 'Medium' | 'High' {
    const upper = competition.toUpperCase()
    if (upper === 'LOW') return 'Low'
    if (upper === 'MEDIUM' || upper === 'MED') return 'Medium'
    if (upper === 'HIGH') return 'High'
    
    // Default to Medium if unknown
    return 'Medium'
  }

  private competitionIndexToLevel(index: number): string {
    if (index < 33) return 'LOW'
    if (index < 67) return 'MEDIUM'
    return 'HIGH'
  }

  private extractTrendData(monthlySearches: Array<{ year: number; month: number; search_volume: number }>): number[] {
    // Sort by year and month, then extract search volumes
    const sorted = [...monthlySearches].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
    
    return sorted.map(item => item.search_volume)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Search keywords using DataForSEO API
 * @param params Search parameters
 * @returns Keyword research results
 */
export async function searchKeywords(params: SearchKeywordsParams): Promise<SearchKeywordsResponse> {
  const client = getDataForSEOClient()
  return client.searchKeywords(params)
}

// Export client getter for testing
export { getDataForSEOClient }

