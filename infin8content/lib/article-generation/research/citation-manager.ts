// Citation Manager
// Story 4A-3: Real-Time Research Per Section (Tavily Integration)
// Tier-1 Producer story for article generation infrastructure

import { ResearchSource, Citation } from './real-time-researcher';

export interface CitationStyle {
  name: string;
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee';
  inText: (citation: Citation) => string;
  reference: (citation: Citation) => string;
}

export interface CitationOptions {
  style: CitationStyle['format'];
  includeUrls: boolean;
  includeAuthors: boolean;
  includeDates: boolean;
  maxCitations: number;
  sortBy: 'relevance' | 'date' | 'credibility' | 'alphabetical';
}

export interface CitationReport {
  sectionId: string;
  totalCitations: number;
  citations: Citation[];
  style: CitationStyle['format'];
  generatedAt: string;
  quality: CitationQuality;
}

export interface CitationQuality {
  averageRelevanceScore: number;
  averageCredibilityScore: number;
  diverseSources: boolean;
  recentSources: boolean;
  authoritativeSources: boolean;
}

export class CitationManager {
  private citationStyles: Map<CitationStyle['format'], CitationStyle>;

  constructor() {
    this.citationStyles = new Map();
    this.initializeCitationStyles();
  }

  async generateCitations(
    sources: ResearchSource[],
    options: CitationOptions
  ): Promise<Citation[]> {
    const citations: Citation[] = [];
    
    // Sort sources based on criteria
    const sortedSources = this.sortSources(sources, options.sortBy);
    
    // Limit to max citations
    const limitedSources = sortedSources.slice(0, options.maxCitations);
    
    // Generate citations
    for (let i = 0; i < limitedSources.length; i++) {
      const source = limitedSources[i];
      
      const citation: Citation = {
        id: `citation-${i}`,
        source,
        context: this.generateCitationContext(source),
        relevanceScore: source.relevanceScore,
        position: this.determineCitationPosition(source),
        formattedCitation: this.formatCitation(source, options)
      };
      
      citations.push(citation);
    }
    
    return citations;
  }

  async formatCitations(
    citations: Citation[],
    style: CitationStyle['format']
  ): Promise<{
    inText: string[];
    references: string[];
  }> {
    const citationStyle = this.citationStyles.get(style);
    if (!citationStyle) {
      throw new Error(`Unsupported citation style: ${style}`);
    }

    const inText = citations.map(citation => citationStyle.inText(citation));
    const references = citations.map(citation => citationStyle.reference(citation));

    return {
      inText,
      references
    };
  }

  async generateCitationReport(
    sectionId: string,
    citations: Citation[],
    style: CitationStyle['format']
  ): Promise<CitationReport> {
    const quality = this.calculateCitationQuality(citations);
    
    return {
      sectionId,
      totalCitations: citations.length,
      citations,
      style,
      generatedAt: new Date().toISOString(),
      quality
    };
  }

  async validateCitations(citations: Citation[]): Promise<{
    valid: Citation[];
    invalid: Citation[];
    issues: CitationIssue[];
  }> {
    const valid: Citation[] = [];
    const invalid: Citation[] = [];
    const issues: CitationIssue[] = [];

    for (const citation of citations) {
      const citationIssues = this.validateCitation(citation);
      
      if (citationIssues.length === 0) {
        valid.push(citation);
      } else {
        invalid.push(citation);
        issues.push(...citationIssues);
      }
    }

    return {
      valid,
      invalid,
      issues
    };
  }

  async optimizeCitations(
    citations: Citation[],
    targetCount: number
  ): Promise<Citation[]> {
    if (citations.length <= targetCount) {
      return citations;
    }

    // Sort by combined relevance and credibility
    const sortedCitations = citations.sort((a, b) => {
      const scoreA = a.relevanceScore * 0.6 + (a.source.credibilityScore || 0) * 0.4;
      const scoreB = b.relevanceScore * 0.6 + (b.source.credibilityScore || 0) * 0.4;
      return scoreB - scoreA;
    });

    // Ensure diversity of sources
    const optimizedCitations = this.ensureSourceDiversity(sortedCitations, targetCount);

    return optimizedCitations.slice(0, targetCount);
  }

