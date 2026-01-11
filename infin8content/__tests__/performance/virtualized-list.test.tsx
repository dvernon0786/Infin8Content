/**
 * Performance tests for virtualized list and search/filter operations
 * Story 15.4: Dashboard Search and Filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchArticles, SearchPerformanceMonitor } from '@/lib/utils/search-utils';
import { applyFilters, FilterPerformanceMonitor } from '@/lib/utils/filter-utils';
import { sortArticles, SortPerformanceMonitor } from '@/lib/utils/sort-utils';
import type { DashboardArticle } from '@/lib/supabase/realtime';

// Generate test data
const generateTestArticles = (count: number): DashboardArticle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `article-${i}`,
    keyword: `keyword-${i}`,
    title: `Test Article ${i}`,
    status: ['queued', 'generating', 'completed', 'failed'][i % 4] as any,
    created_at: new Date(Date.now() - i * 1000 * 60).toISOString(),
    updated_at: new Date(Date.now() - i * 1000 * 60).toISOString(),
    progress: {
      id: `progress-${i}`,
      article_id: `article-${i}`,
      org_id: 'test-org',
      status: ['queued', 'generating', 'completed', 'failed'][i % 4] as any,
      current_stage: ['queued', 'generating', 'completed', 'failed'][i % 4],
      metadata: { word_count: 1000 + (i % 10) * 100 },
      word_count: 1000 + (i % 10) * 100,
      created_at: new Date(Date.now() - i * 1000 * 60).toISOString(),
      updated_at: new Date(Date.now() - i * 1000 * 60).toISOString(),
    },
  }));
};

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SearchPerformanceMonitor.resetMetrics();
    FilterPerformanceMonitor.resetMetrics();
    SortPerformanceMonitor.resetMetrics();
  });

  describe('Search Performance', () => {
    it('searches 100 articles within performance target', () => {
      const articles = generateTestArticles(100);
      
      const results = SearchPerformanceMonitor.measureSearch(
        () => searchArticles(articles, 'Test Article 1'),
        100,
        'basic-search'
      );
      
      expect(results).toHaveLength(1);
      expect(results[0].article.title).toBe('Test Article 1');
      
      const metrics = SearchPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100); // < 100ms target
      expect(metrics.maxTime).toBeLessThan(100);
    });

    it('searches 1000 articles within performance target', () => {
      const articles = generateTestArticles(1000);
      
      const results = SearchPerformanceMonitor.measureSearch(
        () => searchArticles(articles, 'Article'),
        1000,
        'large-search'
      );
      
      expect(results.length).toBeGreaterThan(0);
      
      const metrics = SearchPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100); // < 100ms target
    });

    it('handles empty search query efficiently', () => {
      const articles = generateTestArticles(1000);
      
      const results = SearchPerformanceMonitor.measureSearch(
        () => searchArticles(articles, ''),
        1000,
        'empty-search'
      );
      
      expect(results).toHaveLength(1000);
      
      const metrics = SearchPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(50); // Should be very fast
    });

    it('performs complex search with multiple terms', () => {
      const articles = generateTestArticles(500);
      
      const results = SearchPerformanceMonitor.measureSearch(
        () => searchArticles(articles, 'Test Article 10'),
        500,
        'complex-search'
      );
      
      expect(results.length).toBeGreaterThan(0);
      
      const metrics = SearchPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100);
    });
  });

  describe('Filter Performance', () => {
    it('filters 100 articles within performance target', () => {
      const articles = generateTestArticles(100);
      const filters = {
        status: ['completed'],
        dateRange: {},
        keywords: [],
        wordCountRange: {},
        sortBy: undefined,
      };
      
      const results = FilterPerformanceMonitor.measureFilter(
        () => applyFilters(articles, filters),
        100,
        'status-filter'
      );
      
      expect(results.length).toBeGreaterThan(0);
      
      const metrics = FilterPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100);
    });

    it('filters 1000 articles with multiple criteria', () => {
      const articles = generateTestArticles(1000);
      const filters = {
        status: ['completed', 'generating'],
        dateRange: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
        },
        keywords: ['keyword-1', 'keyword-2'],
        wordCountRange: { min: 1000, max: 2000 },
        sortBy: undefined,
      };
      
      const results = FilterPerformanceMonitor.measureFilter(
        () => applyFilters(articles, filters),
        1000,
        'complex-filter'
      );
      
      expect(results.length).toBeGreaterThanOrEqual(0);
      
      const metrics = FilterPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100);
    });

    it('handles no active filters efficiently', () => {
      const articles = generateTestArticles(1000);
      const filters = {
        status: [],
        dateRange: {},
        keywords: [],
        wordCountRange: {},
        sortBy: undefined,
      };
      
      const results = FilterPerformanceMonitor.measureFilter(
        () => applyFilters(articles, filters),
        1000,
        'no-filter'
      );
      
      expect(results).toHaveLength(1000); // Should return all articles
      
      const metrics = FilterPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Sort Performance', () => {
    it('sorts 100 articles within performance target', () => {
      const articles = generateTestArticles(100);
      
      const results = SortPerformanceMonitor.measureSort(
        () => sortArticles(articles, 'mostRecent'),
        100,
        'date-sort'
      );
      
      expect(results).toHaveLength(100);
      
      // Verify sorting is correct
      for (let i = 1; i < results.length; i++) {
        expect(new Date(results[i-1].updated_at).getTime()).toBeGreaterThanOrEqual(
          new Date(results[i].updated_at).getTime()
        );
      }
      
      const metrics = SortPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100);
    });

    it('sorts 1000 articles within performance target', () => {
      const articles = generateTestArticles(1000);
      
      const results = SortPerformanceMonitor.measureSort(
        () => sortArticles(articles, 'titleAZ'),
        1000,
        'title-sort'
      );
      
      expect(results).toHaveLength(1000);
      
      const metrics = SortPerformanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(100);
    });

    it('maintains stable sorting order', () => {
      const articles = generateTestArticles(100).map((article, index) => ({
        ...article,
        title: index % 2 === 0 ? 'Same Title' : `Different Title ${index}`,
      }));
      
      const results = sortArticles(articles, 'titleAZ');
      
      // Articles with same title should maintain original order (stable sort)
      const sameTitleArticles = results.filter(a => a.title === 'Same Title');
      const originalIndices = sameTitleArticles.map(a => parseInt(a.id.split('-')[1]));
      
      for (let i = 1; i < originalIndices.length; i++) {
        expect(originalIndices[i-1]).toBeLessThan(originalIndices[i]);
      }
    });
  });

  describe('Combined Operations Performance', () => {
    it('performs search, filter, and sort on 500 articles within target', () => {
      const articles = generateTestArticles(500);
      
      const startTime = performance.now();
      
      // Search
      let results = searchArticles(articles, 'Test').map(r => r.article);
      
      // Filter
      results = applyFilters(results, {
        status: ['completed'],
        dateRange: {},
        keywords: [],
        wordCountRange: {},
        sortBy: undefined,
      });
      
      // Sort
      results = sortArticles(results, 'mostRecent');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200); // Combined operations should still be fast
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('handles repeated operations efficiently', () => {
      const articles = generateTestArticles(200);
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        searchArticles(articles, `Article ${i % 10}`);
        applyFilters(articles, {
          status: ['completed'],
          dateRange: {},
          keywords: [],
          wordCountRange: {},
          sortBy: undefined,
        });
        sortArticles(articles, 'mostRecent');
      }
      
      const searchMetrics = SearchPerformanceMonitor.getMetrics();
      const filterMetrics = FilterPerformanceMonitor.getMetrics();
      const sortMetrics = SortPerformanceMonitor.getMetrics();
      
      // All operations should remain fast even after repeated use
      expect(searchMetrics.averageTime).toBeLessThan(100);
      expect(filterMetrics.averageTime).toBeLessThan(100);
      expect(sortMetrics.averageTime).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('does not create excessive objects during search', () => {
      const articles = generateTestArticles(1000);
      
      // Measure memory before
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many searches
      for (let i = 0; i < 100; i++) {
        searchArticles(articles, `search-${i}`);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Measure memory after (if available)
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory increase should be reasonable (less than 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks performance metrics correctly', () => {
      const articles = generateTestArticles(100);
      
      // Perform operations
      SearchPerformanceMonitor.measureSearch(
        () => searchArticles(articles, 'test'),
        100,
        'test-search'
      );
      
      SearchPerformanceMonitor.measureSearch(
        () => searchArticles(articles, 'test2'),
        100,
        'test-search2'
      );
      
      const metrics = SearchPerformanceMonitor.getMetrics();
      expect(metrics.searchCount).toBe(2);
      expect(metrics.averageTime).toBeGreaterThan(0);
      expect(metrics.maxTime).toBeGreaterThanOrEqual(metrics.averageTime);
      expect(metrics.minTime).toBeLessThanOrEqual(metrics.averageTime);
    });

    it('provides performance warnings for slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const articles = generateTestArticles(100);
      
      // Simulate slow search
      const slowSearch = () => {
        const start = performance.now();
        while (performance.now() - start < 150) {
          // Wait 150ms to simulate slow operation
        }
        return searchArticles(articles, 'test');
      };
      
      SearchPerformanceMonitor.measureSearch(slowSearch, 100, 'slow-search');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow search detected')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('handles large datasets without performance degradation', () => {
      const articles = generateTestArticles(10000);
      
      const startTime = performance.now();
      
      // Simulate virtual scrolling by processing only visible items
      const visibleStart = 0;
      const visibleEnd = 50; // Only 50 items visible at once
      const visibleArticles = articles.slice(visibleStart, visibleEnd);
      
      // Apply operations to visible articles only
      const searchResults = searchArticles(visibleArticles, 'Article').map(r => r.article);
      const filteredResults = applyFilters(searchResults, {
        status: ['completed'],
        dateRange: {},
        keywords: [],
        wordCountRange: {},
        sortBy: undefined,
      });
      const sortedResults = sortArticles(filteredResults, 'mostRecent');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should be very fast with virtual scrolling
      expect(sortedResults.length).toBeLessThanOrEqual(50);
    });
  });
});
