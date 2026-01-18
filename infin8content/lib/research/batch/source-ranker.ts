// Source Ranker
// Story 20-2: Batch Research Optimizer
// Tier-1 Producer story for research optimization

export interface Source {
  url: string;
  title?: string;
  description?: string;
  relevance_score?: number;
  publication_date?: string;
  author?: string;
  domain?: string;
  content?: string;
}

export interface RankingCriteria {
  relevanceWeight: number;
  recencyWeight: number;
  authorityWeight: number;
  diversityWeight: number;
}

export interface RankedSource extends Source {
  final_score: number;
  ranking_factors: {
    relevance: number;
    recency: number;
    authority: number;
    diversity: number;
  };
}

export class SourceRanker {
  private defaultCriteria: RankingCriteria = {
    relevanceWeight: 0.4,
    recencyWeight: 0.2,
    authorityWeight: 0.3,
    diversityWeight: 0.1
  };

  rankSourcesByRelevance(
    sources: Source[],
    keyword: string,
    maxSources: number = 8,
    criteria?: Partial<RankingCriteria>
  ): RankedSource[] {
    const rankingCriteria = { ...this.defaultCriteria, ...criteria };
    
    // Score each source
    const scoredSources = sources.map(source => ({
      ...source,
      final_score: 0,
      ranking_factors: {
        relevance: this.calculateRelevanceScore(source, keyword),
        recency: this.calculateRecencyScore(source),
        authority: this.calculateAuthorityScore(source),
        diversity: this.calculateDiversityScore(source, sources)
      }
    }));

    // Calculate final scores
    scoredSources.forEach(source => {
      source.final_score = 
        source.ranking_factors.relevance * rankingCriteria.relevanceWeight +
        source.ranking_factors.recency * rankingCriteria.recencyWeight +
        source.ranking_factors.authority * rankingCriteria.authorityWeight +
        source.ranking_factors.diversity * rankingCriteria.diversityWeight;
    });

    // Sort by final score (descending)
    scoredSources.sort((a, b) => b.final_score - a.final_score);

    // Return top sources
    return scoredSources.slice(0, maxSources);
  }

  private calculateRelevanceScore(source: Source, keyword: string): number {
    let score = 0;
    const keywordLower = keyword.toLowerCase();
    
    // Title relevance
    if (source.title) {
      const titleLower = source.title.toLowerCase();
      const titleWords = titleLower.split(' ');
      const keywordWords = keywordLower.split(' ');
      
      // Exact match bonus
      if (titleLower === keywordLower) {
        score += 1.0;
      }
      
      // Partial match bonus
      const matchingWords = titleWords.filter(word => 
        keywordWords.some(kw => word.includes(kw) || kw.includes(word))
      );
      score += (matchingWords.length / Math.max(titleWords.length, keywordWords.length)) * 0.8;
    }
    
    // Description relevance
    if (source.description) {
      const descriptionLower = source.description.toLowerCase();
      const descriptionWords = descriptionLower.split(' ');
      
      const matchingWords = descriptionWords.filter(word => 
        keywordLower.includes(word) || word.includes(keywordLower)
      );
      score += (matchingWords.length / descriptionWords.length) * 0.6;
    }
    
    // URL relevance
    if (source.url) {
      const urlLower = source.url.toLowerCase();
      if (urlLower.includes(keywordLower.replace(/\s+/g, '-'))) {
        score += 0.4;
      }
    }
    
    // Domain relevance
    if (source.domain) {
      const domainLower = source.domain.toLowerCase();
      if (domainLower.includes(keywordLower.replace(/\s+/g, '-'))) {
        score += 0.3;
      }
    }
    
    return Math.min(score, 1.0);
  }

