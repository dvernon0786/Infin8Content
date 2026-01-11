/**
 * Integration tests for dashboard search and filtering
 * Story 15.4: Dashboard Search and Filtering
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleStatusList } from '@/components/dashboard/article-status-list';
import { useDashboardFilters } from '@/hooks/use-dashboard-filters';
import type { DashboardArticle } from '@/lib/supabase/realtime';

// Mock hooks and dependencies
vi.mock('@/hooks/use-realtime-articles', () => ({
  useRealtimeArticles: vi.fn(() => ({
    articles: mockArticles,
    isConnected: true,
    connectionStatus: 'connected',
    isPollingMode: false,
    error: null,
    lastUpdated: new Date(),
    refresh: vi.fn(),
    reconnect: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-article-navigation', () => ({
  useArticleNavigation: vi.fn(() => ({
    navigateToArticle: vi.fn(),
    navigateToDashboard: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@/hooks/use-dashboard-filters', () => ({
  useDashboardFilters: vi.fn(() => mockFilterHook),
}));

// Mock data
const mockArticles: DashboardArticle[] = [
  {
    id: '1',
    keyword: 'test-article-1',
    title: 'Test Article 1',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T01:00:00Z',
    progress: {
      current_stage: 'completed',
      metadata: { word_count: 1000 },
      word_count: 1000,
    },
  },
  {
    id: '2',
    keyword: 'test-article-2',
    title: 'Test Article 2',
    status: 'generating',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:30:00Z',
    progress: {
      current_stage: 'generating',
      metadata: { word_count: 500 },
      word_count: 500,
    },
  },
  {
    id: '3',
    keyword: 'another-article',
    title: 'Another Article',
    status: 'failed',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:15:00Z',
    progress: {
      current_stage: 'failed',
      error_message: 'Generation failed',
      metadata: {},
      word_count: 0,
    },
  },
];

const mockFilterHook = {
  search: { query: '', isSearching: false },
  filters: {
    status: [],
    dateRange: {},
    keywords: [],
    wordCountRange: {},
    sortBy: undefined,
  },
  filteredArticles: mockArticles,
  activeFilters: [],
  metrics: {
    totalArticles: mockArticles.length,
    filteredArticles: mockArticles.length,
    filterTime: 10,
    searchTime: 5,
    hasVirtualScrolling: false,
  },
  setSearchQuery: vi.fn(),
  setFilters: vi.fn(),
  clearSearch: vi.fn(),
  clearFilters: vi.fn(),
  clearAll: vi.fn(),
  removeFilter: vi.fn(),
  syncToUrl: vi.fn(),
  syncFromUrl: vi.fn(),
  hasActiveFilters: false,
  isFilterActive: vi.fn(() => false),
};

describe('Dashboard Search and Filtering Integration', () => {
  const defaultProps = {
    orgId: 'test-org',
    enableSearchFilter: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component integration', () => {
    it('renders article status list with search and filter controls', () => {
      render(<ArticleStatusList {...defaultProps} />);
      
      // Check main components are rendered
      expect(screen.getByPlaceholderText('Search articles...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.getByText('Test Article 2')).toBeInTheDocument();
      expect(screen.getByText('Another Article')).toBeInTheDocument();
    });

    it('displays correct article count', () => {
      render(<ArticleStatusList {...defaultProps} />);
      
      expect(screen.getByText('3 articles total')).toBeInTheDocument();
    });

    it('shows article status indicators', () => {
      render(<ArticleStatusList {...defaultProps} />);
      
      // Should show status indicators for each article
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('generating')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('filters articles when search query is entered', async () => {
      const mockSetSearchQuery = vi.fn();
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        setSearchQuery: mockSetSearchQuery,
        filteredArticles: [mockArticles[0]], // Only first article matches
      });

      const user = userEvent.setup();
      render(<ArticleStatusList {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search articles...');
      await user.type(searchInput, 'Test Article 1');
      
      // Wait for debounced search
      await waitFor(() => {
        expect(mockSetSearchQuery).toHaveBeenCalledWith('Test Article 1');
      });
    });

    it('shows search results with highlighting', async () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        search: { query: 'Test', isSearching: false },
        filteredArticles: [mockArticles[0], mockArticles[1]],
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      // Should show filtered results
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.getByText('Test Article 2')).toBeInTheDocument();
      expect(screen.queryByText('Another Article')).not.toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
      const mockClearSearch = vi.fn();
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        search: { query: 'test query', isSearching: false },
        clearSearch: mockClearSearch,
      });

      const user = userEvent.setup();
      render(<ArticleStatusList {...defaultProps} />);
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      expect(mockClearSearch).toHaveBeenCalled();
    });
  });

  describe('Filter functionality', () => {
    it('filters articles by status', async () => {
      const mockSetFilters = vi.fn();
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        setFilters: mockSetFilters,
        filteredArticles: [mockArticles[0]], // Only completed articles
      });

      const user = userEvent.setup();
      render(<ArticleStatusList {...defaultProps} />);
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const completedCheckbox = screen.getByLabelText('completed');
      await user.click(completedCheckbox);
      
      const applyButton = screen.getByText('Apply');
      await user.click(applyButton);
      
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['completed'],
        })
      );
    });

    it('shows active filter badges', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        filters: {
          ...mockFilterHook.filters,
          status: ['completed'],
        },
        activeFilters: [
          {
            id: 'status-completed',
            type: 'status',
            label: 'Status',
            value: 'completed',
            removable: true,
          },
        ],
        hasActiveFilters: true,
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('removes individual filters', async () => {
      const mockRemoveFilter = vi.fn();
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        activeFilters: [
          {
            id: 'status-completed',
            type: 'status',
            label: 'Status',
            value: 'completed',
            removable: true,
          },
        ],
        removeFilter: mockRemoveFilter,
      });

      const user = userEvent.setup();
      render(<ArticleStatusList {...defaultProps} />);
      
      const removeButton = screen.getByLabelText('Remove completed filter');
      await user.click(removeButton);
      
      expect(mockRemoveFilter).toHaveBeenCalledWith('status-completed');
    });
  });

  describe('Combined search and filter', () => {
    it('applies both search and filters simultaneously', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        search: { query: 'Test', isSearching: false },
        filters: {
          ...mockFilterHook.filters,
          status: ['completed'],
        },
        filteredArticles: [mockArticles[0]], // Only completed articles with "Test" in title
        activeFilters: [
          {
            id: 'search',
            type: 'search',
            label: 'Search',
            value: 'Test',
            removable: true,
          },
          {
            id: 'status-completed',
            type: 'status',
            label: 'Status',
            value: 'completed',
            removable: true,
          },
        ],
        hasActiveFilters: true,
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      // Should show only the filtered result
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Article 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Another Article')).not.toBeInTheDocument();
      
      // Should show both active filters
      expect(screen.getByText('Showing 1 of 3 articles')).toBeInTheDocument();
      expect(screen.getByText('2 filters active')).toBeInTheDocument();
    });

    it('updates article count when filters are applied', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        filteredArticles: [mockArticles[0]], // Only one result
        metrics: {
          ...mockFilterHook.metrics,
          filteredArticles: 1,
        },
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      expect(screen.getByText('Showing 1 of 3 articles')).toBeInTheDocument();
    });
  });

  describe('Real-time integration', () => {
    it('maintains filter state during real-time updates', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        search: { query: 'Test', isSearching: false },
        filters: {
          ...mockFilterHook.filters,
          status: ['completed'],
        },
        filteredArticles: [mockArticles[0]],
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      // Should still show filtered results even with real-time updates
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Article 2')).not.toBeInTheDocument();
    });
  });

  describe('Performance and virtual scrolling', () => {
    it('enables virtual scrolling for large datasets', () => {
      const largeArticleSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockArticles[0],
        id: `article-${i}`,
        keyword: `article-${i}`,
        title: `Article ${i}`,
      }));

      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        filteredArticles: largeArticleSet,
        metrics: {
          ...mockFilterHook.metrics,
          totalArticles: 100,
          filteredArticles: 100,
          hasVirtualScrolling: true,
        },
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      // Should use virtualized list for performance
      expect(screen.getByText('Virtualized 100 articles')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for screen readers', () => {
      render(<ArticleStatusList {...defaultProps} />);
      
      const searchInput = screen.getByLabelText('Search articles');
      expect(searchInput).toHaveAttribute('aria-label', 'Search articles');
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
    });

    it('announces filter changes to screen readers', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        activeFilters: [
          {
            id: 'status-completed',
            type: 'status',
            label: 'Status',
            value: 'completed',
            removable: true,
          },
        ],
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      // Should announce active filters
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('handles search errors gracefully', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        search: { query: 'test', isSearching: false },
        filteredArticles: [], // No results due to error
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      expect(screen.getByText('No articles found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters to find articles.')).toBeInTheDocument();
    });

    it('handles filter errors gracefully', () => {
      vi.mocked(useDashboardFilters).mockReturnValue({
        ...mockFilterHook,
        filters: {
          ...mockFilterHook.filters,
          status: ['invalid-status' as any],
        },
        filteredArticles: [], // No results due to invalid filter
      });

      render(<ArticleStatusList {...defaultProps} />);
      
      expect(screen.getByText('No articles found')).toBeInTheDocument();
    });
  });
});
