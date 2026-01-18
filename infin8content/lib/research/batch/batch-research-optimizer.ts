// Batch Research Optimizer
// Story 20-2: Batch Research Optimizer
// Tier-1 Producer story for research optimization

import { researchService, KeywordResearchResult } from '../research-service';
import { keywordResearchService } from '../keyword-research';
import { researchCache } from '../research-cache';
import { apiCostTracker } from '../api-cost-tracker';
import { QueryBuilder } from './query-builder';
import { SourceRanker } from './source-ranker';
import { CacheManager } from './cache-manager';

export interface BatchResearchRequest {
  organizationId: string;
  userId: string;
  mainKeyword: string;
  sections?: Array<{
    title: string;
    keyword?: string;
    priority: number;
  }>;
  options?: {
    maxSourcesPerSection?: number;
    cacheTTL?: number;
    useExistingCache?: boolean;
    fallbackOnFailure?: boolean;
  };
}

export interface BatchResearchResult {
  mainKeyword: string;
  sections: Array<{
    title: string;
    keyword?: string;
    sources: Array<{
      url: string;
      title?: string;
      description?: string;
      relevance_score: number;
      publication_date?: string;
      author?: string;
      domain?: string;
    }>;
    research_data?: any;
  }>;
  totalCost: number;
  totalApiCalls: number;
  cacheHits: number;
  processingTime: number;
}

export interface ArticleResearchCache {
  id: string;
  organizationId: string;
  mainKeyword: string;
  sections: BatchResearchResult['sections'];
  totalCost: number;
  totalApiCalls: number;
  cachedAt: string;
  expiresAt: string;
}

export class BatchResearchOptimizer {
  private queryBuilder: QueryBuilder;
  private sourceRanker: SourceRanker;
  private cacheManager: CacheManager;

  constructor() {
    this.queryBuilder = new QueryBuilder();
    this.sourceRanker = new SourceRanker();
    this.cacheManager = new CacheManager();
  }

  async performBatchResearch(request: BatchResearchRequest): Promise<BatchResearchResult> {
    const startTime = Date.now();
    const {
      organizationId,
      userId,
      mainKeyword,
      sections = [],
      options = {}
    } = request;

    const {
      maxSourcesPerSection = 8,
      cacheTTL = 30 * 60, // 30 minutes
      useExistingCache = true,
      fallbackOnFailure = true
    } = options;

    // Check cache first
    if (useExistingCache) {
      const cached = await this.getCachedResearch(organizationId, mainKeyword, sections);
      if (cached) {
        return {
          mainKeyword,
          sections: cached.sections,
          totalCost: 0,
          totalApiCalls: 0,
          cacheHits: 1,
          processingTime: Date.now() - startTime
        };
      }
    }

    const result: BatchResearchResult = {
      mainKeyword,
      sections: [],
      totalCost: 0,
      totalApiCalls: 0,
      cacheHits: 0,
      processingTime: 0
    };

    try {
      // Research main keyword
      const mainKeywordResult = await this.researchKeyword(
        organizationId,
        userId,
        mainKeyword,
        'dataforseo'
      );
      
      result.totalCost += mainKeywordResult.cost || 0;
      result.totalApiCalls += 1;

      // Process sections
      const sectionPromises = sections.map(async (section, index) => {
        const sectionKeyword = section.keyword || this.extractSectionKeyword(mainKeyword, section.title);
        
        try {
          const sectionResult = await this.researchSection(
            organizationId,
            userId,
            sectionKeyword,
            maxSourcesPerSection,
            section.priority
          );
          
          result.totalCost += sectionResult.cost;
          result.totalApiCalls += sectionResult.apiCalls;
          
          return {
            title: section.title,
            keyword: sectionKeyword,
            sources: sectionResult.sources,
            research_data: sectionResult.research_data
          };
        } catch (error) {
          if (fallbackOnFailure) {
            console.warn(`Section research failed for ${section.title}:`, error);
            return {
              title: section.title,
              keyword: sectionKeyword,
              sources: [],
              research_data: null
            };
          } else {
            throw error;
          }
        }
      });

      const sectionResults = await Promise.all(sectionPromises);
      result.sections = sectionResults;

      // Cache the results
      await this.cacheResearchResults(organizationId, mainKeyword, sections, result, cacheTTL);

      result.processingTime = Date.now() - startTime;

      return result;

    } catch (error) {
      console.error('Batch research failed:', error);
      
      if (fallbackOnFailure) {
        // Return partial results if available
        return {
          ...result,
          processingTime: Date.now() - startTime
        };
      } else {
        throw error;
      }
    }
  }

  async researchKeyword(
    organizationId: string,
    userId: string,
    keyword: string,
    apiSource: 'dataforseo' | 'tavily'
  ): Promise<{ data: any; cost: number }> {
    // Check cache first
    const cacheKey = researchCache.generateKey('keyword_research', keyword, apiSource);
    const cached = await (researchCache as any).getCache(cacheKey);
    
    if (cached) {
      return { data: cached, cost: 0 };
    }

    // Perform research
    const result = await keywordResearchService.researchKeyword({
      keyword,
      organizationId,
      userId,
      apiSource
    });

    return { data: result, cost: 0 };
  }

