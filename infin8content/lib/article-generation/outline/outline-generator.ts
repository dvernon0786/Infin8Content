// Outline Generator
// Story 4A-2: Section-by-Section Architecture and Outline Generation
// Tier-1 Producer story for article generation infrastructure

import { articleService } from '../article-service';
import { SectionArchitect } from './section-architect';
import { ContentPlanner } from './content-planner';
import { researchCache } from '@/lib/research/research-cache';
import { batchResearchOptimizer } from '@/lib/research/batch/batch-research-optimizer';

export interface ArticleOutline {
  id: string;
  articleId: string;
  keyword: string;
  targetWordCount: number;
  sections: OutlineSection[];
  estimatedWordCount: number;
  generatedAt: string;
  metadata: OutlineMetadata;
}

export interface OutlineSection {
  id: string;
  type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';
  title: string;
  order: number;
  estimatedWordCount: number;
  keywords: string[];
  researchTopics: string[];
  contentStrategy: ContentStrategy;
  dependencies: string[]; // Section IDs that should be completed first
}

export interface ContentStrategy {
  approach: 'informative' | 'persuasive' | 'narrative' | 'technical';
  tone: 'professional' | 'conversational' | 'casual' | 'formal';
  perspective: 'first-person' | 'second-person' | 'third-person';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  includeCitations: boolean;
  includeExamples: boolean;
  includeData: boolean;
}

export interface OutlineMetadata {
  researchDataUsed: boolean;
  serpAnalysisUsed: boolean;
  contentGapsIdentified: string[];
  competitorInsights: string[];
  estimatedReadTime: number;
  seoScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface OutlineGenerationRequest {
  articleId: string;
  keyword: string;
  targetWordCount: number;
  writingStyle: string;
  targetAudience: string;
  customInstructions?: string;
}

export class OutlineGenerator {
  private sectionArchitect: SectionArchitect;
  private contentPlanner: ContentPlanner;

  constructor() {
    this.sectionArchitect = new SectionArchitect();
    this.contentPlanner = new ContentPlanner();
  }

