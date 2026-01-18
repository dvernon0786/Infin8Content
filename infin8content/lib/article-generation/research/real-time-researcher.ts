// Real-Time Researcher
// Story 4A-3: Real-Time Research Per Section (Tavily Integration)
// Tier-1 Producer story for article generation infrastructure

import { tavilyClient } from '@/lib/research/tavily-client';
import { researchCache } from '@/lib/research/research-cache';
import { apiCostTracker } from '@/lib/research/api-cost-tracker';

export interface ResearchQuery {
  query: string;
  sectionTopic: string;
  mainKeyword: string;
  previousSectionContent?: string;
  maxResults?: number;
  includeRawContent?: boolean;
}

export interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  summary: string;
  keyInsights: string[];
  timestamp: string;
  cost: number;
  processingTime: number;
}

export interface ResearchSource {
  title: string;
  url: string;
  content: string;
  excerpt: string;
  publishDate?: string;
  author?: string;
  relevanceScore: number;
  credibilityScore: number;
  topics: string[];
  entities: string[];
}

export interface SectionResearchRequest {
  articleId: string;
  sectionId: string;
  sectionTitle: string;
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';
  mainKeyword: string;
  researchTopics: string[];
  previousSections?: string[];
  maxSources?: number;
  includeCitations: boolean;
}

export interface SectionResearchResult {
  sectionId: string;
  researchData: ResearchResult;
  citations: Citation[];
  keyPoints: string[];
  contentSuggestions: string[];
  timestamp: string;
}

export interface Citation {
  id: string;
  source: ResearchSource;
  context: string;
  relevanceScore: number;
  position: 'introduction' | 'support' | 'example' | 'conclusion';
  formattedCitation: string;
}

export class RealTimeResearcher {
  private tavilyClient: typeof tavilyClient;
  private researchCache: typeof researchCache;
  private apiCostTracker: typeof apiCostTracker;

  constructor() {
    this.tavilyClient = tavilyClient;
    this.researchCache = researchCache;
    this.apiCostTracker = apiCostTracker;
  }

  async performSectionResearch(request: SectionResearchRequest): Promise<SectionResearchResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Generate research query
      const researchQuery = await this.generateResearchQuery(request);
      
      // Step 2: Check cache first
      const cachedResult = await this.checkCache(researchQuery);
      if (cachedResult) {
        return await this.processCachedResult(request, cachedResult);
      }
      
      // Step 3: Perform fresh Tavily research
      const researchResult = await this.performTavilyResearch(researchQuery);
      
      // Step 4: Process and enhance results
      const processedResult = await this.processResearchResult(researchResult, request);
      
      // Step 5: Generate citations
      const citations = await this.generateCitations(processedResult, request);
      
      // Step 6: Extract key points
      const keyPoints = await this.extractKeyPoints(processedResult, request);
      
      // Step 7: Generate content suggestions
      const contentSuggestions = await this.generateContentSuggestions(processedResult, request);
      
      // Step 8: Cache results
      await this.cacheResults(researchQuery, processedResult);
      
      // Step 9: Track API costs
      await this.trackApiCosts(researchResult.cost, 'section_research');
      
      const endTime = Date.now();
      
