// Tavily Client
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content: string;
  published_date?: string;
}

export interface TavilyResponse {
  results: TavilySearchResult[];
}

export interface TavilyResearchData {
  sources: Array<{
    url: string;
    title?: string;
    description?: string;
    relevance_score: number;
    publication_date?: string;
    author?: string;
    domain?: string;
  }>;
}

export interface TavilyResearchResult {
  data: TavilyResearchData;
  cost: number;
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    this.baseUrl = 'https://api.tavily.com';
  }

  async researchKeyword(keyword: string): Promise<TavilyResearchResult> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const endpoint = '/search';
    const url = `${this.baseUrl}${endpoint}`;

    const requestBody = {
      api_key: this.apiKey,
      query: keyword,
      search_depth: 'basic',
      include_answer: false,
      include_raw_content: false,
      max_results: 10,
      include_domains: [],
      exclude_domains: []
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data: TavilyResponse = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No results returned from Tavily API');
      }

      const sources = data.results.map(result => ({
        url: result.url,
        title: result.title,
        description: result.content.substring(0, 200) + '...',
        relevance_score: result.score,
        publication_date: result.published_date,
        domain: this.extractDomain(result.url)
      }));

      const researchData: TavilyResearchData = {
        sources
      };

      // Calculate cost (approximately $0.005 per search)
      const cost = 0.005;

      return { data: researchData, cost };

    } catch (error) {
      console.error('Tavily API error:', error);
      throw new Error(`Failed to research keyword with Tavily: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async researchMultipleKeywords(keywords: string[]): Promise<Record<string, TavilyResearchResult>> {
    const results: Record<string, TavilyResearchResult> = {};
    
    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (keyword) => {
        try {
          const result = await this.researchKeyword(keyword);
          return { keyword, result };
        } catch (error) {
          console.error(`Failed to research keyword ${keyword}:`, error);
          return { keyword, result: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ keyword, result }) => {
        if (result) {
          results[keyword] = result;
        }
      });

      // Rate limiting delay
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async getSourcesForKeyword(keyword: string, maxResults: number = 10): Promise<TavilySearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const endpoint = '/search';
    const url = `${this.baseUrl}${endpoint}`;

    const requestBody = {
      api_key: this.apiKey,
      query: keyword,
      search_depth: 'basic',
      include_answer: false,
      include_raw_content: false,
      max_results: maxResults,
      include_domains: [],
      exclude_domains: []
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data: TavilyResponse = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results;

    } catch (error) {
      console.error('Tavily API error:', error);
      throw new Error(`Failed to get sources for keyword: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  async searchWithAdvancedOptions(
    query: string,
    options: {
      search_depth?: 'basic' | 'advanced';
      include_answer?: boolean;
      include_raw_content?: boolean;
      max_results?: number;
      include_domains?: string[];
      exclude_domains?: string[];
    } = {}
  ): Promise<TavilyResponse> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const endpoint = '/search';
    const url = `${this.baseUrl}${endpoint}`;

    const requestBody = {
      api_key: this.apiKey,
      query,
      search_depth: options.search_depth || 'basic',
      include_answer: options.include_answer || false,
      include_raw_content: options.include_raw_content || false,
      max_results: options.max_results || 10,
      include_domains: options.include_domains || [],
      exclude_domains: options.exclude_domains || []
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Tavily API error:', error);
      throw new Error(`Failed to search with Tavily: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