  async researchSection(
    organizationId: string,
    userId: string,
    keyword: string,
    maxSources: number,
    priority: number
  ): Promise<{ sources: any[]; cost: number; apiCalls: number; research_data: any }> {
    const startTime = Date.now();
    
    // Build comprehensive query
    const query = this.queryBuilder.buildComprehensiveQuery(keyword);
    
    // Research with both APIs for comprehensive results
    const [dataForSEOResult, tavilyResult] = await Promise.allSettled([
      this.researchKeyword(organizationId, userId, keyword, 'dataforseo'),
      this.researchKeyword(organizationId, userId, keyword, 'tavily')
    ]);

    let sources: any[] = [];
    let totalCost = 0;
    let apiCalls = 0;
    let researchData: any = {};

    // Process DataForSEO results
    if (dataForSEOResult.status === 'fulfilled') {
      researchData.keyword_metrics = dataForSEOResult.value.data;
      totalCost += dataForSEOResult.value.cost;
      apiCalls += 1;
    }

    // Process Tavily results (sources)
    if (tavilyResult.status === 'fulfilled') {
      const tavilySources = tavilyResult.value.data.sources || [];
      sources = tavilySources;
      totalCost += tavilyResult.value.cost;
      apiCalls += 1;
    }

    // Rank and filter sources
    const rankedSources = this.sourceRanker.rankSourcesByRelevance(sources, keyword, maxSources);
    
    // Remove duplicates
    const uniqueSources = this.removeDuplicateSources(rankedSources);

    return {
      sources: uniqueSources,
      cost: totalCost,
      apiCalls,
      research_data: researchData
    };
  }

  private extractSectionKeyword(mainKeyword: string, sectionTitle: string): string {
    // Extract keyword from section title or use main keyword
    const titleWords = sectionTitle.toLowerCase().split(' ');
    const mainKeywordWords = mainKeyword.toLowerCase().split(' ');
    
    // Find words in section title that relate to main keyword
    const relevantWords = titleWords.filter(word => 
      mainKeywordWords.some(mainWord => 
        word.includes(mainWord) || mainWord.includes(word)
      )
    );
    
    if (relevantWords.length > 0) {
      return relevantWords.join(' ');
    }
    
    // Fallback to main keyword
    return mainKeyword;
  }

  private removeDuplicateSources(sources: any[]): any[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      const url = source.url;
      if (seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
  }

  private async getCachedResearch(
    organizationId: string,
    mainKeyword: string,
    sections: Array<{ title: string; keyword?: string; priority: number }>
  ): Promise<ArticleResearchCache | null> {
    const cacheKey = this.generateCacheKey(organizationId, mainKeyword, sections);
    return await (researchCache as any).getCache(cacheKey);
  }

  private async cacheResearchResults(
    organizationId: string,
    mainKeyword: string,
    sections: Array<{ title: string; keyword?: string; priority: number }>,
    result: BatchResearchResult,
    ttl: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(organizationId, mainKeyword, sections);
    const cacheData: ArticleResearchCache = {
      id: cacheKey,
      organizationId,
      mainKeyword,
      sections: result.sections,
      totalCost: result.totalCost,
      totalApiCalls: result.totalApiCalls,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
    };

    await (researchCache as any).setCache(cacheKey, cacheData, 'batch_research', ttl);
  }

  private generateCacheKey(
    organizationId: string,
    mainKeyword: string,
    sections: Array<{ title: string; keyword?: string; priority: number }>
  ): string {
    const sectionHash = sections
      .map(s => `${s.title}:${s.keyword || ''}:${s.priority}`)
      .sort()
      .join('|');
    
    return researchCache.generateKey('batch_research', organizationId, mainKeyword, sectionHash);
  }

  async getCacheStats(): Promise<{
    cacheSize: number;
    hitRate: number;
    averageProcessingTime: number;
    totalCostSaved: number;
  }> {
    const stats = researchCache.getStats();
    
    // Calculate metrics (would need to be tracked over time)
    const hitRate = 0.75; // Placeholder - would be calculated from actual usage
    const averageProcessingTime = 5000; // Placeholder - would be calculated from actual usage
    const totalCostSaved = stats.memoryCacheSize * 0.01; // Placeholder calculation

    return {
      cacheSize: stats.memoryCacheSize,
      hitRate,
      averageProcessingTime,
      totalCostSaved
    };
  }

  async clearExpiredCache(): Promise<void> {
    await (researchCache as any).clearExpiredCache();
    await (this.cacheManager as any).cleanupExpired();
  }

  async optimizeResearchQueries(
    organizationId: string,
    userId: string,
    keywords: string[]
  ): Promise<Record<string, BatchResearchResult>> {
    const results: Record<string, BatchResearchResult> = {};
    
    // Process keywords in batches to optimize API usage
    const batchSize = 5;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (keyword) => {
        try {
          const result = await this.performBatchResearch({
            organizationId,
            userId,
            mainKeyword: keyword,
            options: {
              maxSourcesPerSection: 5, // Reduced for batch processing
              cacheTTL: 60 * 60 // 1 hour for batch optimization
            }
          });
          return { keyword, result };
        } catch (error) {
          console.error(`Failed to optimize research for ${keyword}:`, error);
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
}

// Singleton instance
export const batchResearchOptimizer = new BatchResearchOptimizer();