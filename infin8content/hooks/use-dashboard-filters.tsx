/**
 * Dashboard filters hook for state management
 * Story 15.4: Dashboard Search and Filtering
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchArticles, createDebouncedSearch } from '@/lib/utils/search-utils';
import { applyFilters, hasActiveFilters, filtersToQueryParams, queryParamsToFilters } from '@/lib/utils/filter-utils';
import { sortArticles } from '@/lib/utils/sort-utils';
import { generateActiveFilters } from '@/components/dashboard/active-filters';
import type { 
  DashboardFiltersState, 
  FilterState, 
  SearchState, 
  DashboardArticle, 
  UseDashboardFiltersReturn,
  ActiveFilterBadge,
  FilterMetrics,
  SortOption,
  ArticleStatus
} from '@/lib/types/dashboard.types';
import { 
  DEFAULT_FILTER_STATE, 
  DEFAULT_SEARCH_STATE, 
  DASHBOARD_FILTER_CONFIG 
} from '@/lib/types/dashboard.types';

export function useDashboardFilters(
  articles: DashboardArticle[]
): UseDashboardFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [search, setSearchState] = useState<SearchState>(DEFAULT_SEARCH_STATE);
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for debounced search and performance tracking
  const debouncedSearchRef = useRef(createDebouncedSearch(
    searchArticles,
    DASHBOARD_FILTER_CONFIG.SEARCH_DEBOUNCE_MS
  ));
  const performanceRef = useRef({
    searchTime: 0,
    filterTime: 0,
    lastUpdate: 0,
  });

  // Initialize from URL params on mount
  useEffect(() => {
    if (!isInitialized && searchParams.size > 0) {
      const params = Object.fromEntries(searchParams.entries());
      const urlFilters = queryParamsToFilters(params);
      const urlSearch = params.search || '';
      
      setFiltersState({ ...DEFAULT_FILTER_STATE, ...urlFilters });
      setSearchState({ ...DEFAULT_SEARCH_STATE, query: urlSearch });
      setIsInitialized(true);
    } else if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // Sync state to URL
  const syncToUrl = useCallback(() => {
    const params = filtersToQueryParams(filters);
    if (search.query.trim()) {
      params.search = search.query.trim();
    }
    
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `?${queryString}` : '';
    
    router.replace(url, { scroll: false });
  }, [filters, search.query, router]);

  // Sync state from URL
  const syncFromUrl = useCallback(() => {
    const params = Object.fromEntries(searchParams.entries());
    const urlFilters = queryParamsToFilters(params);
    const urlSearch = params.search || '';
    
    setFiltersState(prev => ({ ...prev, ...urlFilters }));
    setSearchState(prev => ({ ...prev, query: urlSearch }));
  }, [searchParams]);

  // Auto-sync to URL when filters/search change
  useEffect(() => {
    if (isInitialized) {
      const timeoutId = setTimeout(syncToUrl, 300); // Debounce URL updates
      return () => clearTimeout(timeoutId);
    }
  }, [filters, search.query, syncToUrl, isInitialized]);

  // Search functionality
  const setSearchQuery = useCallback(async (query: string) => {
    setSearchState(prev => ({ ...prev, query, isSearching: true }));
    
    try {
      const startTime = performance.now();
      await debouncedSearchRef.current.search(articles, query);
      const endTime = performance.now();
      
      performanceRef.current.searchTime = endTime - startTime;
      setSearchState(prev => ({ 
        ...prev, 
        isSearching: false, 
        lastSearchTime: Date.now() 
      }));
    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({ ...prev, isSearching: false }));
    }
  }, [articles]);

  // Filter functionality
  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear functions
  const clearSearch = useCallback(() => {
    setSearchState(DEFAULT_SEARCH_STATE);
    debouncedSearchRef.current.clearCache();
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTER_STATE);
  }, []);

  const clearAll = useCallback(() => {
    clearSearch();
    clearFilters();
  }, [clearSearch, clearFilters]);

  // Remove specific filter
  const removeFilter = useCallback((filterId: string) => {
    const activeFilters = generateActiveFilters(filters, search);
    const filterToRemove = activeFilters.find((f: ActiveFilterBadge) => f.id === filterId);
    
    if (!filterToRemove) return;

    switch (filterToRemove.type) {
      case 'search':
        clearSearch();
        break;
      case 'status':
        setFiltersState(prev => ({ ...prev, status: [] }));
        break;
      case 'dateRange':
        setFiltersState(prev => ({ ...prev, dateRange: {} }));
        break;
      case 'keyword':
        setFiltersState(prev => ({ ...prev, keywords: [] }));
        break;
      case 'wordCount':
        setFiltersState(prev => ({ ...prev, wordCountRange: {} }));
        break;
      case 'sort':
        setFiltersState(prev => ({ ...prev, sortBy: undefined }));
        break;
    }
  }, [filters, search, clearSearch, setFiltersState]);

  // Apply search, filters, and sorting to articles
  const filteredArticles = useMemo(() => {
    const startTime = performance.now();
    let result = [...articles];

    // Apply search
    if (search.query.trim()) {
      const searchResults = searchArticles(result, search.query.trim());
      result = searchResults.map(sr => sr.article);
    }

    // Apply filters
    if (hasActiveFilters(filters)) {
      result = applyFilters(result, filters);
    }

    // Apply sorting
    if (filters.sortBy) {
      result = sortArticles(result, filters.sortBy);
    }

    const endTime = performance.now();
    performanceRef.current.filterTime = endTime - startTime;
    performanceRef.current.lastUpdate = Date.now();

    return result;
  }, [articles, search.query, filters]);

  // Generate active filter badges
  const activeFilters = useMemo(() => {
    return generateActiveFilters(filters, search);
  }, [filters, search]);

  // Calculate metrics
  const metrics = useMemo((): FilterMetrics => ({
    totalArticles: articles.length,
    filteredArticles: filteredArticles.length,
    filterTime: performanceRef.current.filterTime,
    searchTime: performanceRef.current.searchTime,
    hasVirtualScrolling: filteredArticles.length >= DASHBOARD_FILTER_CONFIG.VIRTUAL_SCROLL_THRESHOLD,
  }), [articles.length, filteredArticles.length]);

  // Utility functions
  const hasActiveFiltersValue = useMemo(() => {
    return hasActiveFilters(filters) || search.query.trim().length > 0;
  }, [filters, search.query]);

  const isFilterActive = useCallback((filterType: keyof FilterState): boolean => {
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
  }, [filters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, []);

  return {
    // State
    search,
    filters,
    filteredArticles,
    activeFilters,
    metrics,
    
    // Actions
    setSearchQuery,
    setFilters,
    clearSearch,
    clearFilters,
    clearAll,
    removeFilter,
    
    // URL synchronization
    syncToUrl,
    syncFromUrl,
    
    // Utilities
    hasActiveFilters: hasActiveFiltersValue,
    isFilterActive,
  };
}

/**
 * Hook for mobile-optimized filters
 */
