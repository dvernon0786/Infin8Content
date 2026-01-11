/**
 * Filter utility functions for dashboard article filtering
 * Story 15.4: Dashboard Search and Filtering
 */

import type { DashboardArticle } from '@/lib/supabase/realtime';
import type { FilterState, FilterFunction } from '@/lib/types/dashboard.types';

/**
 * Apply all filters to articles with performance optimization
 */
export const applyFilters: FilterFunction = (articles, filters) => {
  const startTime = performance.now();
  
  // If no active filters, return articles as-is
  if (!hasActiveFilters(filters)) {
    return articles;
  }

  let filteredArticles = [...articles];

  // Apply status filter
  if (filters.status.length > 0) {
    filteredArticles = filteredArticles.filter(article =>
      filters.status.includes(article.status as any)
    );
  }

  // Apply date range filter
  if (filters.dateRange.start || filters.dateRange.end) {
    filteredArticles = filteredArticles.filter(article =>
      isDateInRange(article.created_at, filters.dateRange)
    );
  }

  // Apply keywords filter
  if (filters.keywords.length > 0) {
    filteredArticles = filteredArticles.filter(article =>
      filters.keywords.some(keyword =>
        article.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
        (article.title?.toLowerCase().includes(keyword.toLowerCase()))
      )
    );
  }

  // Apply word count range filter
  if (filters.wordCountRange.min !== undefined || filters.wordCountRange.max !== undefined) {
    filteredArticles = filteredArticles.filter(article =>
      isInRange(article.progress?.word_count || 0, filters.wordCountRange)
    );
  }

  const endTime = performance.now();
  // Performance tracking would be implemented here for development

  return filteredArticles;
};

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.status.length > 0 ||
    filters.keywords.length > 0 ||
    filters.dateRange.start !== undefined ||
    filters.dateRange.end !== undefined ||
    filters.wordCountRange.min !== undefined ||
    filters.wordCountRange.max !== undefined ||
    filters.sortBy !== undefined
  );
}

/**
 * Check if a specific filter type is active
 */
export function isFilterActive(filters: FilterState, filterType: keyof FilterState): boolean {
  switch (filterType) {
    case 'status':
      return filters.status.length > 0;
    case 'keywords':
      return filters.keywords.length > 0;
    case 'dateRange':
      return filters.dateRange.start !== undefined || filters.dateRange.end !== undefined;
    case 'wordCountRange':
      return filters.wordCountRange.min !== undefined || filters.wordCountRange.max !== undefined;
    case 'sortBy':
      return filters.sortBy !== undefined;
    default:
      return false;
  }
}

/**
 * Check if a date is within the specified range
 */
function isDateInRange(dateString: string, dateRange: { start?: Date; end?: Date }): boolean {
  const date = new Date(dateString);
  
  if (dateRange.start && date < dateRange.start) {
    return false;
  }
  
  if (dateRange.end && date > dateRange.end) {
    return false;
  }
  
  return true;
}

/**
 * Check if a number is within the specified range
 */
function isInRange(value: number, range: { min?: number; max?: number }): boolean {
  if (range.min !== undefined && value < range.min) {
    return false;
  }
  
  if (range.max !== undefined && value > range.max) {
    return false;
  }
  
  return true;
}

/**
 * Get available statuses from articles
 */
export function getAvailableStatuses(articles: DashboardArticle[]): string[] {
  const statuses = new Set(articles.map(article => article.status));
  return Array.from(statuses).sort();
}

/**
 * Get available keywords from articles
 */
export function getAvailableKeywords(articles: DashboardArticle[], limit: number = 50): string[] {
  const keywords = new Set(articles.map(article => article.keyword));
  return Array.from(keywords).slice(0, limit).sort();
}

/**
 * Get date range presets
 */
export const DATE_RANGE_PRESETS = {
  today: {
    label: 'Today',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return { start, end };
    },
  },
  yesterday: {
    label: 'Yesterday',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end };
    },
  },
  thisWeek: {
    label: 'This Week',
    getRange: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const start = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
      return { start, end };
    },
  },
  lastWeek: {
    label: 'Last Week',
    getRange: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const start = new Date(now.getTime() - ((dayOfWeek + 7) * 24 * 60 * 60 * 1000));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
      return { start, end };
    },
  },
  thisMonth: {
    label: 'This Month',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    },
  },
  lastMonth: {
    label: 'Last Month',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    },
  },
  last30Days: {
    label: 'Last 30 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
      return { start, end };
    },
  },
  last90Days: {
    label: 'Last 90 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date(end.getTime() - (90 * 24 * 60 * 60 * 1000));
      return { start, end };
    },
  },
};

/**
 * Get word count range presets
 */
export const WORD_COUNT_PRESETS = {
  short: {
    label: 'Short (< 500 words)',
    range: { min: 0, max: 500 },
  },
  medium: {
    label: 'Medium (500-1500 words)',
    range: { min: 500, max: 1500 },
  },
  long: {
    label: 'Long (1500+ words)',
    range: { min: 1500 },
  },
};

/**
 * Validate filter state
 */
