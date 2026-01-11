/**
 * Tests for Article Navigation functionality
 * Story 15.3: Navigation and Access to Completed Articles
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import { ArticleStatusList } from '@/components/dashboard/article-status-list'
import { DashboardArticle } from '@/lib/supabase/realtime'
import type { ArticleProgress } from '@/types/article'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the real-time hook
vi.mock('@/hooks/use-realtime-articles', () => ({
  useRealtimeArticles: vi.fn(),
}))

// Mock error boundary
vi.mock('@/components/dashboard/error-boundary', () => ({
  DashboardErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  useErrorHandler: vi.fn(() => ({
    handleError: vi.fn(),
    createFallback: vi.fn(),
  })),
}))

describe('Article Navigation', () => {
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

  const mockCompletedProgress: ArticleProgress = {
    id: 'progress-1',
    article_id: 'test-article-1',
    org_id: 'test-org',
    status: 'completed',
    current_section: 5,
    total_sections: 5,
    progress_percentage: 100,
    current_stage: 'completed',
    estimated_time_remaining: null,
    actual_time_spent: 1200,
    word_count: 1500,
    citations_count: 10,
    api_cost: 0.0250,
    error_message: null,
    metadata: {},
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T12:00:00Z',
  }

  const mockGeneratingProgress: ArticleProgress = {
    ...mockCompletedProgress,
    id: 'progress-2',
    article_id: 'test-article-2',
    status: 'generating',
    current_section: 3,
    total_sections: 5,
    progress_percentage: 60,
    current_stage: 'writing content',
    estimated_time_remaining: 300,
    actual_time_spent: 600,
    word_count: 900,
    citations_count: 6,
    api_cost: 0.0150,
  }

  const mockCompletedArticle: DashboardArticle = {
    id: 'test-article-1',
    title: 'Test Completed Article',
    keyword: 'test keyword',
    status: 'completed',
    progress: mockCompletedProgress,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T12:00:00Z',
  }

  const mockGeneratingArticle: DashboardArticle = {
    id: 'test-article-2',
    title: 'Test Generating Article',
    keyword: 'test keyword',
    status: 'generating',
    progress: mockGeneratingProgress,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T11:30:00Z',
  }

  it('should make completed article titles clickable', async () => {
    const { useRealtimeArticles } = await import('@/hooks/use-realtime-articles')
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

    render(<ArticleStatusList orgId="test-org" />)

    // Target the h3 element with button role using the aria-label
    const articleTitle = screen.getByRole('button', { name: /completed article: Test Completed Article, click to view/i })
    expect(articleTitle).toBeInTheDocument()
    
    // Check if the article title is clickable (has appropriate cursor and role)
    expect(articleTitle).toHaveClass('cursor-pointer')
    
    // Click on the article title
    fireEvent.click(articleTitle)
    
    // Should navigate to the article page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
    })
  })

  it('should not make non-completed article titles clickable', async () => {
    const { useRealtimeArticles } = await import('@/hooks/use-realtime-articles')
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

    render(<ArticleStatusList orgId="test-org" />)

    // Target the h3 element (non-completed articles don't have button role)
    const articleTitle = screen.getByRole('heading', { name: 'Test Generating Article' })
    expect(articleTitle).toBeInTheDocument()
    
    // Should not have cursor-pointer class for non-completed articles
    expect(articleTitle).not.toHaveClass('cursor-pointer')
    
    // Click should not navigate
    fireEvent.click(articleTitle)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show tooltip on hover for completed articles', async () => {
    const { useRealtimeArticles } = await import('@/hooks/use-realtime-articles')
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

    render(<ArticleStatusList orgId="test-org" />)

    // Target the h3 element with button role using the aria-label
    const articleTitle = screen.getByRole('button', { name: /completed article: Test Completed Article, click to view/i })
    
    // Check for tooltip attribute
    expect(articleTitle).toHaveAttribute('title', 'Click to view completed article')
  })

  it('should support keyboard navigation for completed articles', async () => {
    const { useRealtimeArticles } = await import('@/hooks/use-realtime-articles')
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

    render(<ArticleStatusList orgId="test-org" />)

    // Target the h3 element with button role using the aria-label
    const articleTitle = screen.getByRole('button', { name: /completed article: Test Completed Article, click to view/i })
    
    // Should be focusable
    expect(articleTitle).toHaveAttribute('tabIndex', '0')
    
    // Focus on the article title
    articleTitle.focus()
    expect(articleTitle).toHaveFocus()
    
    // Press Enter key
    fireEvent.keyDown(articleTitle, { key: 'Enter' })
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
    })
    
    // Reset and test Space key
    mockPush.mockClear()
    
    fireEvent.keyDown(articleTitle, { key: ' ' })
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
    })
  })

  it('should have proper accessibility attributes', async () => {
    const { useRealtimeArticles } = await import('@/hooks/use-realtime-articles')
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

    render(<ArticleStatusList orgId="test-org" />)

    // Target the h3 element with button role using the aria-label
    const articleTitle = screen.getByRole('button', { name: /completed article: Test Completed Article, click to view/i })
    
    // Should have button role for accessibility
    expect(articleTitle).toHaveAttribute('role', 'button')
    
    // Should have appropriate aria-label
    expect(articleTitle).toHaveAttribute('aria-label', 'completed article: Test Completed Article, click to view')
  })
})
