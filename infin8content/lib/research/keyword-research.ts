// Keyword Research Service
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

import { researchService } from './research-service';
import { DataForSEOClient } from './dataforseo-client';
import { TavilyClient } from './tavily-client';

export interface KeywordResearchRequest {
  keyword: string;
  organizationId: string;
  userId: string;
  researchProjectId?: string;
  apiSource: 'dataforseo' | 'tavily';
}

export interface KeywordResearchData {
  search_volume?: number;
  keyword_difficulty?: number;
  cpc?: number;
  competition_level?: 'low' | 'medium' | 'high';
  trend_data?: Record<string, any>;
  sources?: Array<{
    url: string;
    title?: string;
    description?: string;
    relevance_score: number;
    publication_date?: string;
    author?: string;
    domain?: string;
  }>;
}

export class KeywordResearchService {
  private dataForSEOClient: DataForSEOClient;
  private tavilyClient: TavilyClient;

  constructor() {
    this.dataForSEOClient = new DataForSEOClient();
    this.tavilyClient = new TavilyClient();
  }

  async researchKeyword(request: KeywordResearchRequest): Promise<KeywordResearchData> {
    const { keyword, organizationId, userId, researchProjectId, apiSource } = request;

    // Check cache first
    const cacheKey = `keyword_research_${keyword}_${apiSource}`;
    const cached = await researchService.getCache(cacheKey);
    
    if (cached) {
      // Track cache hit
      await this.trackApiUsage(organizationId, userId, apiSource, 'cache', 0);
      return cached;
    }

    // Perform research based on API source
    let researchData: KeywordResearchData;
    let cost: number;

    try {
      switch (apiSource) {
        case 'dataforseo':
          ({ data: researchData, cost } = await this.dataForSEOClient.researchKeyword(keyword));
          break;
        case 'tavily':
          ({ data: researchData, cost } = await this.tavilyClient.researchKeyword(keyword));
          break;
        default:
          throw new Error(`Unsupported API source: ${apiSource}`);
      }

      // Cache the results (24 hours)
      await researchService.setCache(cacheKey, researchData, 'keyword_research', 24 * 60 * 60);

      // Store in database
      await this.storeResearchResults(organizationId, userId, keyword, researchData, apiSource, cost, researchProjectId);

      // Track API usage
      await this.trackApiUsage(organizationId, userId, apiSource, 'research', cost);

      return researchData;

    } catch (error) {
      // Track failed API call
      await this.trackApiUsage(organizationId, userId, apiSource, 'research_failed', 0);
      throw error;
    }
  }

  async researchMultipleKeywords(
    requests: KeywordResearchRequest[]
  ): Promise<Record<string, KeywordResearchData>> {
    const results: Record<string, KeywordResearchData> = {};
    
    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const data = await this.researchKeyword(request);
          return { keyword: request.keyword, data };
        } catch (error) {
          console.error(`Failed to research keyword ${request.keyword}:`, error);
          return { keyword: request.keyword, data: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ keyword, data }) => {
        if (data) {
          results[keyword] = data;
        }
      });

      // Rate limiting delay
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async getCachedResearchResults(
    organizationId: string,
    keywords: string[],
    apiSource: string
  ): Promise<Record<string, KeywordResearchData>> {
    const results: Record<string, KeywordResearchData> = {};
    
    for (const keyword of keywords) {
      const cached = await researchService.getCachedKeywordResearchResult(organizationId, keyword, apiSource);
      if (cached) {
        results[keyword] = {
          search_volume: cached.search_volume,
          keyword_difficulty: cached.keyword_difficulty,
          cpc: cached.cpc,
          competition_level: cached.competition_level,
          trend_data: cached.trend_data
        };
      }
    }

    return results;
  }

  private async storeResearchResults(
    organizationId: string,
    userId: string,
    keyword: string,
    data: KeywordResearchData,
    apiSource: string,
    cost: number,
    researchProjectId?: string
  ): Promise<void> {
    // Store keyword research result
    const keywordResult = await researchService.createKeywordResearchResult(
      organizationId,
      userId,
      keyword,
      {
        search_volume: data.search_volume,
        keyword_difficulty: data.keyword_difficulty,
        cpc: data.cpc,
        competition_level: data.competition_level,
        trend_data: data.trend_data || {},
        api_source: apiSource,
        api_cost: cost,
        cached_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      researchProjectId
    );

    // Store sources if available
    if (data.sources && data.sources.length > 0) {
      const sources = data.sources.map(source => ({
        organization_id: organizationId,
        keyword_research_result_id: keywordResult.id,
        source_url: source.url,
        source_title: source.title,
        source_description: source.description,
        relevance_score: source.relevance_score,
        publication_date: source.publication_date,
        author: source.author,
        domain: source.domain,
        research_date: new Date().toISOString(),
        api_source: apiSource,
        api_cost: data.sources ? cost / data.sources.length : cost // Distribute cost across sources
      }));

      await researchService.createResearchSources(sources);
    }
  }

  private async trackApiUsage(
    organizationId: string,
    userId: string,
    apiSource: string,
    endpoint: string,
    cost: number
  ): Promise<void> {
    await researchService.trackApiUsage(organizationId, userId, apiSource, endpoint, cost);
  }

  async getResearchHistory(
    organizationId: string,
    userId: string,
    limit: number = 50
  ): Promise<KeywordResearchData[]> {
    const results = await researchService.getKeywordResearchResults(organizationId, userId);
    
    return results.slice(0, limit).map(result => ({
      search_volume: result.search_volume,
      keyword_difficulty: result.keyword_difficulty,
      cpc: result.cpc,
      competition_level: result.competition_level,
      trend_data: result.trend_data
    }));
  }

  async getResearchCosts(
    organizationId: string,
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ totalCost: number; apiBreakdown: Record<string, number> }> {
    const usage = await researchService.getApiUsage(organizationId, userId, startDate, endDate);
    
    const totalCost = usage.reduce((sum, record) => sum + record.total_cost, 0);
    
    const apiBreakdown = usage.reduce((breakdown, record) => {
      breakdown[record.api_source] = (breakdown[record.api_source] || 0) + record.total_cost;
      return breakdown;
    }, {} as Record<string, number>);

    return { totalCost, apiBreakdown };
  }
}

// Singleton instance
export const keywordResearchService = new KeywordResearchService();