  private initializeCitationStyles(): void {
    // APA Style
    this.citationStyles.set('apa', {
      name: 'APA',
      format: 'apa',
      inText: (citation: Citation) => {
        const author = citation.source.author;
        const year = citation.source.publishDate 
          ? new Date(citation.source.publishDate).getFullYear()
          : 'n.d.';
        
        if (author) {
          return `(${author}, ${year})`;
        } else {
          return `(${citation.source.title.split(' ').slice(0, 2).join(' ')}, ${year})`;
        }
      },
      reference: (citation: Citation) => {
        const parts = [];
        
        if (citation.source.author) {
          parts.push(citation.source.author);
        }
        
        const year = citation.source.publishDate 
          ? new Date(citation.source.publishDate).getFullYear()
          : 'n.d.';
        parts.push(`(${year}).`);
        
        if (citation.source.title) {
          parts.push(citation.source.title);
        }
        
        if (citation.source.url) {
          parts.push(citation.source.url);
        }
        
        return parts.join('. ');
      }
    });

    // MLA Style
    this.citationStyles.set('mla', {
      name: 'MLA',
      format: 'mla',
      inText: (citation: Citation) => {
        const author = citation.source.author;
        if (author) {
          const lastName = author.split(' ').pop();
          return `(${lastName} ${citation.source.publishDate ? new Date(citation.source.publishDate).getFullYear() : ''})`;
        } else {
          return `("${citation.source.title.split(' ').slice(0, 3).join(' ')}")`;
        }
      },
      reference: (citation: Citation) => {
        const parts = [];
        
        if (citation.source.author) {
          parts.push(citation.source.author);
        }
        
        if (citation.source.title) {
          parts.push(`"${citation.source.title}"`);
        }
        
        if (citation.source.url) {
          parts.push(citation.source.url);
        }
        
        if (citation.source.publishDate) {
          parts.push(new Date(citation.source.publishDate).toLocaleDateString());
        }
        
        return parts.join('. ');
      }
    });

    // Chicago Style
    this.citationStyles.set('chicago', {
      name: 'Chicago',
      format: 'chicago',
      inText: (citation: Citation) => {
        const author = citation.source.author;
        if (author) {
          return `${author.split(' ').pop()}`;
        } else {
          return citation.source.title.split(' ').slice(0, 2).join(' ');
        }
      },
      reference: (citation: Citation) => {
        const parts = [];
        
        if (citation.source.author) {
          parts.push(citation.source.author);
        }
        
        if (citation.source.title) {
          parts.push(`"${citation.source.title}"`);
        }
        
        if (citation.source.url) {
          parts.push(citation.source.url);
        }
        
        if (citation.source.publishDate) {
          parts.push(new Date(citation.source.publishDate).toLocaleDateString());
        }
        
        return parts.join('. ');
      }
    });

    // Harvard Style
    this.citationStyles.set('harvard', {
      name: 'Harvard',
      format: 'harvard',
      inText: (citation: Citation) => {
        const author = citation.source.author;
        const year = citation.source.publishDate 
          ? new Date(citation.source.publishDate).getFullYear()
          : 'n.d.';
        
        if (author) {
          return `(${author}, ${year})`;
        } else {
          return `(${citation.source.title.split(' ').slice(0, 2).join(' ')}, ${year})`;
        }
      },
      reference: (citation: Citation) => {
        const parts = [];
        
        if (citation.source.author) {
          parts.push(citation.source.author);
        }
        
        const year = citation.source.publishDate 
          ? new Date(citation.source.publishDate).getFullYear()
          : 'n.d.';
        parts.push(`(${year})`);
        
        if (citation.source.title) {
          parts.push(citation.source.title);
        }
        
        if (citation.source.url) {
          parts.push(`Available at: ${citation.source.url}`);
        }
        
        return parts.join('. ');
      }
    });

    // IEEE Style
    this.citationStyles.set('ieee', {
      name: 'IEEE',
      format: 'ieee',
      inText: (citation: Citation) => {
        return `[${citation.id.split('-')[1]}]`;
      },
      reference: (citation: Citation) => {
        const parts = [];
        
        if (citation.source.author) {
          parts.push(citation.source.author);
        }
        
        if (citation.source.title) {
          parts.push(`"${citation.source.title}"`);
        }
        
        if (citation.source.url) {
          parts.push(citation.source.url);
        }
        
        if (citation.source.publishDate) {
          parts.push(new Date(citation.source.publishDate).toLocaleDateString());
        }
        
        return parts.join(', ');
      }
    });
  }

