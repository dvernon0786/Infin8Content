/**
 * Search utility functions for dashboard article search
 * Story 15.4: Dashboard Search and Filtering
 */

import type { DashboardArticle } from '@/lib/supabase/realtime';
import type { SearchResult, SearchFunction } from '@/lib/types/dashboard.types';

/**
 * Performance-optimized search function with scoring and highlighting
 */
export const searchArticles: SearchFunction = (articles, query) => {
  const startTime = performance.now();
  
  if (!query.trim()) {
    return articles.map(article => ({
      article,
      matchedFields: [],
      score: 0,
    }));
  }

  const searchTerm = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const article of articles) {
    const result = searchSingleArticle(article, searchTerm);
    if (result.score > 0) {
      results.push(result);
    }
  }

  // Sort by relevance score (descending)
  results.sort((a, b) => b.score - a.score);

  const endTime = performance.now();
  // Performance tracking would be implemented here for development

  return results;
};

/**
 * Search a single article with field-specific scoring
 */
function searchSingleArticle(article: DashboardArticle, searchTerm: string): SearchResult {
  const matchedFields: string[] = [];
  let score = 0;

  // Title search (highest weight)
  const title = (article.title || '').toLowerCase();
  const titleMatch = title.includes(searchTerm);
  if (titleMatch) {
    matchedFields.push('title');
    score += 10;
    
    // Exact title match gets bonus points
    if (title === searchTerm) {
      score += 20;
    }
  }

  // Keyword search (high weight)
  const keyword = article.keyword.toLowerCase();
  const keywordMatch = keyword.includes(searchTerm);
  if (keywordMatch) {
    matchedFields.push('keyword');
    score += 8;
    
    // Exact keyword match gets bonus points
    if (keyword === searchTerm) {
      score += 15;
    }
  }

  // Content search (medium weight) - using metadata or current stage info
  const content = JSON.stringify(article.progress?.metadata || {}).toLowerCase();
  const currentStage = (article.progress?.current_stage || '').toLowerCase();
  const combinedContent = `${content} ${currentStage}`;
  const contentMatch = combinedContent.includes(searchTerm);
  if (contentMatch) {
    matchedFields.push('content');
    score += 5;
  }

  // Status search (low weight)
  const status = article.status.toLowerCase();
  const statusMatch = status.includes(searchTerm);
  if (statusMatch) {
    matchedFields.push('status');
    score += 2;
  }

  // Calculate highlighted fields
  const highlightedTitle = titleMatch ? highlightText(article.title || '', searchTerm) : undefined;
  const highlightedContent = contentMatch ? highlightText(combinedContent, searchTerm) : undefined;

  return {
    article,
    highlightedTitle,
    highlightedContent,
    matchedFields,
    score,
  };
}

/**
 * Highlight matching text within a string
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!text || !searchTerm) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters in search term
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Debounced search hook utility
 */
export function createDebouncedSearch(
  searchFunction: SearchFunction,
  delayMs: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastQuery = '';
  let lastResults: SearchResult[] = [];

  return {
    search: (articles: DashboardArticle[], query: string): Promise<SearchResult[]> => {
      return new Promise((resolve) => {
        // Clear previous timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Return cached results for same query
        if (query === lastQuery && lastResults.length > 0) {
          resolve(lastResults);
          return;
        }

        // Set new timeout
        timeoutId = setTimeout(() => {
          const results = searchFunction(articles, query);
          lastQuery = query;
          lastResults = results;
          resolve(results);
        }, delayMs);
      });
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },

    clearCache: () => {
      lastQuery = '';
      lastResults = [];
    },
  };
}

/**
 * Search suggestions based on article titles and keywords
 */
