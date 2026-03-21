// DataForSEO Client
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

export interface DataForSEOResponse {
  keyword: string;
  search_volume?: number;
  keyword_difficulty?: number;
  cpc?: number;
  competition_level?: 'low' | 'medium' | 'high';
  trend_data?: Record<string, any>;
}

export interface DataForSEOResult {
  data: DataForSEOResponse;
  cost: number;
}

export class DataForSEOClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DATAFORSEO_API_KEY || '';
    this.baseUrl = 'https://api.dataforseo.com/v3';
  }

  async researchKeyword(keyword: string, locationCode: number, languageCode: string): Promise<DataForSEOResult> {
    if (!this.apiKey) {
      throw new Error('DataForSEO API key not configured');
    }

    const endpoint = '/keywords_data/google/adwords/search_volume/live';
    const url = `${this.baseUrl}${endpoint}`;

    const requestBody = [
      {
        keyword,
        location_code: locationCode,
        language_code: languageCode
      }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('No data returned from DataForSEO API');
      }

      const task = data.tasks[0];
      if (task.status_code !== 20000) {
        throw new Error(`DataForSEO task failed: ${task.status_message}`);
      }

      const result = task.result?.[0];
      if (!result) {
        throw new Error('No result data returned from DataForSEO API');
      }

      const researchData: DataForSEOResponse = {
        keyword: result.keyword || keyword,
        search_volume: result.search_volume,
        keyword_difficulty: result.keyword_difficulty,
        cpc: result.cpc,
        competition_level: this.mapCompetitionLevel(result.competition),
        trend_data: result.monthly_searches ? this.formatTrendData(result.monthly_searches) : undefined
      };

      // Calculate cost (approximately $0.01 per keyword research request)
      const cost = 0.01;

      return { data: researchData, cost };

    } catch (error) {
      console.error('DataForSEO API error:', error);
      throw new Error(`Failed to research keyword with DataForSEO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async researchMultipleKeywords(keywords: string[], locationCode: number, languageCode: string): Promise<Record<string, DataForSEOResult>> {
    const results: Record<string, DataForSEOResult> = {};
    
    // Process in batches to respect rate limits
    const batchSize = 100;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (keyword) => {
        try {
          const result = await this.researchKeyword(keyword, locationCode, languageCode);
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
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  private mapCompetitionLevel(competition?: number): 'low' | 'medium' | 'high' | undefined {
    if (competition === undefined) return undefined;
    
    if (competition <= 0.33) return 'low';
    if (competition <= 0.66) return 'medium';
    return 'high';
  }

  private formatTrendData(monthlySearches: any[]): Record<string, any> {
    return monthlySearches.reduce((trend, month) => {
      trend[month.date] = month.search_volume;
      return trend;
    }, {} as Record<string, any>);
  }

  async getKeywordDifficulty(keyword: string, locationCode: number, languageCode: string): Promise<number> {
    if (!this.apiKey) {
      throw new Error('DataForSEO API key not configured');
    }

    const endpoint = '/keywords_data/google/adwords/keyword_difficulty/live';
    const url = `${this.baseUrl}${endpoint}`;

    const requestBody = [
      {
        keyword,
        location_code: locationCode,
        language_code: languageCode
      }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('No data returned from DataForSEO API');
      }

      const task = data.tasks[0];
      if (task.status_code !== 20000) {
        throw new Error(`DataForSEO task failed: ${task.status_message}`);
      }

      const result = task.result?.[0];
      if (!result) {
        throw new Error('No result data returned from DataForSEO API');
      }

      return result.keyword_difficulty || 0;

    } catch (error) {
      console.error('DataForSEO keyword difficulty error:', error);
      throw new Error(`Failed to get keyword difficulty: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSearchVolume(keyword: string, locationCode: number, languageCode: string): Promise<number> {
    if (!this.apiKey) {
      throw new Error('DataForSEO API key not configured');
    }

    const endpoint = '/keywords_data/google/adwords/search_volume/live';
    const url = `${this.baseUrl}${endpoint}`;

    const requestBody = [
      {
        keyword,
        location_code: locationCode,
        language_code: languageCode
      }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.tasks || data.tasks.length === 0) {
        throw new Error('No data returned from DataForSEO API');
      }

      const task = data.tasks[0];
      if (task.status_code !== 20000) {
        throw new Error(`DataForSEO task failed: ${task.status_message}`);
      }

      const result = task.result?.[0];
      if (!result) {
        throw new Error('No result data returned from DataForSEO API');
      }

      return result.search_volume || 0;

    } catch (error) {
      console.error('DataForSEO search volume error:', error);
      throw new Error(`Failed to get search volume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