export function useMobileFilters(articles: DashboardArticle[]) {
  const filters = useDashboardFilters(articles);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const openFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(true);
  }, []);

  const closeFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(prev => !prev);
  }, []);

  return {
    ...filters,
    isFilterPanelOpen,
    openFilterPanel,
    closeFilterPanel,
    toggleFilterPanel,
  };
}

/**
 * Hook for filter persistence
 */
export function usePersistentFilters(orgId: string) {
  const storageKey = `dashboard_filters_${orgId}`;
  
  const saveFilters = useCallback((filters: FilterState, search: SearchState) => {
    try {
      const data = {
        filters,
        search,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [storageKey]);

  const loadFilters = useCallback((): { filters: FilterState; search: SearchState } | null => {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Check if data is not too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return {
        filters: parsed.filters || DEFAULT_FILTER_STATE,
        search: parsed.search || DEFAULT_SEARCH_STATE,
      };
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
      return null;
    }
  }, [storageKey]);

  const clearPersistedFilters = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear filters from localStorage:', error);
    }
  }, [storageKey]);

  return {
    saveFilters,
    loadFilters,
    clearPersistedFilters,
  };
}

/**
 * Hook for filter analytics
 */
export function useFilterAnalytics(filters: FilterState, search: SearchState, metrics: FilterMetrics) {
  const [analytics, setAnalytics] = useState({
    totalSearches: 0,
    totalFilters: 0,
    averageFilterTime: 0,
    mostUsedFilters: {} as Record<string, number>,
    searchQueries: [] as string[],
  });

  // Track filter usage
  useEffect(() => {
    setAnalytics(prev => {
      const newAnalytics = { ...prev };
      
      // Track search queries
      if (search.query.trim() && !prev.searchQueries.includes(search.query.trim())) {
        newAnalytics.searchQueries = [...prev.searchQueries, search.query.trim()].slice(-10); // Keep last 10
      }
      
      // Track filter usage
      if (hasActiveFilters(filters)) {
        newAnalytics.totalFilters++;
        
        // Track specific filter types
        if (filters.status.length > 0) {
          newAnalytics.mostUsedFilters.status = (newAnalytics.mostUsedFilters.status || 0) + 1;
        }
        if (filters.keywords.length > 0) {
          newAnalytics.mostUsedFilters.keywords = (newAnalytics.mostUsedFilters.keywords || 0) + 1;
        }
        if (filters.dateRange.start || filters.dateRange.end) {
          newAnalytics.mostUsedFilters.dateRange = (newAnalytics.mostUsedFilters.dateRange || 0) + 1;
        }
        if (filters.wordCountRange.min !== undefined || filters.wordCountRange.max !== undefined) {
          newAnalytics.mostUsedFilters.wordCount = (newAnalytics.mostUsedFilters.wordCount || 0) + 1;
        }
      }
      
      // Update average filter time
      if (metrics.filterTime > 0) {
        const totalTime = prev.averageFilterTime * prev.totalFilters + metrics.filterTime;
        const count = prev.totalFilters + 1;
        newAnalytics.averageFilterTime = totalTime / count;
      }
      
      return newAnalytics;
    });
  }, [filters, search.query, metrics.filterTime]);

  return analytics;
}