      return {
        sectionId: request.sectionId,
        researchData: processedResult,
        citations,
        keyPoints,
        contentSuggestions,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Section research failed:', error);
      throw new Error(`Failed to perform section research: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateResearchQuery(request: SectionResearchRequest): Promise<ResearchQuery> {
    const { sectionTitle, sectionType, mainKeyword, researchTopics, previousSections } = request;
    
    // Build comprehensive query
    let query = sectionTitle;
    
    // Add main keyword context
    if (!query.toLowerCase().includes(mainKeyword.toLowerCase())) {
      query += ` ${mainKeyword}`;
    }
    
    // Add research topics
    if (researchTopics.length > 0) {
      query += ` ${researchTopics.slice(0, 3).join(' ')}`;
    }
    
    // Add section-specific context
    switch (sectionType) {
      case 'introduction':
        query += ' overview definition importance';
        break;
      case 'h2':
        query += ' details benefits implementation';
        break;
      case 'h3':
        query += ' specific examples best practices';
        break;
      case 'conclusion':
        query += ' summary key takeaways';
        break;
      case 'faq':
        query += ' questions answers common concerns';
        break;
    }
    
    // Add previous section context for coherence
    const previousContext = previousSections && previousSections.length > 0 
      ? previousSections.slice(-2).join(' ') 
      : '';
    
    return {
      query: query.trim(),
      sectionTopic: sectionTitle,
      mainKeyword,
      previousSectionContent: previousContext,
      maxResults: request.maxSources || 20,
      includeRawContent: true
    };
  }

  private async checkCache(query: ResearchQuery): Promise<ResearchResult | null> {
    try {
      const cacheKey = this.generateCacheKey(query);
      const cachedData = await this.researchCache.getCache(cacheKey, 'section_research');
      
      if (cachedData) {
        return cachedData as ResearchResult;
      }
      
      return null;
    } catch (error) {
      console.warn('Cache check failed:', error);
      return null;
    }
  }

  private async processCachedResult(request: SectionResearchRequest, cachedResult: ResearchResult): Promise<SectionResearchResult> {
    // Process cached result for current section
    const citations = await this.generateCitations(cachedResult, request);
    const keyPoints = await this.extractKeyPoints(cachedResult, request);
    const contentSuggestions = await this.generateContentSuggestions(cachedResult, request);
    
    return {
      sectionId: request.sectionId,
      researchData: cachedResult,
      citations,
      keyPoints,
      contentSuggestions,
      timestamp: new Date().toISOString()
    };
  }

  private async performTavilyResearch(query: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();
    
    try {
      // Call Tavily API
      const tavilyResult = await this.tavilyClient.search(query.query, {
        max_results: query.maxResults,
        include_raw_content: query.includeRawContent,
        include_domains: [],
        exclude_domains: []
      });
      
      // Process results
      const sources = await this.processTavilySources(tavilyResult.results || []);
      
      // Generate summary
      const summary = this.generateSummary(sources, query);
      
      // Extract key insights
      const keyInsights = this.extractKeyInsights(sources, query);
      
      const endTime = Date.now();
      const cost = this.calculateTavilyCost(tavilyResult.results?.length || 0);
      
      return {
        query: query.query,
        sources,
        summary,
        keyInsights,
        timestamp: new Date().toISOString(),
        cost,
        processingTime: endTime - startTime
      };
      
    } catch (error) {
      console.error('Tavily research failed:', error);
      throw new Error(`Tavily research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processTavilySources(tavilyResults: any[]): Promise<ResearchSource[]> {
    const sources: ResearchSource[] = [];
    
    for (const result of tavilyResults) {
      const source: ResearchSource = {
        title: result.title || '',
        url: result.url || '',
        content: result.raw_content || result.content || '',
        excerpt: result.content || '',
        publishDate: result.published_date,
        author: result.author,
        relevanceScore: this.calculateRelevanceScore(result),
        credibilityScore: this.calculateCredibilityScore(result),
        topics: this.extractTopics(result),
        entities: this.extractEntities(result)
      };
      
      sources.push(source);
    }
    
    // Sort by relevance and credibility
    return sources.sort((a, b) => {
      const scoreA = a.relevanceScore * 0.7 + a.credibilityScore * 0.3;
      const scoreB = b.relevanceScore * 0.7 + b.credibilityScore * 0.3;
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(result: any): number {
    let score = 0.5; // Base score
    
    // Title relevance
    if (result.title) {
      score += 0.2;
    }
    
    // Content length
    if (result.content && result.content.length > 500) {
      score += 0.1;
    }
    
    // Published date (more recent = higher score)
    if (result.published_date) {
      const publishDate = new Date(result.published_date);
      const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSincePublish < 30) score += 0.1;
      else if (daysSincePublish < 90) score += 0.05;
    }
    
    return Math.min(1.0, score);
  }

  private calculateCredibilityScore(result: any): number {
    let score = 0.5; // Base score
    
    // URL credibility indicators
    if (result.url) {
      const url = result.url.toLowerCase();
      
      // Educational domains
      if (url.includes('.edu') || url.includes('.gov')) {
        score += 0.3;
      }
      
      // Reputable news sources
      const reputableSources = ['wikipedia', 'bbc', 'cnn', 'reuters', 'associated press'];
      if (reputableSources.some(source => url.includes(source))) {
        score += 0.2;
      }
      
      // Avoid low credibility sources
      const lowCredibilitySources = ['blogspot', 'wordpress', 'medium'];
      if (lowCredibilitySources.some(source => url.includes(source))) {
        score -= 0.1;
      }
    }
    
    // Author presence
    if (result.author) {
      score += 0.1;
    }
    
    return Math.max(0.0, Math.min(1.0, score));
  }

  private extractTopics(result: any): string[] {
    const topics: string[] = [];
    
    // Extract from title
    if (result.title) {
      const titleWords = result.title.toLowerCase().split(' ');
      topics.push(...titleWords.filter(word => word.length > 3));
    }
    
    // Extract from content (simplified)
    if (result.content) {
      const contentWords = result.content.toLowerCase().split(' ');
      const commonWords = contentWords.filter(word => word.length > 4);
      topics.push(...commonWords.slice(0, 10));
    }
    
    // Return unique topics
    return [...new Set(topics)];
  }

  private extractEntities(result: any): string[] {
    // Simplified entity extraction
    const entities: string[] = [];
    
    if (result.title) {
      // Extract potential entities (capitalized words)
      const entityMatches = result.title.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
      if (entityMatches) {
        entities.push(...entityMatches);
      }
    }
    
    return [...new Set(entities)];
  }

  private generateSummary(sources: ResearchSource[], query: ResearchQuery): string {
    if (sources.length === 0) {
      return `No research results found for "${query.query}".`;
    }
    
    const topSources = sources.slice(0, 3);
    const summaryPoints = topSources.map(source => {
      const excerpt = source.excerpt || source.content?.substring(0, 200) || '';
      return `${source.title}: ${excerpt.substring(0, 100)}...`;
    });
    
    return `Research on "${query.query}" found ${sources.length} sources. Key findings include: ${summaryPoints.join('. ')}`;
  }

  private extractKeyInsights(sources: ResearchSource[], query: ResearchQuery): string[] {
    const insights: string[] = [];
    
    // Extract insights from top sources
    const topSources = sources.slice(0, 5);
    
    for (const source of topSources) {
      if (source.content && source.content.length > 100) {
        // Simple insight extraction (would use NLP in production)
        const sentences = source.content.split('.').filter(s => s.trim().length > 20);
        
        // Look for sentences with key indicators
        const insightSentences = sentences.filter(sentence => {
          const lowerSentence = sentence.toLowerCase();
          return lowerSentence.includes('important') ||
                 lowerSentence.includes('significant') ||
                 lowerSentence.includes('key') ||
                 lowerSentence.includes('critical') ||
                 lowerSentence.includes('essential');
        });
        
        insights.push(...insightSentences.slice(0, 2));
      }
    }
    
    return insights.slice(0, 5);
  }

  private async processResearchResult(result: ResearchResult, request: SectionResearchRequest): Promise<ResearchResult> {
    // Enhance results based on section requirements
    const enhancedSources = result.sources.map(source => ({
      ...source,
      relevanceScore: this.adjustRelevanceForSection(source, request),
      topics: this.filterTopicsForSection(source.topics, request)
    }));
    
    return {
      ...result,
      sources: enhancedSources
    };
  }

  private adjustRelevanceForSection(source: ResearchSource, request: SectionResearchRequest): number {
    let adjustedScore = source.relevanceScore;
    
    // Boost relevance for section-specific topics
    const sectionTopics = request.researchTopics.map(topic => topic.toLowerCase());
    const sourceTopics = source.topics.map(topic => topic.toLowerCase());
    
    const matchingTopics = sectionTopics.filter(topic => 
      sourceTopics.some(sourceTopic => sourceTopic.includes(topic) || topic.includes(sourceTopic))
    );
    
    adjustedScore += matchingTopics.length * 0.1;
    
    return Math.min(1.0, adjustedScore);
  }

  private filterTopicsForSection(topics: string[], request: SectionResearchRequest): string[] {
    // Filter topics based on section relevance
    const sectionKeywords = [
      ...request.researchTopics,
      request.mainKeyword,
      request.sectionTitle.toLowerCase()
    ];
    
    return topics.filter(topic => {
      const lowerTopic = topic.toLowerCase();
      return sectionKeywords.some(keyword => 
        lowerTopic.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(lowerTopic)
      );
    });
  }

  private async generateCitations(result: ResearchResult, request: SectionResearchRequest): Promise<Citation[]> {
    const citations: Citation[] = [];
    
    if (!request.includeCitations) {
      return citations;
    }
    
    // Generate citations from top sources
    const topSources = result.sources.slice(0, Math.min(10, result.sources.length));
    
    for (let i = 0; i < topSources.length; i++) {
      const source = topSources[i];
      
      const citation: Citation = {
        id: `citation-${request.sectionId}-${i}`,
        source,
        context: this.generateCitationContext(source, request),
        relevanceScore: source.relevanceScore,
        position: this.determineCitationPosition(source, request.sectionType),
        formattedCitation: this.formatCitation(source)
      };
      
      citations.push(citation);
    }
    
    return citations;
  }

  private generateCitationContext(source: ResearchSource, request: SectionResearchRequest): string {
    // Generate context for citation usage
    const contexts = {
      introduction: `According to ${source.title}`,
      h2: `${source.title} reports that`,
      h3: `Research from ${source.title} indicates`,
      conclusion: `As noted by ${source.title}`,
      faq: `${source.title} explains`
    };
    
    return contexts[request.sectionType] || `According to ${source.title}`;
  }

  private determineCitationPosition(source: ResearchSource, sectionType: string): 'introduction' | 'support' | 'example' | 'conclusion' {
    // Determine best position for citation based on section type
    if (sectionType === 'introduction') return 'introduction';
    if (sectionType === 'conclusion') return 'conclusion';
    
    // For H2/H3, determine based on content
    if (source.content && source.content.includes('example')) return 'example';
    if (source.content && source.content.includes('study')) return 'support';
    
    return 'support';
  }

  private formatCitation(source: ResearchSource): string {
    const parts = [];
    
    if (source.author) {
      parts.push(source.author);
    }
    
    if (source.title) {
      parts.push(`"${source.title}"`);
    }
    
    if (source.url) {
      parts.push(source.url);
    }
    
    if (source.publishDate) {
      parts.push(`(${new Date(source.publishDate).getFullYear()})`);
    }
    
    return parts.join('. ');
  }

  private async extractKeyPoints(result: ResearchResult, request: SectionResearchRequest): Promise<string[]> {
    const keyPoints: string[] = [];
    
    // Extract key points from research insights
    keyPoints.push(...result.keyInsights);
    
    // Extract points from top sources
    const topSources = result.sources.slice(0, 3);
    
    for (const source of topSources) {
      if (source.excerpt && source.excerpt.length > 50) {
        keyPoints.push(source.excerpt.substring(0, 150) + '...');
      }
    }
    
    return keyPoints.slice(0, 5);
  }

  private async generateContentSuggestions(result: ResearchResult, request: SectionResearchRequest): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Generate suggestions based on research findings
    if (result.summary) {
      suggestions.push(`Include key finding: ${result.summary.substring(0, 100)}...`);
    }
    
    // Generate suggestions from sources
    const topSources = result.sources.slice(0, 3);
    
    for (const source of topSources) {
      suggestions.push(`Reference ${source.title} for authoritative information`);
      suggestions.push(`Include data point from ${source.title}`);
    }
    
    return suggestions.slice(0, 5);
  }

  private generateCacheKey(query: ResearchQuery): string {
    const key = `section_research:${query.query}:${query.sectionTopic}:${query.mainKeyword}`;
    return key.replace(/\s+/g, '_').toLowerCase();
  }

  private async cacheResults(query: ResearchQuery, result: ResearchResult): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(query);
      await this.researchCache.setCache(cacheKey, result, 'section_research', 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.warn('Failed to cache results:', error);
    }
  }

  private calculateTavilyCost(resultCount: number): number {
    // Tavily API cost: ~$0.08 per query
    return 0.08;
  }

  private async trackApiCosts(cost: number, operation: string): Promise<void> {
    try {
      await this.apiCostTracker.trackCost(cost, operation, 'tavily');
    } catch (error) {
      console.warn('Failed to track API costs:', error);
    }
  }

  async getResearchHistory(articleId: string): Promise<SectionResearchResult[]> {
    // This would retrieve research history for an article
    // Implementation depends on storage requirements
    return [];
  }

  async clearSectionCache(sectionId: string): Promise<void> {
    // Clear cache for specific section
    try {
      await this.researchCache.clearExpiredCache('section_research');
    } catch (error) {
      console.warn('Failed to clear section cache:', error);
    }
  }
}

// Singleton instance
export const realTimeResearcher = new RealTimeResearcher();