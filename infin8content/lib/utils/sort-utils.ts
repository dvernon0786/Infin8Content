/**
 * Sort utility functions for dashboard article sorting
 * Story 15.4: Dashboard Search and Filtering
 */

import type { DashboardArticle } from '@/lib/supabase/realtime';
import type { SortOption, SortFunction } from '@/lib/types/dashboard.types';

/**
 * Sort articles with stable sorting algorithm
 */
export const sortArticles: SortFunction = (articles, sortBy) => {
  if (!sortBy) return articles;

  const startTime = performance.now();
  
  // Create a copy with original indices for stable sorting
  const articlesWithIndex = articles.map((article, index) => ({
    article,
    originalIndex: index,
  }));

  // Sort based on the selected option
  articlesWithIndex.sort((a, b) => {
    const comparison = compareArticles(a.article, b.article, sortBy);
    
    // If comparison is equal, maintain original order (stable sort)
    if (comparison === 0) {
      return a.originalIndex - b.originalIndex;
    }
    
    return comparison;
  });

  const sortedArticles = articlesWithIndex.map(item => item.article);

  const endTime = performance.now();
  // Performance tracking would be implemented here for development

  return sortedArticles;
};

/**
 * Compare two articles based on sort option
 */
function compareArticles(a: DashboardArticle, b: DashboardArticle, sortBy: SortOption): number {
  switch (sortBy) {
    case 'mostRecent':
      return sortByDate(b.updated_at, a.updated_at); // Descending (newest first)
    
    case 'oldest':
      return sortByDate(a.updated_at, b.updated_at); // Ascending (oldest first)
    
    case 'titleAZ':
      return sortByTitle(a.title || a.keyword, b.title || b.keyword, 'asc'); // A-Z
    
    case 'titleZA':
      return sortByTitle(a.title || a.keyword, b.title || b.keyword, 'desc'); // Z-A
    
    default:
      return 0;
  }
}

/**
 * Sort by date (ISO string comparison)
 */
function sortByDate(dateA: string, dateB: string): number {
  const timeA = new Date(dateA).getTime();
  const timeB = new Date(dateB).getTime();
  return timeA - timeB;
}

/**
 * Sort by title with locale support
 */