  private sortSources(sources: ResearchSource[], sortBy: string): ResearchSource[] {
    const sorted = [...sources];
    
    switch (sortBy) {
      case 'relevance':
        return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
      case 'credibility':
        return sorted.sort((a, b) => (b.credibilityScore || 0) - (a.credibilityScore || 0));
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
          const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
          return dateB - dateA;
        });
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }

  private generateCitationContext(source: ResearchSource): string {
    const contexts = [
      `According to ${source.title}`,
      `${source.title} reports that`,
      `Research from ${source.title} indicates`,
      `As noted by ${source.title}`,
      `${source.title} explains`
    ];
    
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  private determineCitationPosition(source: ResearchSource): 'introduction' | 'support' | 'example' | 'conclusion' {
    if (source.content && source.content.includes('example')) return 'example';
    if (source.content && source.content.includes('study')) return 'support';
    if (source.content && source.content.includes('conclusion')) return 'conclusion';
    
    return 'support';
  }

  private formatCitation(source: ResearchSource, options: CitationOptions): string {
    const parts = [];
    
    if (options.includeAuthors && source.author) {
      parts.push(source.author);
    }
    
    if (source.title) {
      parts.push(`"${source.title}"`);
    }
    
    if (options.includeUrls && source.url) {
      parts.push(source.url);
    }
    
    if (options.includeDates && source.publishDate) {
      parts.push(`(${new Date(source.publishDate).getFullYear()})`);
    }
    
    return parts.join('. ');
  }

  private calculateCitationQuality(citations: Citation[]): CitationQuality {
    if (citations.length === 0) {
      return {
        averageRelevanceScore: 0,
        averageCredibilityScore: 0,
        diverseSources: false,
        recentSources: false,
        authoritativeSources: false
      };
    }

    const averageRelevanceScore = citations.reduce((sum, c) => sum + c.relevanceScore, 0) / citations.length;
    const averageCredibilityScore = citations.reduce((sum, c) => sum + (c.source.credibilityScore || 0), 0) / citations.length;
    
    // Check for diverse sources
    const domains = new Set(citations.map(c => new URL(c.source.url).hostname));
    const diverseSources = domains.size >= 3;
    
    // Check for recent sources
    const recentSources = citations.some(c => {
      if (!c.source.publishDate) return false;
      const publishDate = new Date(c.source.publishDate);
      const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePublish < 365;
    });
    
    // Check for authoritative sources
    const authoritativeSources = citations.some(c => {
      const url = c.source.url.toLowerCase();
      return url.includes('.edu') || url.includes('.gov') || url.includes('.org');
    });

    return {
      averageRelevanceScore,
      averageCredibilityScore,
      diverseSources,
      recentSources,
      authoritativeSources
    };
  }

  private validateCitation(citation: Citation): CitationIssue[] {
    const issues: CitationIssue[] = [];
    
    // Check for required fields
    if (!citation.source.title) {
      issues.push({
        type: 'missing_title',
        message: 'Citation is missing title',
        severity: 'error'
      });
    }
    
    if (!citation.source.url) {
      issues.push({
        type: 'missing_url',
        message: 'Citation is missing URL',
        severity: 'warning'
      });
    }
    
    // Check URL validity
    if (citation.source.url && !this.isValidUrl(citation.source.url)) {
      issues.push({
        type: 'invalid_url',
        message: 'Citation URL is invalid',
        severity: 'error'
      });
    }
    
    // Check for very low relevance
    if (citation.relevanceScore < 0.3) {
      issues.push({
        type: 'low_relevance',
        message: 'Citation has very low relevance score',
        severity: 'warning'
      });
    }
    
    return issues;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private ensureSourceDiversity(citations: Citation[], targetCount: number): Citation[] {
    const domains = new Map<string, Citation[]>();
    
    // Group citations by domain
    for (const citation of citations) {
      try {
        const domain = new URL(citation.source.url).hostname;
        if (!domains.has(domain)) {
          domains.set(domain, []);
        }
        domains.get(domain)!.push(citation);
      } catch {
        // Invalid URL, skip
      }
    }
    
    // Select citations ensuring diversity
    const selectedCitations: Citation[] = [];
    const domainEntries = Array.from(domains.entries());
    
    // First, take one from each domain
    for (const [domain, domainCitations] of domainEntries) {
      if (selectedCitations.length < targetCount) {
        selectedCitations.push(domainCitations[0]);
      }
    }
    
    // Fill remaining slots with best remaining citations
    const remainingCitations = citations.filter(c => !selectedCitations.includes(c));
    remainingCitations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    for (const citation of remainingCitations) {
      if (selectedCitations.length < targetCount) {
        selectedCitations.push(citation);
      }
    }
    
    return selectedCitations;
  }

  async getCitationStatistics(citations: Citation[]): Promise<{
    total: number;
    byDomain: Record<string, number>;
    byDate: Record<string, number>;
    averageRelevance: number;
    averageCredibility: number;
  }> {
    const byDomain: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    
    for (const citation of citations) {
      // Count by domain
      try {
        const domain = new URL(citation.source.url).hostname;
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      } catch {
        byDomain['invalid'] = (byDomain['invalid'] || 0) + 1;
      }
      
      // Count by date
      if (citation.source.publishDate) {
        const year = new Date(citation.source.publishDate).getFullYear().toString();
        byDate[year] = (byDate[year] || 0) + 1;
      } else {
        byDate['unknown'] = (byDate['unknown'] || 0) + 1;
      }
    }
    
    const averageRelevance = citations.length > 0 
      ? citations.reduce((sum, c) => sum + c.relevanceScore, 0) / citations.length 
      : 0;
    
    const averageCredibility = citations.length > 0 
      ? citations.reduce((sum, c) => sum + (c.source.credibilityScore || 0), 0) / citations.length 
      : 0;
    
    return {
      total: citations.length,
      byDomain,
      byDate,
      averageRelevance,
      averageCredibility
    };
  }
}

interface CitationIssue {
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Singleton instance
export const citationManager = new CitationManager();