export function validateFilterState(filters: FilterState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate date range
  if (filters.dateRange.start && filters.dateRange.end) {
    if (filters.dateRange.start > filters.dateRange.end) {
      errors.push('Start date must be before end date');
    }
  }

  // Validate word count range
  if (filters.wordCountRange.min !== undefined && filters.wordCountRange.max !== undefined) {
    if (filters.wordCountRange.min > filters.wordCountRange.max) {
      errors.push('Minimum word count must be less than maximum word count');
    }
  }

  // Validate keywords
  if (filters.keywords.some(keyword => keyword.trim().length === 0)) {
    errors.push('Keywords cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize filter state (clean up invalid values)
 */
export function normalizeFilterState(filters: FilterState): FilterState {
  return {
    status: filters.status.filter(status => status && status.trim().length > 0),
    dateRange: {
      start: filters.dateRange.start,
      end: filters.dateRange.end,
    },
    keywords: filters.keywords
      .filter(keyword => keyword && keyword.trim().length > 0)
      .map(keyword => keyword.trim()),
    wordCountRange: {
      min: filters.wordCountRange.min !== undefined ? Math.max(0, filters.wordCountRange.min) : undefined,
      max: filters.wordCountRange.max !== undefined ? Math.max(0, filters.wordCountRange.max) : undefined,
    },
    sortBy: filters.sortBy,
  };
}

/**
 * Serialize filter state to URL query parameters
 */
export function filtersToQueryParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.status.length > 0) {
    params.status = filters.status.join(',');
  }

  if (filters.keywords.length > 0) {
    params.keywords = filters.keywords.join(',');
  }

  if (filters.dateRange.start) {
    params.dateStart = filters.dateRange.start.toISOString();
  }

  if (filters.dateRange.end) {
    params.dateEnd = filters.dateRange.end.toISOString();
  }

  if (filters.wordCountRange.min !== undefined) {
    params.wordCountMin = filters.wordCountRange.min.toString();
  }

  if (filters.wordCountRange.max !== undefined) {
    params.wordCountMax = filters.wordCountRange.max.toString();
  }

  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
  }

  return params;
}

/**
 * Deserialize URL query parameters to filter state
 */
export function queryParamsToFilters(params: Record<string, string>): Partial<FilterState> {
  const filters: Partial<FilterState> = {};

  if (params.status) {
    filters.status = params.status.split(',').filter(Boolean) as any[];
  }

  if (params.keywords) {
    filters.keywords = params.keywords.split(',').map(k => k.trim()).filter(Boolean);
  }

  if (params.dateStart) {
    filters.dateRange = { ...filters.dateRange, start: new Date(params.dateStart) };
  }

  if (params.dateEnd) {
    filters.dateRange = { ...filters.dateRange, end: new Date(params.dateEnd) };
  }

  if (params.wordCountMin) {
    const min = parseInt(params.wordCountMin, 10);
    if (!isNaN(min)) {
      filters.wordCountRange = { ...filters.wordCountRange, min };
    }
  }

  if (params.wordCountMax) {
    const max = parseInt(params.wordCountMax, 10);
    if (!isNaN(max)) {
      filters.wordCountRange = { ...filters.wordCountRange, max };
    }
  }

  if (params.sortBy) {
    filters.sortBy = params.sortBy as any;
  }

  return filters;
}

/**
 * Get filter statistics
 */
export function getFilterStats(articles: DashboardArticle[], filters: FilterState): {
  total: number;
  filtered: number;
  filterBreakdown: Record<string, number>;
} {
  const total = articles.length;
  const filtered = applyFilters(articles, filters).length;

  const filterBreakdown: Record<string, number> = {};

  if (filters.status.length > 0) {
    filterBreakdown.status = applyFilters(articles, { ...filters, status: [] }).length - filtered;
  }

  if (filters.keywords.length > 0) {
    filterBreakdown.keywords = applyFilters(articles, { ...filters, keywords: [] }).length - filtered;
  }

  if (filters.dateRange.start || filters.dateRange.end) {
    filterBreakdown.dateRange = applyFilters(articles, { ...filters, dateRange: {} }).length - filtered;
  }

  if (filters.wordCountRange.min !== undefined || filters.wordCountRange.max !== undefined) {
    filterBreakdown.wordCountRange = applyFilters(articles, { ...filters, wordCountRange: {} }).length - filtered;
  }

  return { total, filtered, filterBreakdown };
}

/**
 * Performance monitoring for filter operations
 */
export class FilterPerformanceMonitor {
  private static metrics: {
    filterCount: number;
    totalTime: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  } = {
    filterCount: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    minTime: Infinity,
  };

  static measureFilter<T>(filterFn: () => T, articleCount: number): T {
    const startTime = performance.now();
    const result = filterFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.updateMetrics(duration);
    
    // Performance warning would be shown in development

    return result;
  }

  private static updateMetrics(duration: number): void {
    this.metrics.filterCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.filterCount;
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);
    this.metrics.minTime = Math.min(this.metrics.minTime, duration);
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static resetMetrics(): void {
    this.metrics = {
      filterCount: 0,
      totalTime: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity,
    };
  }
}