  private calculateRecencyScore(source: Source): number {
    if (!source.publication_date) {
      return 0.5; // Neutral score for unknown dates
    }
    
    const publicationDate = new Date(source.publication_date);
    const now = new Date();
    const daysDiff = (now.getTime() - publicationDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Score based on recency (newer is better)
    if (daysDiff <= 7) {
      return 1.0; // Very recent
    } else if (daysDiff <= 30) {
      return 0.8; // Recent
    } else if (daysDiff <= 90) {
      return 0.6; // Moderately recent
    } else if (daysDiff <= 365) {
      return 0.4; // Less recent
    } else {
      return 0.2; // Old
    }
  }

  private calculateAuthorityScore(source: Source): number {
    let score = 0.5; // Base score
    
    // Domain authority (simplified)
    if (source.domain) {
      const domain = source.domain.toLowerCase();
      
      // High authority domains
      const highAuthorityDomains = [
        'wikipedia.org', 'edu', 'gov', 'org',
        'harvard.edu', 'mit.edu', 'stanford.edu',
        'nature.com', 'science.org', 'pubmed.ncbi.nlm.nih.gov',
        'forbes.com', 'entrepreneur.com', 'inc.com'
      ];
      
      if (highAuthorityDomains.some(highAuth => domain.includes(highAuth))) {
        score = 1.0;
      } else if (domain.includes('.edu') || domain.includes('.gov')) {
        score = 0.9;
      } else if (domain.includes('.org')) {
        score = 0.8;
      } else if (this.isWellKnownSite(domain)) {
        score = 0.7;
      } else {
        score = 0.4;
      }
    }
    
    // Author authority (if available)
    if (source.author) {
      // Simple heuristic for author authority
      const author = source.author.toLowerCase();
      if (author.includes('ph.d') || author.includes('dr.') || author.includes('professor')) {
        score = Math.min(score + 0.2, 1.0);
      }
    }
    
    return score;
  }

  private calculateDiversityScore(source: Source, allSources: Source[]): number {
    // Penalize duplicate domains to ensure diversity
    const sourceDomain = source.domain;
    if (!sourceDomain) return 1.0;
    
    const domainCount = allSources.filter(s => s.domain === sourceDomain).length;
    
    if (domainCount === 1) {
      return 1.0; // Unique domain
    } else if (domainCount === 2) {
      return 0.7; // Some duplication
    } else if (domainCount === 3) {
      return 0.4; // More duplication
    } else {
      return 0.1; // High duplication
    }
  }

  private isWellKnownSite(domain: string): boolean {
    const wellKnownSites = [
      'medium.com', 'linkedin.com', 'twitter.com',
      'youtube.com', 'reddit.com', 'quora.com',
      'github.com', 'stackoverflow.com',
      'wired.com', 'techcrunch.com', 'venturebeat.com',
      'hbr.org', 'mckinsey.com', 'deloitte.com',
      'nytimes.com', 'washingtonpost.com', 'bbc.com'
    ];
    
    return wellKnownSites.some(site => domain.includes(site));
  }

  filterByQuality(sources: Source[], minAuthorityScore: number = 0.3): Source[] {
    return sources.filter(source => {
      const authorityScore = this.calculateAuthorityScore(source);
      return authorityScore >= minAuthorityScore;
    });
  }

  filterByRecency(sources: Source[], maxAgeDays: number = 365): Source[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    return sources.filter(source => {
      if (!source.publication_date) return true; // Keep if unknown date
      
      const publicationDate = new Date(source.publication_date);
      return publicationDate >= cutoffDate;
    });
  }

  deduplicateByDomain(sources: Source[]): Source[] {
    const seenDomains = new Set<string>();
    return sources.filter(source => {
      if (!source.domain) return true;
      
      if (seenDomains.has(source.domain)) {
        return false;
      }
      
      seenDomains.add(source.domain);
      return true;
    });
  }

  deduplicateByUrl(sources: Source[]): Source[] {
    const seenUrls = new Set<string>();
    return sources.filter(source => {
      if (seenUrls.has(source.url)) {
        return false;
      }
      
      seenUrls.add(source.url);
      return true;
    });
  }

  balanceSourceTypes(sources: Source[]): Source[] {
    // Balance between different types of sources
    const categories = {
      academic: [] as Source[],
      news: [] as Source[],
      blog: [] as Source[],
      commercial: [] as Source[],
      other: [] as Source[]
    };
    
    sources.forEach(source => {
      const category = this.categorizeSource(source);
      categories[category].push(source);
    });
    
    // Take balanced selection from each category
    const balancedSources: Source[] = [];
    const maxPerCategory = Math.ceil(sources.length / Object.keys(categories).length);
    
    Object.values(categories).forEach(categorySources => {
      balancedSources.push(...categorySources.slice(0, maxPerCategory));
    });
    
    return balancedSources.slice(0, sources.length);
  }

  private categorizeSource(source: Source): keyof typeof categories {
    const domain = source.domain?.toLowerCase() || '';
    
    if (domain.includes('.edu') || domain.includes('.gov') || domain.includes('wikipedia')) {
      return 'academic';
    }
    
    if (domain.includes('news') || domain.includes('times') || domain.includes('post') || domain.includes('cnn') || domain.includes('bbc')) {
      return 'news';
    }
    
    if (domain.includes('blog') || domain.includes('medium') || domain.includes('substack')) {
      return 'blog';
    }
    
    if (domain.includes('.com') && this.isCommercialSite(domain)) {
      return 'commercial';
    }
    
    return 'other';
  }

  private isCommercialSite(domain: string): boolean {
    const commercialIndicators = [
      'shop', 'store', 'buy', 'sell', 'price', 'cost',
      'amazon', 'ebay', 'walmart', 'target', 'bestbuy'
    ];
    
    return commercialIndicators.some(indicator => domain.includes(indicator));
  }

  getRankingReport(sources: Source[], keyword: string): {
    total_sources: number;
    ranked_sources: RankedSource[];
    average_score: number;
    score_distribution: {
      high: number;
      medium: number;
      low: number;
    };
    domain_diversity: number;
    recency_distribution: {
      recent: number;
      moderate: number;
      old: number;
    };
  } {
    const rankedSources = this.rankSourcesByRelevance(sources, keyword);
    
    const averageScore = rankedSources.reduce((sum, source) => sum + source.final_score, 0) / rankedSources.length;
    
    const scoreDistribution = {
      high: rankedSources.filter(s => s.final_score >= 0.7).length,
      medium: rankedSources.filter(s => s.final_score >= 0.4 && s.final_score < 0.7).length,
      low: rankedSources.filter(s => s.final_score < 0.4).length
    };
    
    const uniqueDomains = new Set(rankedSources.map(s => s.domain).filter(Boolean));
    const domainDiversity = uniqueDomains.size / rankedSources.length;
    
    const recencyDistribution = {
      recent: rankedSources.filter(s => s.ranking_factors.recency >= 0.8).length,
      moderate: rankedSources.filter(s => s.ranking_factors.recency >= 0.4 && s.ranking_factors.recency < 0.8).length,
      old: rankedSources.filter(s => s.ranking_factors.recency < 0.4).length
    };
    
    return {
      total_sources: sources.length,
      ranked_sources: rankedSources,
      average_score: averageScore,
      score_distribution: scoreDistribution,
      domain_diversity: domainDiversity,
      recency_distribution: recencyDistribution
    };
  }
}