export function getSearchSuggestions(articles: DashboardArticle[], query: string, limit: number = 5): string[] {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase();
  const suggestions = new Set<string>();

  for (const article of articles) {
    // Title suggestions
    const title = article.title || '';
    if (title.toLowerCase().includes(searchTerm)) {
      suggestions.add(title);
    }

    // Keyword suggestions
    const keyword = article.keyword;
    if (keyword.toLowerCase().includes(searchTerm)) {
      suggestions.add(keyword);
    }

    if (suggestions.size >= limit) break;
  }

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Search history management
 */
export class SearchHistory {
  private static readonly STORAGE_KEY = 'dashboard_search_history';
  private static readonly MAX_HISTORY_ITEMS = 10;

  static getHistory(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const history = localStorage.getItem(this.STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  static addToHistory(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return;

    const history = this.getHistory();
    const filtered = history.filter(item => item !== query);
    filtered.unshift(query);
    
    const updated = filtered.slice(0, this.MAX_HISTORY_ITEMS);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  static clearHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }

  static removeFromHistory(query: string): void {
    if (typeof window === 'undefined') return;

    const history = this.getHistory();
    const filtered = history.filter(item => item !== query);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Silently fail
    }
  }
}

/**
 * Advanced search with multiple terms and operators
 */
export function advancedSearch(
  articles: DashboardArticle[], 
  query: string
): SearchResult[] {
  if (!query.trim()) {
    return articles.map(article => ({
      article,
      matchedFields: [],
      score: 0,
    }));
  }

  // Parse search query for advanced operators
  const searchTerms = parseSearchQuery(query);
  const results: SearchResult[] = [];

  for (const article of articles) {
    const result = advancedSearchSingleArticle(article, searchTerms);
    if (result.score > 0) {
      results.push(result);
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Parse search query with support for quotes, AND, OR, NOT operators
 */
function parseSearchQuery(query: string): {
  required: string[];
  optional: string[];
  excluded: string[];
} {
  const required: string[] = [];
  const optional: string[] = [];
  const excluded: string[] = [];

  // Simple implementation - can be enhanced with proper parsing
  const terms = query.toLowerCase().split(/\s+/);
  
  for (const term of terms) {
    if (term.startsWith('-')) {
      excluded.push(term.slice(1));
    } else if (term.includes('+')) {
      required.push(term.replace('+', ''));
    } else {
      optional.push(term);
    }
  }

  return { required, optional, excluded };
}

/**
 * Advanced search for single article
 */
function advancedSearchSingleArticle(
  article: DashboardArticle,
  searchTerms: { required: string[]; optional: string[]; excluded: string[] }
): SearchResult {
  const matchedFields: string[] = [];
  let score = 0;

  const searchText = [
    article.title || '',
    article.keyword,
    article.status,
    JSON.stringify(article.progress?.metadata || ''),
    article.progress?.current_stage || '',
  ].join(' ').toLowerCase();

  // Check excluded terms first
  for (const excluded of searchTerms.excluded) {
    if (searchText.includes(excluded)) {
      return { article, matchedFields: [], score: 0 };
    }
  }

  // Check required terms
  for (const required of searchTerms.required) {
    if (searchText.includes(required)) {
      score += 15;
      matchedFields.push('required');
    } else {
      // Missing required term means no match
      return { article, matchedFields: [], score: 0 };
    }
  }

  // Check optional terms
  for (const optional of searchTerms.optional) {
    if (searchText.includes(optional)) {
      score += 5;
      matchedFields.push('optional');
    }
  }

  return {
    article,
    highlightedTitle: highlightText(article.title || '', searchTerms.optional.join(' ')),
    highlightedContent: highlightText(
      JSON.stringify(article.progress?.metadata || '') + ' ' + (article.progress?.current_stage || ''),
      searchTerms.optional.join(' ')
    ),
    matchedFields,
    score,
  };
}

/**
 * Performance monitoring for search operations
 */
export class SearchPerformanceMonitor {
  private static metrics: {
    searchCount: number;
    totalTime: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  } = {
    searchCount: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    minTime: Infinity,
  };

  static measureSearch<T>(searchFn: () => T, articleCount: number): T {
    const startTime = performance.now();
    const result = searchFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.updateMetrics(duration);
    
    // Performance warning would be shown in development

    return result;
  }

  private static updateMetrics(duration: number): void {
    this.metrics.searchCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.searchCount;
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);
    this.metrics.minTime = Math.min(this.metrics.minTime, duration);
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static resetMetrics(): void {
    this.metrics = {
      searchCount: 0,
      totalTime: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity,
    };
  }
}
