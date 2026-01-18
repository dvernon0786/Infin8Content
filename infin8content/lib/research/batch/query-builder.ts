// Query Builder
// Story 20-2: Batch Research Optimizer
// Tier-1 Producer story for research optimization

export interface QueryOptions {
  includeTrends?: boolean;
  includeDifficulty?: boolean;
  includeCPC?: boolean;
  includeCompetition?: boolean;
  maxResults?: number;
  language?: string;
  location?: string;
}

export interface ComprehensiveQuery {
  mainQuery: string;
  variations: string[];
  semanticKeywords: string[];
  longTailKeywords: string[];
  questionKeywords: string[];
  options: QueryOptions;
}

export interface TargetedQuery {
  query: string;
  context: string;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  modifiers: string[];
}

export class QueryBuilder {
  
  buildComprehensiveQuery(keyword: string, options: QueryOptions = {}): ComprehensiveQuery {
    const {
      includeTrends = true,
      includeDifficulty = true,
      includeCPC = true,
      includeCompetition = true,
      maxResults = 10,
      language = 'en',
      location = 'us'
    } = options;

    const variations = this.generateQueryVariations(keyword);
    const semanticKeywords = this.generateSemanticKeywords(keyword);
    const longTailKeywords = this.generateLongTailKeywords(keyword);
    const questionKeywords = this.generateQuestionKeywords(keyword);

    return {
      mainQuery: keyword,
      variations,
      semanticKeywords,
      longTailKeywords,
      questionKeywords,
      options: {
        includeTrends,
        includeDifficulty,
        includeCPC,
        includeCompetition,
        maxResults,
        language,
        location
      }
    };
  }

  buildTargetedQuery(keyword: string, context: string, intent: string): TargetedQuery {
    const modifiers = this.generateQueryModifiers(keyword, context, intent);
    
    return {
      query: `${keyword} ${modifiers.join(' ')}`.trim(),
      context,
      intent: intent as any,
      modifiers
    };
  }

  buildSectionQuery(sectionTitle: string, mainKeyword: string): TargetedQuery {
    const sectionKeywords = this.extractSectionKeywords(sectionTitle);
    const query = `${mainKeyword} ${sectionKeywords.join(' ')}`.trim();
    
    return {
      query,
      context: sectionTitle,
      intent: 'informational',
      modifiers: sectionKeywords
    };
  }

  private generateQueryVariations(keyword: string): string[] {
    const variations: string[] = [];
    
    // Add common variations
    variations.push(`${keyword} guide`);
    variations.push(`${keyword} tutorial`);
    variations.push(`${keyword} examples`);
    variations.push(`${keyword} best practices`);
    variations.push(`how to ${keyword}`);
    variations.push(`${keyword} for beginners`);
    variations.push(`advanced ${keyword}`);
    
    // Add keyword-specific variations
    const keywordLower = keyword.toLowerCase();
    if (keywordLower.includes('marketing')) {
      variations.push(`${keyword} strategy`);
      variations.push(`${keyword} campaign`);
      variations.push(`${keyword} automation`);
    }
    
    if (keywordLower.includes('seo')) {
      variations.push(`${keyword} optimization`);
      variations.push(`${keyword} techniques`);
      variations.push(`${keyword} checklist`);
    }
    
    if (keywordLower.includes('content')) {
      variations.push(`${keyword} creation`);
      variations.push(`${keyword} strategy`);
      variations.push(`${keyword} marketing`);
    }
    
    return variations.slice(0, 5); // Limit to 5 variations
  }

  private generateSemanticKeywords(keyword: string): string[] {
    const semanticKeywords: string[] = [];
    
    // Common semantic relationships
    const semanticMap: Record<string, string[]> = {
      'marketing': ['advertising', 'promotion', 'branding', 'outreach'],
      'seo': ['search optimization', 'ranking', 'visibility', 'traffic'],
      'content': ['writing', 'creation', 'articles', 'blogging'],
      'research': ['analysis', 'investigation', 'study', 'data'],
      'optimization': ['improvement', 'enhancement', 'refinement', 'tuning'],
      'strategy': ['planning', 'approach', 'methodology', 'framework']
    };
    
    const keywordLower = keyword.toLowerCase();
    for (const [key, related] of Object.entries(semanticMap)) {
      if (keywordLower.includes(key)) {
        semanticKeywords.push(...related);
      }
    }
    
    return semanticKeywords.slice(0, 8);
  }

  private generateLongTailKeywords(keyword: string): string[] {
    const longTailKeywords: string[] = [];
    
    // Common long-tail patterns
    const patterns = [
      `${keyword} for small business`,
      `${keyword} step by step`,
      `${keyword} without experience`,
      `${keyword} on a budget`,
      `${keyword} that works`,
      `${keyword} best practices`,
      `${keyword} common mistakes`,
      `${keyword} tips and tricks`
    ];
    
    longTailKeywords.push(...patterns);
    
    // Add specific long-tail based on keyword type
    const keywordLower = keyword.toLowerCase();
    if (keywordLower.includes('marketing')) {
      longTailKeywords.push(`${keyword} for local businesses`);
      longTailKeywords.push(`${keyword} automation tools`);
      longTailKeywords.push(`${keyword} roi measurement`);
    }
    
    if (keywordLower.includes('seo')) {
      longTailKeywords.push(`${keyword} for local search`);
      longTailKeywords.push(`${keyword} for e-commerce`);
      longTailKeywords.push(`${keyword} for wordpress`);
    }
    
    return longTailKeywords.slice(0, 6);
  }

