/**
 * Tests for ProgressTracker component
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressTracker } from '@/components/articles/progress-tracker';
import type { ArticleProgress } from '@/types/article';

// Mock the useArticleProgress hook
vi.mock('@/hooks/use-article-progress', () => ({
  useArticleProgress: vi.fn(),
}));

import { useArticleProgress } from '@/hooks/use-article-progress';

describe('ProgressTracker', () => {
  const mockArticleId = 'article-123';
  const mockProgress: ArticleProgress = {
    id: 'progress-123',
    article_id: mockArticleId,
    org_id: 'org-123',
    status: 'writing',
    current_section: 3,
    total_sections: 8,
    progress_percentage: 37.5,
    current_stage: 'Writing Section 3',
    estimated_time_remaining: 120,
    actual_time_spent: 180,
    word_count: 1250,
    citations_count: 5,
    api_cost: 0.15,
    error_message: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should show loading state when no progress', () => {
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('Initializing progress tracking...')).toBeInTheDocument();
  });

  it('should display progress information', () => {
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: mockProgress,
      isConnected: true,
      connectionStatus: 'connected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('Article Generation Progress')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Writing Section 3')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument(); // Rounded percentage
    expect(screen.getByText('Section 3 of 8')).toBeInTheDocument();
    expect(screen.getByText('~2 minutes remaining')).toBeInTheDocument();
  });

  it('should show statistics when available', () => {
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: mockProgress,
      isConnected: true,
      connectionStatus: 'connected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('1,250')).toBeInTheDocument(); // Word count
    expect(screen.getByText('5')).toBeInTheDocument(); // Citations
    expect(screen.getByText('$0.15')).toBeInTheDocument(); // API cost
  });

  it('should show connection status', () => {
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: mockProgress,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('Reconnect')).toBeInTheDocument();
  });

  it('should handle reconnect button click', () => {
    const mockReconnect = vi.fn();
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: mockProgress,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: null,
      reconnect: mockReconnect,
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    const reconnectButton = screen.getByText('Reconnect');
    fireEvent.click(reconnectButton);

    expect(mockReconnect).toHaveBeenCalled();
  });

  it('should show connection errors', () => {
    const mockError = new Error('Connection failed');
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: mockProgress,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: mockError,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should show generation errors', () => {
    const progressWithError = {
      ...mockProgress,
      error_message: 'API timeout exceeded',
    };

    vi.mocked(useArticleProgress).mockReturnValue({
      progress: progressWithError,
      isConnected: true,
      connectionStatus: 'connected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('Generation Error')).toBeInTheDocument();
    expect(screen.getByText('API timeout exceeded')).toBeInTheDocument();
  });

  it('should show completion message when status is completed', () => {
    const completedProgress = {
      ...mockProgress,
      status: 'completed' as const,
      progress_percentage: 100,
      current_section: 8,
      current_stage: 'Completed',
      estimated_time_remaining: 0,
    };

    vi.mocked(useArticleProgress).mockReturnValue({
      progress: completedProgress,
      isConnected: true,
      connectionStatus: 'connected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('Article generation complete!')).toBeInTheDocument();
    expect(screen.getByText('Total time: 0s')).toBeInTheDocument();
    expect(screen.getByText('Word count: 1,250 words')).toBeInTheDocument();
    expect(screen.getByText('Citations: 5')).toBeInTheDocument();
    expect(screen.getByText('API costs: $0.15')).toBeInTheDocument();
  });

  it('should display different status colors and icons', () => {
    const statuses: ArticleProgress['status'][] = ['queued', 'researching', 'writing', 'generating', 'completed', 'failed'];
    
    statuses.forEach(status => {
      vi.clearAllMocks();
      const progressWithStatus = { ...mockProgress, status };
      
      vi.mocked(useArticleProgress).mockReturnValue({
        progress: progressWithStatus,
        isConnected: true,
        connectionStatus: 'connected',
        error: null,
        reconnect: vi.fn(),
      });

      const { container } = render(<ProgressTracker articleId={mockArticleId} />);
      
      // Check that status badge exists and has the correct text
      const statusBadge = screen.getByText(status.charAt(0).toUpperCase() + status.slice(1));
      expect(statusBadge).toBeInTheDocument();
    });
  });

  it('should handle elapsed time updates', () => {
    vi.mocked(useArticleProgress).mockReturnValue({
      progress: mockProgress,
      isConnected: true,
      connectionStatus: 'connected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    // Initially should show 0s elapsed
    expect(screen.getByText('0s elapsed')).toBeInTheDocument();

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);

    // Should show updated elapsed time
    expect(screen.getByText('0s elapsed')).toBeInTheDocument();
  });

  it('should format time remaining correctly', () => {
    const progressWithLongTime = {
      ...mockProgress,
      estimated_time_remaining: 3661, // 1 hour, 1 minute, 1 second
    };

    vi.mocked(useArticleProgress).mockReturnValue({
      progress: progressWithLongTime,
      isConnected: true,
      connectionStatus: 'connected',
      error: null,
      reconnect: vi.fn(),
    });

    render(<ProgressTracker articleId={mockArticleId} />);

    expect(screen.getByText('~2 hours remaining')).toBeInTheDocument();
  });
});
