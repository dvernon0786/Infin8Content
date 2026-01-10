/**
 * Integration tests for real-time dashboard functionality
 * Story 15.1: Real-time Article Status Display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArticleStatusList } from '@/components/dashboard/article-status-list';
import { useRealtimeArticles } from '@/hooks/use-realtime-articles';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => {
    const channelMock = {
      on: vi.fn(function(this: any) {
        // Support chaining .on() calls
        return this;
      }),
      subscribe: vi.fn(() => Promise.resolve('SUBSCRIBED'))
    };
    return {
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn()
    };
  })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockFetch = global.fetch as vi.MockedFunction<typeof fetch>;

describe('Real-time Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    
    // Set up default fetch mock for all tests
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [],
        lastUpdated: '2024-01-10T10:05:00Z',
        hasMore: false
      })
    });
  });

  it('renders dashboard with empty state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [],
        lastUpdated: '2024-01-10T10:05:00Z',
        hasMore: false
      })
    });

    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Article Status')).toBeInTheDocument();
      expect(screen.getByText('No articles found')).toBeInTheDocument();
    });
  });

  it('displays articles with real-time updates', async () => {
    const mockArticles = [
      {
        id: '1',
        keyword: 'test-article',
        title: 'Test Article',
        status: 'generating',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:05:00Z',
        progress: {
          progress_percentage: 75.0,
          current_stage: 'Writing content',
          current_section: 3,
          total_sections: 4,
          word_count: 750
        }
      },
      {
        id: '2',
        keyword: 'completed-article',
        title: 'Completed Article',
        status: 'completed',
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-10T10:00:00Z'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: mockArticles,
        lastUpdated: '2024-01-10T10:05:00Z',
        hasMore: false
      })
    });

    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Completed Article')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('Writing content')).toBeInTheDocument();
    });
  });

  it('handles connection failures and polling fallback', async () => {
    // Mock initial connection failure
    mockFetch.mockRejectedValueOnce(new Error('Connection failed'));
    
    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Polling mode/)).toBeInTheDocument();
    });

    // Mock successful polling response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [{
          id: '1',
          keyword: 'polling-test',
          title: 'Polling Test',
          status: 'completed',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:05:00Z'
        }],
        lastUpdated: '2024-01-10T10:05:00Z',
        hasMore: false
      })
    });

    // Wait for polling to succeed
    await waitFor(() => {
      expect(screen.getByText('Polling Test')).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows connection status indicator', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [],
        lastUpdated: '2024-01-10T10:05:00Z',
        hasMore: false
      })
    });

    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('has refresh functionality', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [],
        lastUpdated: '2024-01-10T10:05:00Z',
        hasMore: false
      })
    });

    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });
    
    // Verify fetch was called again
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('displays error states properly', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));
    
    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
      expect(screen.getByText(/Using polling fallback/)).toBeInTheDocument();
    });
  });
});
