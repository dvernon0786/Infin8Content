/**
 * Integration Tests for Complete Navigation Flow
 * Story 15.3: Navigation and Access to Completed Articles
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import { ArticleStatusList } from '@/components/dashboard/article-status-list'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import { useArticleNavigation } from '@/hooks/use-article-navigation'
import { NavigationErrorBoundary } from '@/components/navigation/navigation-error-boundary'
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

describe('Complete Navigation Flow Integration', () => {
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

  const mockCompletedArticle: DashboardArticle = {
    id: 'test-article-1',
    title: 'Test Completed Article',
    keyword: 'test keyword',
    status: 'completed',
    progress: mockCompletedProgress,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T12:00:00Z',
  }

  describe('Dashboard to Article Navigation Flow', () => {
    it('should complete full navigation flow from dashboard to article', async () => {
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

      // Step 1: Find completed article title
      const articleTitle = screen.getByRole('button', { 
        name: /completed article: Test Completed Article, click to view/i 
      })
      expect(articleTitle).toBeInTheDocument()
      
      // Step 2: Click to navigate
      fireEvent.click(articleTitle)
      
      // Step 3: Verify navigation was called
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
      })
    })

    it('should handle keyboard navigation flow', async () => {
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

      const articleTitle = screen.getByRole('button', { 
        name: /completed article: Test Completed Article, click to view/i 
      })
      
      // Focus on the article title
      articleTitle.focus()
      expect(articleTitle).toHaveFocus()
      
      // Test Enter key
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

    it('should handle navigation errors gracefully', async () => {
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

      // Mock router to throw error
      ;(useRouter as any).mockReturnValue({
        push: vi.fn().mockRejectedValue(new Error('Navigation failed')),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
      })

      render(<ArticleStatusList orgId="test-org" />)

      const articleTitle = screen.getByRole('button', { 
        name: /completed article: Test Completed Article, click to view/i 
      })
      
      // Click to trigger navigation error
      fireEvent.click(articleTitle)
      
      // Should handle error without crashing
      await waitFor(() => {
        expect(articleTitle).toBeInTheDocument()
        // Focus should be restored to the element
        expect(articleTitle).toHaveFocus()
      })
    })
  })

  describe('Queue Status Navigation Flow', () => {
    it('should navigate from queue status view button', async () => {
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

      render(<ArticleQueueStatus organizationId="test-org" showCompleted={true} />)

      // Find the view button for completed article
      const viewButton = screen.getByRole('button', { 
        name: /View completed article: Test Completed Article/i 
      })
      expect(viewButton).toBeInTheDocument()
      
      // Click to navigate
      fireEvent.click(viewButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
      })
    })

    it('should support keyboard navigation in queue status', async () => {
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

      render(<ArticleQueueStatus organizationId="test-org" showCompleted={true} />)

      const viewButton = screen.getByRole('button', { 
        name: /View completed article: Test Completed Article/i 
      })
      
      // Focus on the view button
      viewButton.focus()
      expect(viewButton).toHaveFocus()
      
      // Test keyboard navigation
      fireEvent.keyDown(viewButton, { key: 'Enter' })
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
      })
    })
  })

  describe('Error Boundary Integration', () => {
    it('should catch and display navigation errors', async () => {
      const ThrowComponent = () => {
        throw new Error('Test navigation error')
      }

      render(
        <NavigationErrorBoundary>
          <ThrowComponent />
        </NavigationErrorBoundary>
      )

      // Should show error fallback
      expect(screen.getByText('Navigation Error')).toBeInTheDocument()
      expect(screen.getByText(/Something went wrong while navigating/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Back to Articles/i })).toBeInTheDocument()
    })

    it('should provide custom fallback when specified', async () => {
      const ThrowComponent = () => {
        throw new Error('Test navigation error')
      }

      const CustomFallback = () => (
        <div data-testid="custom-fallback">Custom Error Message</div>
      )

      render(
        <NavigationErrorBoundary fallback={<CustomFallback />}>
          <ThrowComponent />
        </NavigationErrorBoundary>
      )

      // Should show custom fallback
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Message')).toBeInTheDocument()
    })

    it('should call error handler when error occurs', async () => {
      const mockErrorHandler = vi.fn()
      const ThrowComponent = () => {
        throw new Error('Test navigation error')
      }

      render(
        <NavigationErrorBoundary onError={mockErrorHandler}>
          <ThrowComponent />
        </NavigationErrorBoundary>
      )

      // Should call error handler
      await waitFor(() => {
        expect(mockErrorHandler).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            componentStack: expect.any(String),
          })
        )
      })
    })
  })

  describe('Shared Navigation Hook Integration', () => {
    it('should provide consistent navigation behavior across components', async () => {
      const TestComponent = () => {
        const navigation = useArticleNavigation()
        
        return (
          <div>
            <button onClick={() => navigation.navigateToArticle('test-id')}>
              Navigate
            </button>
            <div data-testid="navigation-state">
              {navigation.isNavigating ? 'navigating' : 'idle'}
            </div>
          </div>
        )
      }

      render(<TestComponent />)

      const navigateButton = screen.getByText('Navigate')
      const stateDisplay = screen.getByTestId('navigation-state')
      
      // Initial state
      expect(stateDisplay).toHaveTextContent('idle')
      
      // Click to navigate
      fireEvent.click(navigateButton)
      
      // Should update navigation state
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-id')
      })
    })

    it('should handle focus restoration on navigation failure', async () => {
      const TestComponent = () => {
        const navigation = useArticleNavigation()
        const buttonRef = React.useRef<HTMLButtonElement>(null)
        
        React.useEffect(() => {
          if (buttonRef.current) {
            navigation.registerElement('test-id', buttonRef.current)
          }
        }, [navigation])
        
        return (
          <button 
            ref={buttonRef}
            onClick={() => navigation.navigateToArticle('test-id')}
          >
            Navigate
          </button>
        )
      }

      // Mock router to throw error
      ;(useRouter as any).mockReturnValue({
        push: vi.fn().mockRejectedValue(new Error('Navigation failed')),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
      })

      render(<TestComponent />)

      const navigateButton = screen.getByText('Navigate')
      
      // Focus the button
      navigateButton.focus()
      expect(navigateButton).toHaveFocus()
      
      // Click to trigger navigation error
      fireEvent.click(navigateButton)
      
      // Focus should be restored after error
      await waitFor(() => {
        expect(navigateButton).toHaveFocus()
      })
    })
  })

  describe('Mobile Responsiveness Integration', () => {
    it('should maintain navigation functionality on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

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

      const articleTitle = screen.getByRole('button', { 
        name: /completed article: Test Completed Article, click to view/i 
      })
      
      // Should still be clickable on mobile
      expect(articleTitle).toBeInTheDocument()
      
      fireEvent.click(articleTitle)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/articles/test-article-1')
      })
    })
  })
})