function sortByTitle(titleA: string, titleB: string, direction: 'asc' | 'desc'): number {
  const comparison = titleA.localeCompare(titleB, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Get available sort options with labels
 */
export const SORT_OPTIONS: Array<{
  value: SortOption;
  label: string;
  description: string;
  icon?: string;
}> = [
  {
    value: 'mostRecent',
    label: 'Most Recent',
    description: 'Show newest articles first',
    icon: 'arrow-down',
  },
  {
    value: 'oldest',
    label: 'Oldest',
    description: 'Show oldest articles first',
    icon: 'arrow-up',
  },
  {
    value: 'titleAZ',
    label: 'Title A-Z',
    description: 'Sort alphabetically (A to Z)',
    icon: 'sort-asc',
  },
  {
    value: 'titleZA',
    label: 'Title Z-A',
    description: 'Sort alphabetically (Z to A)',
    icon: 'sort-desc',
  },
];

/**
 * Get sort option by value
 */
export function getSortOption(value: SortOption) {
  return SORT_OPTIONS.find(option => option.value === value);
}

/**
 * Multi-field sorting for advanced scenarios
 */
export function multiFieldSort(
  articles: DashboardArticle[],
  sortFields: Array<{
    field: keyof DashboardArticle;
    direction: 'asc' | 'desc';
    priority: number;
  }>
): DashboardArticle[] {
  const startTime = performance.now();
  
  // Create a copy with original indices for stable sorting
  const articlesWithIndex = articles.map((article, index) => ({
    article,
    originalIndex: index,
  }));

  // Sort by multiple fields in priority order
  articlesWithIndex.sort((a, b) => {
    for (const sortField of sortFields.sort((x, y) => x.priority - y.priority)) {
      const comparison = compareByField(a.article, b.article, sortField.field, sortField.direction);
      
      if (comparison !== 0) {
        return comparison;
      }
    }
    
    // If all comparisons are equal, maintain original order
    return a.originalIndex - b.originalIndex;
  });

  const sortedArticles = articlesWithIndex.map(item => item.article);

  const endTime = performance.now();
    // Performance tracking would be implemented here for development

  return sortedArticles;
}

/**
 * Compare articles by specific field
 */
function compareByField(
  a: DashboardArticle,
  b: DashboardArticle,
  field: keyof DashboardArticle,
  direction: 'asc' | 'desc'
): number {
  let valueA = a[field];
  let valueB = b[field];

  // Handle null/undefined values
  if (valueA === null || valueA === undefined) {
    valueA = '';
  }
  if (valueB === null || valueB === undefined) {
    valueB = '';
  }

  // Convert to strings for comparison
  const strA = String(valueA);
  const strB = String(valueB);

  // Try numeric comparison first
  const numA = parseFloat(strA);
  const numB = parseFloat(strB);
  
  if (!isNaN(numA) && !isNaN(numB)) {
    const comparison = numA - numB;
    return direction === 'asc' ? comparison : -comparison;
  }

  // Date comparison for date fields
  if (field.includes('date') || field.includes('time')) {
    const dateA = new Date(strA).getTime();
    const dateB = new Date(strB).getTime();
    if (!isNaN(dateA) && !isNaN(dateB)) {
      const comparison = dateA - dateB;
      return direction === 'asc' ? comparison : -comparison;
    }
  }

  // String comparison with locale support
  const comparison = strA.localeCompare(strB, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  
  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Smart sorting that adapts to data characteristics
 */
export function smartSort(articles: DashboardArticle[]): DashboardArticle[] {
  const startTime = performance.now();
  
  // Analyze data characteristics
  const hasTitles = articles.some(article => article.title && article.title.trim().length > 0);
  const hasVariedDates = hasDateVariation(articles);
  const hasVariedStatus = hasStatusVariation(articles);

  // Choose best sort strategy based on data
  let sortBy: SortOption;
  
  if (hasVariedDates) {
    sortBy = 'mostRecent'; // Default to date sorting if dates vary
  } else if (hasTitles) {
    sortBy = 'titleAZ'; // Use title sorting if no date variation
  } else {
    sortBy = 'mostRecent'; // Fallback to date sorting
  }

  const sorted = sortArticles(articles, sortBy);

  const endTime = performance.now();
    // Performance tracking would be implemented here for development

  return sorted;
}

/**
 * Check if articles have date variation
 */
function hasDateVariation(articles: DashboardArticle[]): boolean {
  if (articles.length < 2) return false;
  
  const firstDate = new Date(articles[0].updated_at).getTime();
  const lastDate = new Date(articles[articles.length - 1].updated_at).getTime();
  
  // Consider variation if difference is more than 1 minute
  return Math.abs(firstDate - lastDate) > 60000;
}

/**
 * Check if articles have status variation
 */
function hasStatusVariation(articles: DashboardArticle[]): boolean {
  const statuses = new Set(articles.map(article => article.status));
  return statuses.size > 1;
}

/**
 * Batch sort for large datasets with performance optimization
 */
export function batchSort(
  articles: DashboardArticle[],
  sortBy: SortOption,
  batchSize: number = 1000
): DashboardArticle[] {
  const startTime = performance.now();
  
  if (articles.length <= batchSize) {
    return sortArticles(articles, sortBy);
  }

  // Sort in batches for very large datasets
  const sortedBatches: DashboardArticle[][] = [];
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const sortedBatch = sortArticles(batch, sortBy);
    sortedBatches.push(sortedBatch);
  }

  // Merge sorted batches
  const finalSorted = mergeSortedBatches(sortedBatches, sortBy);

  const endTime = performance.now();
    // Performance tracking would be implemented here for development

  return finalSorted;
}

/**
 * Merge multiple sorted batches maintaining sort order
 */
function mergeSortedBatches(batches: DashboardArticle[][], sortBy: SortOption): DashboardArticle[] {
  if (batches.length === 1) return batches[0];
  
  const result: DashboardArticle[] = [];
  const batchIndices = new Array(batches.length).fill(0);
  
  while (batchIndices.some((index, batchIndex) => index < batches[batchIndex].length)) {
    let bestBatchIndex = -1;
    let bestArticle: DashboardArticle | null = null;
    
    // Find the best article among current batch positions
    for (let i = 0; i < batches.length; i++) {
      const currentIndex = batchIndices[i];
      
      if (currentIndex >= batches[i].length) continue;
      
      const currentArticle = batches[i][currentIndex];
      
      if (bestArticle === null || compareArticles(currentArticle, bestArticle, sortBy) < 0) {
        bestArticle = currentArticle;
        bestBatchIndex = i;
      }
    }
    
    if (bestBatchIndex !== -1 && bestArticle) {
      result.push(bestArticle);
      batchIndices[bestBatchIndex]++;
    }
  }
  
  return result;
}

/**
 * Performance monitoring for sort operations
 */
export class SortPerformanceMonitor {
  private static metrics: {
    sortCount: number;
    totalTime: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
    sortStrategies: Record<string, number>;
  } = {
    sortCount: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    minTime: Infinity,
    sortStrategies: {},
  };

  static measureSort<T>(sortFn: () => T, articleCount: number, strategy: string): T {
    const startTime = performance.now();
    const result = sortFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.updateMetrics(duration, strategy);
    
    // Performance warning would be shown in development

    return result;
  }

  private static updateMetrics(duration: number, strategy: string): void {
    this.metrics.sortCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.sortCount;
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);
    this.metrics.minTime = Math.min(this.metrics.minTime, duration);
    
    this.metrics.sortStrategies[strategy] = (this.metrics.sortStrategies[strategy] || 0) + 1;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static resetMetrics(): void {
    this.metrics = {
      sortCount: 0,
      totalTime: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity,
      sortStrategies: {},
    };
  }
}

/**
 * Sort validation utilities
 */
export function validateSortOption(sortBy: string): sortBy is SortOption {
  return ['mostRecent', 'oldest', 'titleAZ', 'titleZA'].includes(sortBy);
}

/**
 * Get sort direction indicator
 */
export function getSortDirection(sortBy: SortOption): 'asc' | 'desc' {
  switch (sortBy) {
    case 'mostRecent':
      return 'desc';
    case 'oldest':
      return 'asc';
    case 'titleAZ':
      return 'asc';
    case 'titleZA':
      return 'desc';
    default:
      return 'desc';
  }
}

/**
 * Get human-readable sort description
 */
export function getSortDescription(sortBy: SortOption): string {
  const option = getSortOption(sortBy);
  return option?.description || 'Sort articles';
}
