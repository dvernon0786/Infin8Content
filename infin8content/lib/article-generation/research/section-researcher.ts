// Section Researcher
// Story 4A-3: Real-Time Research Per Section (Tavily Integration)
// Tier-1 Producer story for article generation infrastructure

import { realTimeResearcher, SectionResearchRequest, SectionResearchResult } from './real-time-researcher';
import { citationManager, CitationOptions } from './citation-manager';
import { articleService } from '../article-service';

export interface SectionResearchCoordinator {
  articleId: string;
  sectionId: string;
  sectionTitle: string;
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';
  mainKeyword: string;
  researchTopics: string[];
  previousSections: string[];
  citationOptions: CitationOptions;
  maxSources: number;
  includeCitations: boolean;
}

export interface ArticleResearchPlan {
  articleId: string;
  sections: SectionResearchCoordinator[];
  totalEstimatedCost: number;
  estimatedTime: number;
  researchStrategy: ResearchStrategy;
}

export interface ResearchStrategy {
  approach: 'sequential' | 'parallel' | 'hybrid';
  maxConcurrent: number;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface ResearchProgress {
  articleId: string;
  totalSections: number;
  completedSections: number;
  currentSection: string;
  estimatedTimeRemaining: number;
  totalCost: number;
  errors: ResearchError[];
}

export interface ResearchError {
  sectionId: string;
  error: string;
  timestamp: string;
  retryCount: number;
  resolved: boolean;
}

export class SectionResearcher {
  private realTimeResearcher: typeof realTimeResearcher;
  private citationManager: typeof citationManager;
  private articleService: typeof articleService;

  constructor() {
    this.realTimeResearcher = realTimeResearcher;
    this.citationManager = citationManager;
    this.articleService = articleService;
  }

  async researchArticleSections(
    articleId: string,
    sections: any[],
    options: {
      maxConcurrent?: number;
      citationStyle?: CitationOptions['style'];
      maxSourcesPerSection?: number;
      includeCitations?: boolean;
    } = {}
  ): Promise<SectionResearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Create research plan
      const plan = await this.createResearchPlan(articleId, sections, options);
      
      // Execute research based on strategy
      const results = await this.executeResearchPlan(plan);
      
      // Update article with research results
      await this.updateArticleWithResearch(articleId, results);
      
      const endTime = Date.now();
      
