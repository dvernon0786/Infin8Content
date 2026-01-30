/**
 * Tests for article queue status navigation integration
 * Story 15.3: Navigation and Access to Completed Articles - Task 4
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import type { ArticleProgressStatus } from '@/types/article'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the real-time hook
vi.mock('@/hooks/use-realtime-articles', () => ({
  useRealtimeArticles: vi.fn(),
}))

// Import the mocked hook
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'

describe('Article Queue Status Navigation Integration', () => {
  const mockPush = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    })
  })

  const mockCompletedArticle = {
    id: 'test-article-1',
    title: 'Test Completed Article',
    keyword: 'test keyword',
    status: 'completed' as const,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T12:00:00Z',
  }

  const mockGeneratingArticle = {
    id: 'test-article-2',
    title: 'Test Generating Article',
    keyword: 'test keyword',
    status: 'generating' as const,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T11:30:00Z',
    progress: {
      progress_percentage: 60,
      current_stage: 'writing content',
      current_section: 3,
      total_sections: 5,
      word_count: 900,
      error_message: null,
      estimated_time_remaining: 300,
      actual_time_spent: 600,
      citations_count: 6,
      api_cost: 0.0150,
      id: 'progress-2',
      article_id: 'test-article-2',
      org_id: 'test-org',
      status: 'generating' as ArticleProgressStatus,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T11:30:00Z',
      metadata: {},
    },
  }

  it('should navigate to article when View button is clicked for completed articles', async () => {
    vi.mocked(useRealtimeArticles).mockReturnValue({
      articles: [mockCompletedArticle],
      isConnected: true,
      connectionStatus: 'connected',
      isPollingMode: false,
      error: null,
      lastUpdated: '2024-01-10T12:00:00Z',
      refresh: vi.fn(),
      reconnect: vi.fn(),
    })

    render(<ArticleQueueStatus organizationId="test-org" showCompleted={true} />)

    // Find the View button for completed article
    const viewButton = screen.getByTitle('View completed article')
    expect(viewButton).toBeInTheDocument()
    
    // Click the View button
    fireEvent.click(viewButton)
    
    // Should navigate to the article page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
    })
  })

  it('should not show View button for non-completed articles', () => {
    vi.mocked(useRealtimeArticles).mockReturnValue({
      articles: [mockGeneratingArticle],
      isConnected: true,
      connectionStatus: 'connected',
      isPollingMode: false,
      error: null,
      lastUpdated: '2024-01-10T12:00:00Z',
      refresh: vi.fn(),
      reconnect: vi.fn(),
    })

    render(<ArticleQueueStatus organizationId="test-org" />)

    // Should not have View button for generating articles
    expect(screen.queryByTitle('View completed article')).not.toBeInTheDocument()
  })

  it('should show consistent styling with main dashboard', () => {
    vi.mocked(useRealtimeArticles).mockReturnValue({
      articles: [mockCompletedArticle],
      isConnected: true,
      connectionStatus: 'connected',
      isPollingMode: false,
      error: null,
      lastUpdated: '2024-01-10T12:00:00Z',
      refresh: vi.fn(),
      reconnect: vi.fn(),
    })

    render(<ArticleQueueStatus organizationId="test-org" showCompleted={true} />)

    // Check that the View button has consistent styling
    const viewButton = screen.getByTitle('View completed article')
    expect(viewButton).toHaveClass('h-6', 'w-6', 'p-0')
  })

  it('should handle navigation errors gracefully', async () => {
    vi.mocked(useRealtimeArticles).mockReturnValue({
      articles: [mockCompletedArticle],
      isConnected: true,
      connectionStatus: 'connected',
      isPollingMode: false,
      error: null,
      lastUpdated: '2024-01-10T12:00:00Z',
      refresh: vi.fn(),
      reconnect: vi.fn(),
    })

    // Mock router to throw an error
    const errorPush = vi.fn(() => {
      throw new Error('Navigation failed')
    })
    ;(useRouter as any).mockReturnValue({
      push: errorPush,
    })

    render(<ArticleQueueStatus organizationId="test-org" showCompleted={true} />)

    const viewButton = screen.getByTitle('View completed article')
    
    // Click should be called, but error should be handled by component
    fireEvent.click(viewButton)
    
    // Verify that push was attempted
    await waitFor(() => {
      expect(errorPush).toHaveBeenCalled()
    })
  })
})
