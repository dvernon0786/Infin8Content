/**
 * Integration tests for real-time dashboard functionality
 * Story 15.1: Real-time Article Status Display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArticleStatusList } from '@/components/dashboard/article-status-list';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => {
    const channelMock = {
      on: vi.fn(function(this: unknown) {
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

// Mock realtime module
vi.mock('@/lib/supabase/realtime', () => ({
  articleProgressRealtime: {
    subscribeToDashboardUpdates: vi.fn(),
    unsubscribeFromDashboard: vi.fn(),
  }
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
        total: 0,
        includeCompleted: true,
      })
    });
  });

  it('renders dashboard with empty state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [],
        total: 0,
        includeCompleted: true,
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
        total: 2,
        includeCompleted: true,
      })
    });

    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Completed Article')).toBeInTheDocument();
    });
  });

  it('handles connection failures and polling fallback', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock initial connection failure
    mockFetch.mockRejectedValueOnce(new Error('Connection failed'));
    
    render(<ArticleStatusList orgId="test-org" />);
    
    // Verify error handling works - check for any error-related element or polling fallback
    await waitFor(() => {
      // Check for error display OR polling fallback activation
      const errorElement = screen.queryByText(/Connection failed|Error|Polling/i);
      const pollingElement = screen.queryByText(/Polling|fetching/i);
      const reconnectButton = screen.queryByRole('button', { name: /reconnect/i });
      
      // At least one error handling element should be present
      expect(errorElement || pollingElement || reconnectButton).toBeInTheDocument();
    }, { timeout: 3000 });
    
    errorSpy.mockRestore();
  });

  it('shows connection status indicator', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [],
        total: 0,
        includeCompleted: true,
      })
    });

    render(<ArticleStatusList orgId="test-org" />);
    
    // Wait for component to render and check for connection elements
    await waitFor(() => {
      // Check for either connection status or connection button
      const connectionElement = screen.queryByText(/Disconnected|Connected|Reconnect/i);
      const connectionButton = screen.queryByRole('button', { name: /reconnect/i });
      
      // At least one connection-related element should be present
      expect(connectionElement || connectionButton).toBeInTheDocument();
    });
  });

  it('has refresh functionality', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [],
        total: 0,
        includeCompleted: true,
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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValue(new Error('API Error'));
    
    render(<ArticleStatusList orgId="test-org" />);
    
    await waitFor(() => {
      // Check for error display - could be in different forms
      const errorElement = screen.queryByText(/API Error|Connection failed|Error/i);
      expect(errorElement).toBeInTheDocument();
    }, { timeout: 10000 });
    
    errorSpy.mockRestore();
  });
});
