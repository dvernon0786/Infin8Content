/**
 * TypeScript types for dashboard search and filtering
 * Story 15.4: Dashboard Search and Filtering
 */

import type { DashboardArticle } from '@/lib/supabase/realtime';

// Re-export DashboardArticle for convenience
export type { DashboardArticle };

// Article status types from database
export type ArticleStatus = 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled';

// Sort options for article ordering
export type SortOption = 'mostRecent' | 'oldest' | 'titleAZ' | 'titleZA';

// Filter state interface
export interface FilterState {
  status: ArticleStatus[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  keywords: string[];
  wordCountRange: {
    min?: number;
    max?: number;
  };
  sortBy?: SortOption;
}

// Search state interface
export interface SearchState {
  query: string;
  isSearching: boolean;
  lastSearchTime?: number;
}

// Combined dashboard filters state
export interface DashboardFiltersState {
  search: SearchState;
  filters: FilterState;
  isActive: boolean; // Whether any filters are active
}

// URL query parameters for filter synchronization
export interface FilterQueryParams {
  search?: string;
  status?: string; // Comma-separated status values
  sortBy?: SortOption;
  dateStart?: string; // ISO date string
  dateEnd?: string; // ISO date string
  keywords?: string; // Comma-separated keywords
  wordCountMin?: string;
  wordCountMax?: string;
}

// Search result with highlighting
export interface SearchResult {
  article: DashboardArticle;
  highlightedTitle?: string;
  highlightedContent?: string;
  matchedFields: string[];
  score: number;
}

// Filter performance metrics
export interface FilterMetrics {
  totalArticles: number;
  filteredArticles: number;
  filterTime: number; // milliseconds
  searchTime: number; // milliseconds
  hasVirtualScrolling: boolean;
}

// Active filter badge data
export interface ActiveFilterBadge {
  id: string;
  type: 'status' | 'dateRange' | 'keyword' | 'wordCount' | 'search' | 'sort';
  label: string;
  value: string;
  removable: boolean;
}

// Search input component props
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  debounceMs?: number;
}

// Filter dropdown component props
export interface FilterDropdownProps {
  value: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  availableStatuses: ArticleStatus[];
  disabled?: boolean;
  className?: string;
}

// Sort dropdown component props
export interface SortDropdownProps {
  value?: SortOption;
  onChange: (sortBy: SortOption) => void;
  disabled?: boolean;
  className?: string;
}

// Active filters component props
export interface ActiveFiltersProps {
  filters: FilterState;
  search: SearchState;
  onClearFilter: (filterId: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
  className?: string;
}

// Virtualized list component props
export interface VirtualizedArticleListProps {
  articles: DashboardArticle[];
  itemHeight: number;
  height: number;
  overscanCount?: number;
  className?: string;
}

// Dashboard filters hook return type
export interface UseDashboardFiltersReturn {
  // State
  search: SearchState;
  filters: FilterState;
  filteredArticles: DashboardArticle[];
  activeFilters: ActiveFilterBadge[];
  metrics: FilterMetrics;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearSearch: () => void;
  clearFilters: () => void;
  clearAll: () => void;
  removeFilter: (filterId: string) => void;
  
  // URL synchronization
  syncToUrl: () => void;
  syncFromUrl: () => void;
  
  // Utilities
  hasActiveFilters: boolean;
  isFilterActive: (filterType: keyof FilterState) => boolean;
}

// Utility function types
export type SearchFunction = (articles: DashboardArticle[], query: string) => SearchResult[];
export type FilterFunction = (articles: DashboardArticle[], filters: FilterState) => DashboardArticle[];
export type SortFunction = (articles: DashboardArticle[], sortBy: SortOption) => DashboardArticle[];

// Configuration constants
export const DASHBOARD_FILTER_CONFIG = {
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_DEBOUNCE_MS_MOBILE: 500,
  VIRTUAL_SCROLL_THRESHOLD: 50,
  MAX_FILTERED_ARTICLES: 1000,
  PERFORMANCE_TARGET_MS: 100,
} as const;

// Default filter state
export const DEFAULT_FILTER_STATE: FilterState = {
  status: [],
  dateRange: {},
  keywords: [],
  wordCountRange: {},
  sortBy: undefined,
};

// Default search state
export const DEFAULT_SEARCH_STATE: SearchState = {
  query: '',
  isSearching: false,
};