  private generateQuestionKeywords(keyword: string): string[] {
    const questionKeywords: string[] = [];
    
    // Common question patterns
    const questions = [
      `what is ${keyword}`,
      `how does ${keyword} work`,
      `why is ${keyword} important`,
      `when to use ${keyword}`,
      `where to learn ${keyword}`,
      `who needs ${keyword}`,
      `how much does ${keyword} cost`,
      `can you do ${keyword} yourself`
    ];
    
    questionKeywords.push(...questions);
    
    // Add specific questions based on keyword type
    const keywordLower = keyword.toLowerCase();
    if (keywordLower.includes('marketing')) {
      questionKeywords.push(`what are the best ${keyword} strategies`);
      questionKeywords.push(`how to measure ${keyword} success`);
    }
    
    if (keywordLower.includes('seo')) {
      questionKeywords.push(`how long does ${keyword} take to work`);
      questionKeywords.push(`what are ${keyword} ranking factors`);
    }
    
    return questionKeywords.slice(0, 5);
  }

  private generateQueryModifiers(keyword: string, context: string, intent: string): string[] {
    const modifiers: string[] = [];
    
    // Context-based modifiers
    if (context.toLowerCase().includes('beginner')) {
      modifiers.push('for beginners');
      modifiers.push('basic');
      modifiers.push('introductory');
    }
    
    if (context.toLowerCase().includes('advanced')) {
      modifiers.push('advanced');
      modifiers.push('expert');
      modifiers.push('professional');
    }
    
    if (context.toLowerCase().includes('business')) {
      modifiers.push('for business');
      modifiers.push('commercial');
      modifiers.push('enterprise');
    }
    
    // Intent-based modifiers
    switch (intent.toLowerCase()) {
      case 'informational':
        modifiers.push('guide');
        modifiers.push('tutorial');
        modifiers.push('explanation');
        break;
      case 'commercial':
        modifiers.push('review');
        modifiers.push('comparison');
        modifiers.push('best');
        break;
      case 'transactional':
        modifiers.push('buy');
        modifiers.push('purchase');
        modifiers.push('order');
        break;
      case 'navigational':
        modifiers.push('website');
        modifiers.push('official');
        modifiers.push('login');
        break;
    }
    
    return modifiers;
  }

  private extractSectionKeywords(sectionTitle: string): string[] {
    const keywords: string[] = [];
    
    // Remove common words and extract meaningful terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = sectionTitle.toLowerCase().split(' ').filter(word => !stopWords.includes(word));
    
    // Extract meaningful keywords
    keywords.push(...words);
    
    // Add related terms
    if (sectionTitle.toLowerCase().includes('introduction')) {
      keywords.push('intro', 'overview', 'getting started');
    }
    
    if (sectionTitle.toLowerCase().includes('conclusion')) {
      keywords.push('summary', 'wrap-up', 'final thoughts');
    }
    
    if (sectionTitle.toLowerCase().includes('benefits')) {
      keywords.push('advantages', 'pros', 'value');
    }
    
    if (sectionTitle.toLowerCase().includes('drawbacks')) {
      keywords.push('disadvantages', 'cons', 'limitations');
    }
    
    return keywords.slice(0, 3);
  }

  optimizeQueryForAPI(query: string, apiType: 'dataforseo' | 'tavily'): string {
    // API-specific optimizations
    switch (apiType) {
      case 'dataforseo':
        // DataForSEO prefers specific, well-structured queries
        return query.toLowerCase().trim();
      case 'tavily':
        // Tavily handles natural language better
        return query;
      default:
        return query;
    }
  }

  buildBatchQuery(keywords: string[]): string {
    // Combine multiple keywords into a single batch query
    const primaryKeywords = keywords.slice(0, 3); // Limit to 3 primary keywords
    const secondaryKeywords = keywords.slice(3, 8); // Add up to 5 secondary keywords
    
    let query = primaryKeywords.join(' OR ');
    
    if (secondaryKeywords.length > 0) {
      query += ' AND (' + secondaryKeywords.join(' OR ') + ')';
    }
    
    return query;
  }

  estimateQueryComplexity(query: string): 'low' | 'medium' | 'high' {
    const wordCount = query.split(' ').length;
    const hasBoolean = /\b(AND|OR|NOT)\b/i.test(query);
    const hasQuotes = query.includes('"');
    
    if (wordCount <= 3 && !hasBoolean && !hasQuotes) {
      return 'low';
    } else if (wordCount <= 8 && hasBoolean) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  simplifyQuery(query: string, maxComplexity: 'low' | 'medium' | 'high' = 'medium'): string {
    const complexity = this.estimateQueryComplexity(query);
    
    if (complexity === 'low' || (complexity === 'medium' && maxComplexity !== 'low')) {
      return query;
    }
    
    // Simplify complex queries
    const words = query.split(' ');
    const maxWords = maxComplexity === 'low' ? 3 : maxComplexity === 'medium' ? 6 : 10;
    
    return words.slice(0, maxWords).join(' ');
  }
}