  async generateOutline(request: OutlineGenerationRequest): Promise<ArticleOutline> {
    const startTime = Date.now();

    try {
      // Step 1: Gather research data
      const researchData = await this.gatherResearchData(request.keyword);
      
      // Step 2: Analyze SERP data
      const serpData = await this.analyzeSERPData(request.keyword);
      
      // Step 3: Identify content gaps
      const contentGaps = await this.identifyContentGaps(request.keyword, researchData, serpData);
      
      // Step 4: Generate section architecture
      const sectionArchitecture = await this.sectionArchitect.createSectionArchitecture(
        request.keyword,
        request.targetWordCount,
        researchData,
        serpData,
        contentGaps
      );
      
      // Step 5: Plan content strategy
      const contentStrategy = await this.contentPlanner.planContentStrategy(
        request.writingStyle,
        request.targetAudience,
        sectionArchitecture
      );
      
      // Step 6: Build complete outline
      const outline = await this.buildOutline(
        request,
        sectionArchitecture,
        contentStrategy,
        researchData,
        serpData,
        contentGaps
      );
      
      // Step 7: Save outline to article
      await this.saveOutline(request.articleId, outline);
      
      // Step 8: Update article status
      await articleService.updateArticle(request.articleId, {
        outline: outline,
        metadata: {
          outlineGenerated: true,
          outlineGenerationTime: Date.now() - startTime,
          sectionsCount: outline.sections.length,
          estimatedWordCount: outline.estimatedWordCount
        }
      });

      return outline;

    } catch (error) {
      console.error('Outline generation failed:', error);
      throw new Error(`Failed to generate outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async gatherResearchData(keyword: string): Promise<any> {
    try {
      // Check cache first
      const cachedData = await (researchCache as any).getCache(`research:${keyword}`, 'keyword_research');
      if (cachedData) {
        return cachedData;
      }

      // Use batch research optimizer for fresh data
      const researchResults = await batchResearchOptimizer.performBatchResearch({
        organizationId: 'default',
        userId: 'default',
        mainKeyword: keyword,
        options: {
          maxSourcesPerSection: 10
        }
      });

      // Cache the results
      await (researchCache as any).setCache(`research:${keyword}`, researchResults, 'keyword_research');

      return researchResults;

    } catch (error) {
      console.warn('Failed to gather research data:', error);
      return null;
    }
  }

  private async analyzeSERPData(keyword: string): Promise<any> {
    try {
      // Check cache first
      const cachedData = await (researchCache as any).getCache(`serp:${keyword}`, 'serp_analysis');
      if (cachedData) {
        return cachedData;
      }

      // This would integrate with SERP analysis service
      // For now, return mock data
      const serpData = {
        keyword,
        topResults: [],
        commonTopics: [],
        averageWordCount: 2000,
        headingStructure: {
          h2Count: 5,
          h3Count: 15,
          faqPresent: true
        },
        contentGaps: [],
        competitorInsights: []
      };

      // Cache the results
      await (researchCache as any).setCache(`serp:${keyword}`, serpData, 'serp_analysis');

      return serpData;

    } catch (error) {
      console.warn('Failed to analyze SERP data:', error);
      return null;
    }
  }

  private async identifyContentGaps(keyword: string, researchData: any, serpData: any): Promise<string[]> {
    const gaps: string[] = [];

    try {
      // Analyze research data for gaps
      if (researchData && researchData.sources) {
        const coveredTopics = new Set<string>();
        
        researchData.sources.forEach((source: any) => {
          if (source.topics) {
            source.topics.forEach((topic: string) => coveredTopics.add(topic.toLowerCase()));
          }
        });

        // Identify common topics not covered
        const commonTopics = [
          'benefits', 'drawbacks', 'examples', 'case studies', 
          'best practices', 'common mistakes', 'future trends',
          'comparison', 'how-to', 'troubleshooting'
        ];

        commonTopics.forEach(topic => {
          if (!coveredTopics.has(topic)) {
            gaps.push(topic);
          }
        });
      }

      // Analyze SERP data for gaps
      if (serpData && serpData.contentGaps) {
        gaps.push(...serpData.contentGaps);
      }

      return gaps;

    } catch (error) {
      console.warn('Failed to identify content gaps:', error);
      return gaps;
    }
  }

  private async buildOutline(
    request: OutlineGenerationRequest,
    sectionArchitecture: any,
    contentStrategy: any,
    researchData: any,
    serpData: any,
    contentGaps: string[]
  ): Promise<ArticleOutline> {
    const sections: OutlineSection[] = [];
    let sectionOrder = 1;

    // Introduction section
    sections.push({
      id: `section-${sectionOrder}`,
      type: 'introduction',
      title: `Introduction to ${request.keyword}`,
      order: sectionOrder++,
      estimatedWordCount: Math.min(300, request.targetWordCount * 0.1),
      keywords: [request.keyword],
      researchTopics: this.generateResearchTopics(request.keyword, 'introduction'),
      contentStrategy: contentStrategy,
      dependencies: []
    });

    // H2 sections based on architecture
    const h2Sections = sectionArchitecture.sections || [];
    for (const h2Section of h2Sections) {
      sections.push({
        id: `section-${sectionOrder}`,
        type: 'h2',
        title: h2Section.title,
        order: sectionOrder++,
        estimatedWordCount: Math.min(600, Math.floor(request.targetWordCount * 0.15)),
        keywords: h2Section.keywords || [request.keyword],
        researchTopics: this.generateResearchTopics(h2Section.title, 'h2'),
        contentStrategy: contentStrategy,
        dependencies: [`section-1`] // Depends on introduction
      });

      // H3 subsections
      const h3Sections = h2Section.subsections || [];
      for (const h3Section of h3Sections) {
        sections.push({
          id: `section-${sectionOrder}`,
          type: 'h3',
          title: h3Section.title,
          order: sectionOrder++,
          estimatedWordCount: Math.min(400, Math.floor(request.targetWordCount * 0.08)),
          keywords: h3Section.keywords || [request.keyword],
          researchTopics: this.generateResearchTopics(h3Section.title, 'h3'),
          contentStrategy: contentStrategy,
          dependencies: [`section-${sectionOrder - h3Sections.length - 1}`] // Depends on parent H2
        });
      }
    }

    // Conclusion section
    sections.push({
      id: `section-${sectionOrder}`,
      type: 'conclusion',
      title: `Conclusion: ${request.keyword} Summary`,
      order: sectionOrder++,
      estimatedWordCount: Math.min(300, request.targetWordCount * 0.1),
      keywords: [request.keyword],
      researchTopics: this.generateResearchTopics(request.keyword, 'conclusion'),
      contentStrategy: contentStrategy,
      dependencies: sections.slice(1, -1).map(s => s.id) // Depends on all main sections
    });

    // FAQ section (optional)
    if (serpData && serpData.headingStructure && serpData.headingStructure.faqPresent) {
      sections.push({
        id: `section-${sectionOrder}`,
        type: 'faq',
        title: `Frequently Asked Questions About ${request.keyword}`,
        order: sectionOrder++,
        estimatedWordCount: Math.min(400, request.targetWordCount * 0.1),
        keywords: [request.keyword, 'faq', 'questions'],
        researchTopics: this.generateResearchTopics(request.keyword, 'faq'),
        contentStrategy: contentStrategy,
        dependencies: [`section-${sectionOrder - 1}`] // Depends on conclusion
      });
    }

    // Calculate estimated word count
    const estimatedWordCount = sections.reduce((sum, section) => sum + section.estimatedWordCount, 0);

    // Generate metadata
    const metadata: OutlineMetadata = {
      researchDataUsed: !!researchData,
      serpAnalysisUsed: !!serpData,
      contentGapsIdentified: contentGaps,
      competitorInsights: serpData ? serpData.competitorInsights : [],
      estimatedReadTime: Math.ceil(estimatedWordCount / 200), // 200 words per minute
      seoScore: this.calculateSEOScore(sections, researchData, serpData),
      difficulty: this.estimateDifficulty(request.keyword, researchData, serpData)
    };

    return {
      id: `outline-${request.articleId}`,
      articleId: request.articleId,
      keyword: request.keyword,
      targetWordCount: request.targetWordCount,
      sections,
      estimatedWordCount,
      generatedAt: new Date().toISOString(),
      metadata
    };
  }

  private generateResearchTopics(title: string, sectionType: string): string[] {
    const baseTopics = [title.toLowerCase()];
    
    switch (sectionType) {
      case 'introduction':
        baseTopics.push('overview', 'definition', 'importance', 'background');
        break;
      case 'h2':
        baseTopics.push('details', 'examples', 'benefits', 'drawbacks');
        break;
      case 'h3':
        baseTopics.push('specifics', 'implementation', 'best practices');
        break;
      case 'conclusion':
        baseTopics.push('summary', 'key takeaways', 'final thoughts');
        break;
      case 'faq':
        baseTopics.push('questions', 'answers', 'common concerns');
        break;
    }
    
    return baseTopics;
  }

  private calculateSEOScore(sections: OutlineSection[], researchData: any, serpData: any): number {
    let score = 50; // Base score

    // Section structure
    if (sections.length >= 5) score += 10;
    if (sections.some(s => s.type === 'faq')) score += 5;
    if (sections.some(s => s.type === 'conclusion')) score += 5;

    // Keyword coverage
    const keywordCount = sections.reduce((sum, section) => sum + section.keywords.length, 0);
    if (keywordCount >= 10) score += 10;
    if (keywordCount >= 20) score += 10;

    // Research data
    if (researchData) score += 5;
    if (serpData) score += 5;

    return Math.min(100, score);
  }

  private estimateDifficulty(keyword: string, researchData: any, serpData: any): 'easy' | 'medium' | 'hard' {
    // Simple difficulty estimation based on available data
    if (!researchData && !serpData) return 'hard';
    if (researchData && serpData) return 'easy';
    return 'medium';
  }

  private async saveOutline(articleId: string, outline: ArticleOutline): Promise<void> {
    try {
      await articleService.updateArticle(articleId, {
        outline: outline
      });
    } catch (error) {
      console.error('Failed to save outline:', error);
      throw new Error(`Failed to save outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateOutline(articleId: string, updates: Partial<ArticleOutline>): Promise<ArticleOutline> {
    try {
      const article = await articleService.getArticle(articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      const currentOutline = article.outline || {};
      const updatedOutline = { ...currentOutline, ...updates };

      await articleService.updateArticle(articleId, {
        outline: updatedOutline
      });

      return updatedOutline as ArticleOutline;

    } catch (error) {
      console.error('Failed to update outline:', error);
      throw new Error(`Failed to update outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOutline(articleId: string): Promise<ArticleOutline | null> {
    try {
      const article = await articleService.getArticle(articleId);
      if (!article) {
        return null;
      }

      return article.outline as ArticleOutline || null;

    } catch (error) {
      console.error('Failed to get outline:', error);
      throw new Error(`Failed to get outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteOutline(articleId: string): Promise<void> {
    try {
      await articleService.updateArticle(articleId, {
        outline: null
      });
    } catch (error) {
      console.error('Failed to delete outline:', error);
      throw new Error(`Failed to delete outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const outlineGenerator = new OutlineGenerator();