      return results;
      
    } catch (error) {
      console.error('Article section research failed:', error);
      throw new Error(`Failed to research article sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async researchSingleSection(
    articleId: string,
    section: any,
    previousSections: string[] = [],
    options: {
      citationStyle?: CitationOptions['style'];
      maxSources?: number;
      includeCitations?: boolean;
    } = {}
  ): Promise<SectionResearchResult> {
    try {
      // Create section research coordinator
      const coordinator = this.createSectionCoordinator(articleId, section, previousSections, options);
      
      // Perform research
      const result = await this.realTimeResearcher.performSectionResearch(coordinator);
      
      // Update article section with research data
      await this.updateArticleSectionWithResearch(articleId, section.id, result);
      
      return result;
      
    } catch (error) {
      console.error('Single section research failed:', error);
      throw new Error(`Failed to research section: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createResearchPlan(
    articleId: string,
    sections: any[],
    options: {
      maxConcurrent?: number;
      citationStyle?: CitationOptions['style'];
      maxSourcesPerSection?: number;
      includeCitations?: boolean;
    } = {}
  ): Promise<ArticleResearchPlan> {
    const coordinators: SectionResearchCoordinator[] = [];
    let totalEstimatedCost = 0;
    let estimatedTime = 0;
    
    // Create coordinators for each section
    for (const section of sections) {
      const coordinator = this.createSectionCoordinator(articleId, section, [], options);
      coordinators.push(coordinator);
      
      // Estimate cost and time
      totalEstimatedCost += this.estimateSectionCost(coordinator);
      estimatedTime += this.estimateSectionTime(coordinator);
    }
    
    // Determine research strategy
    const researchStrategy = this.determineResearchStrategy(coordinators, options);
    
    return {
      articleId,
      sections: coordinators,
      totalEstimatedCost,
      estimatedTime,
      researchStrategy
    };
  }

  async executeResearchPlan(plan: ArticleResearchPlan): Promise<SectionResearchResult[]> {
    const { sections, researchStrategy } = plan;
    
    switch (researchStrategy.approach) {
      case 'sequential':
        return await this.executeSequentialResearch(sections, researchStrategy);
      case 'parallel':
        return await this.executeParallelResearch(sections, researchStrategy);
      case 'hybrid':
        return await this.executeHybridResearch(sections, researchStrategy);
      default:
        return await this.executeSequentialResearch(sections, researchStrategy);
    }
  }

  private async executeSequentialResearch(
    sections: SectionResearchCoordinator[],
    strategy: ResearchStrategy
  ): Promise<SectionResearchResult[]> {
    const results: SectionResearchResult[] = [];
    
    for (const section of sections) {
      try {
        const result = await this.executeSectionWithRetry(section, strategy.retryPolicy);
        results.push(result);
        
        // Update progress
        await this.updateResearchProgress(section.articleId, results.length, sections.length);
        
      } catch (error) {
        console.error(`Failed to research section ${section.sectionId}:`, error);
        
        // Continue with next section in sequential mode
        continue;
      }
    }
    
    return results;
  }

  private async executeParallelResearch(
    sections: SectionResearchCoordinator[],
    strategy: ResearchStrategy
  ): Promise<SectionResearchResult[]> {
    const maxConcurrent = strategy.maxConcurrent || 3;
    const results: SectionResearchResult[] = [];
    
    // Process sections in batches
    for (let i = 0; i < sections.length; i += maxConcurrent) {
      const batch = sections.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(section => 
        this.executeSectionWithRetry(section, strategy.retryPolicy)
          .catch(error => {
            console.error(`Failed to research section ${section.sectionId}:`, error);
            return null;
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // Add successful results
      for (const result of batchResults) {
        if (result) {
          results.push(result);
        }
      }
      
      // Update progress
      await this.updateResearchProgress(sections[0].articleId, results.length, sections.length);
    }
    
    return results;
  }

  private async executeHybridResearch(
    sections: SectionResearchCoordinator[],
    strategy: ResearchStrategy
  ): Promise<SectionResearchResult[]> {
    const results: SectionResearchResult[] = [];
    
    // Research introduction and conclusion sequentially (important for context)
    const criticalSections = sections.filter(s => 
      s.sectionType === 'introduction' || s.sectionType === 'conclusion'
    );
    
    // Research other sections in parallel
    const otherSections = sections.filter(s => 
      s.sectionType !== 'introduction' && s.sectionType !== 'conclusion'
    );
    
    // Research critical sections first
    for (const section of criticalSections) {
      try {
        const result = await this.executeSectionWithRetry(section, strategy.retryPolicy);
        results.push(result);
        
        await this.updateResearchProgress(section.articleId, results.length, sections.length);
        
      } catch (error) {
        console.error(`Failed to research critical section ${section.sectionId}:`, error);
      }
    }
    
    // Research other sections in parallel
    if (otherSections.length > 0) {
      const maxConcurrent = strategy.maxConcurrent || 3;
      
      for (let i = 0; i < otherSections.length; i += maxConcurrent) {
        const batch = otherSections.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(section => 
          this.executeSectionWithRetry(section, strategy.retryPolicy)
            .catch(error => {
              console.error(`Failed to research section ${section.sectionId}:`, error);
              return null;
            })
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result) {
            results.push(result);
          }
        }
        
        await this.updateResearchProgress(otherSections[0].articleId, results.length, sections.length);
      }
    }
    
    return results;
  }

  private async executeSectionWithRetry(
    section: SectionResearchCoordinator,
    retryPolicy: RetryPolicy
  ): Promise<SectionResearchResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        return await this.realTimeResearcher.performSectionResearch(section);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError, retryPolicy.retryableErrors)) {
          throw lastError;
        }
        
        // Wait before retry
        if (attempt < retryPolicy.maxRetries) {
          const delay = Math.min(
            retryPolicy.backoffMultiplier * Math.pow(2, attempt) * 1000,
            retryPolicy.maxDelay
          );
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Check if error is in retryable list
    for (const retryableError of retryableErrors) {
      if (errorMessage.includes(retryableError.toLowerCase())) {
        return true;
      }
    }
    
    // Default retryable errors
    const defaultRetryableErrors = [
      'timeout',
      'network',
      'rate limit',
      'temporary',
      'service unavailable'
    ];
    
    for (const retryableError of defaultRetryableErrors) {
      if (errorMessage.includes(retryableError)) {
        return true;
      }
    }
    
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createSectionCoordinator(
    articleId: string,
    section: any,
    previousSections: string[],
    options: {
      citationStyle?: CitationOptions['style'];
      maxSources?: number;
      includeCitations?: boolean;
    } = {}
  ): SectionResearchCoordinator {
    return {
      articleId,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionType: section.type,
      mainKeyword: section.keyword || '',
      researchTopics: section.researchTopics || [],
      previousSections,
      citationOptions: {
        style: options.citationStyle || 'apa',
        includeUrls: true,
        includeAuthors: true,
        includeDates: true,
        maxCitations: Math.min(options.maxSources || 10, 10),
        sortBy: 'relevance'
      },
      maxSources: options.maxSources || 20,
      includeCitations: options.includeCitations !== false
    };
  }

  private estimateSectionCost(section: SectionResearchCoordinator): number {
    // Tavily API cost: ~$0.08 per query
    return 0.08;
  }

  private estimateSectionTime(section: SectionResearchCoordinator): number {
    // Estimate research time in milliseconds
    return 5000; // 5 seconds per section
  }

  private determineResearchStrategy(
    sections: SectionResearchCoordinator[],
    options: {
      maxConcurrent?: number;
      citationStyle?: CitationOptions['style'];
      maxSourcesPerSection?: number;
      includeCitations?: boolean;
    } = {}
  ): ResearchStrategy {
    const sectionCount = sections.length;
    
    // Determine approach based on section count and complexity
    let approach: 'sequential' | 'parallel' | 'hybrid' = 'sequential';
    
    if (sectionCount <= 3) {
      approach = 'sequential';
    } else if (sectionCount <= 10) {
      approach = 'hybrid';
    } else {
      approach = 'parallel';
    }
    
    return {
      approach,
      maxConcurrent: options.maxConcurrent || 3,
      cacheStrategy: 'moderate',
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxDelay: 10000, // 10 seconds
        retryableErrors: [
          'timeout',
          'network',
          'rate limit',
          'temporary',
          'service unavailable'
        ]
      }
    };
  }

  private async updateArticleWithResearch(
    articleId: string,
    results: SectionResearchResult[]
  ): Promise<void> {
    try {
      // Update article with research metadata
      const researchMetadata = {
        totalSections: results.length,
        completedSections: results.length,
        researchData: results.reduce((acc, result) => {
          acc[result.sectionId] = result.researchData;
          return acc;
        }, {} as Record<string, any>),
        citations: results.reduce((acc, result) => {
          acc[result.sectionId] = result.citations;
          return acc;
        }, {} as Record<string, any>),
        totalCost: results.reduce((sum, result) => sum + result.researchData.cost, 0),
        researchTime: Date.now()
      };
      
      await this.articleService.updateArticle(articleId, {
        metadata: {
          research: researchMetadata
        }
      });
      
    } catch (error) {
      console.warn('Failed to update article with research:', error);
    }
  }

  private async updateArticleSectionWithResearch(
    articleId: string,
    sectionId: string,
    result: SectionResearchResult
  ): Promise<void> {
    try {
      // Update article section with research data
      await this.articleService.updateArticleSection(sectionId, {
        research_data: result.researchData,
        citations: result.citations.map(citation => ({
          url: citation.source.url,
          title: citation.source.title,
          author: citation.source.author || undefined,
          publication_date: citation.source.publishDate || undefined,
          excerpt: citation.context
        })),
        status: 'completed'
      });
      
    } catch (error) {
      console.warn('Failed to update article section with research:', error);
    }
  }

  private async updateResearchProgress(
    articleId: string,
    completedSections: number,
    totalSections: number
  ): Promise<void> {
    try {
      const progress = Math.floor((completedSections / totalSections) * 100);
      
      await this.articleService.updateArticleProgress(articleId, progress, `Researching section ${completedSections}/${totalSections}`);
      
    } catch (error) {
      console.warn('Failed to update research progress:', error);
    }
  }

  async getResearchProgress(articleId: string): Promise<ResearchProgress> {
    try {
      const article = await this.articleService.getArticle(articleId);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      const metadata = article.metadata || {};
      const research = metadata.research || {};
      
      return {
        articleId,
        totalSections: research.totalSections || 0,
        completedSections: research.completedSections || 0,
        currentSection: research.currentSection || '',
        estimatedTimeRemaining: research.estimatedTimeRemaining || 0,
        totalCost: research.totalCost || 0,
        errors: research.errors || []
      };
      
    } catch (error) {
      console.error('Failed to get research progress:', error);
      throw new Error(`Failed to get research progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelResearch(articleId: string): Promise<void> {
    try {
      // Update article status to indicate research cancellation
      await this.articleService.updateArticleStatus(articleId, 'cancelled', 'Research cancelled by user');
      
    } catch (error) {
      console.error('Failed to cancel research:', error);
      throw new Error(`Failed to cancel research: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retryFailedSections(articleId: string): Promise<SectionResearchResult[]> {
    try {
      const article = await this.articleService.getArticle(articleId);
      
      if (!article) {
        throw new Error('Article not found');
      }
      
      // Get failed sections
      const sections = await this.articleService.getArticleSections(articleId);
      const failedSections = sections.filter(section => section.status === 'failed');
      
      if (failedSections.length === 0) {
        return [];
      }
      
      // Retry failed sections
      const results: SectionResearchResult[] = [];
      
      for (const section of failedSections) {
        try {
          // Reset section status
          await this.articleService.updateArticleSection(section.id, {
            status: 'pending',
            error_message: undefined,
            retry_count: section.retry_count + 1
          });
          
          // Research section again
          const result = await this.researchSingleSection(articleId, section);
          results.push(result);
          
        } catch (error) {
          console.error(`Failed to retry section ${section.id}:`, error);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Failed to retry failed sections:', error);
      throw new Error(`Failed to retry failed sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const sectionResearcher = new SectionResearcher();