/**
 * Article Queue Status Component Tests
 * Story 4a-1: Article Generation Initiation and Queue Setup
 * 
 * Tests queue status display, polling, and cancel functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'

// Mock fetch
global.fetch = vi.fn()

describe('ArticleQueueStatus', () => {
  const mockOrganizationId = 'org-123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should show loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    )

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    expect(screen.getByText(/loading queue status/i)).toBeInTheDocument()
  })

  it('should display generating article', async () => {
    const mockArticles = [
      {
        id: 'article-1',
        keyword: 'test keyword',
        status: 'generating',
        created_at: '2026-01-15T10:00:00Z',
      },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: mockArticles }),
    } as Response)

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(screen.getByText(/test keyword/i)).toBeInTheDocument()
      expect(screen.getByText(/currently generating/i)).toBeInTheDocument()
      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })
  })

  it('should display queued articles with correct positions', async () => {
    const mockArticles = [
      {
        id: 'article-1',
        keyword: 'keyword 1',
        status: 'queued',
        created_at: '2026-01-15T10:00:00Z',
      },
      {
        id: 'article-2',
        keyword: 'keyword 2',
        status: 'queued',
        created_at: '2026-01-15T10:01:00Z',
      },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: mockArticles }),
    } as Response)

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(screen.getByText(/keyword 1/i)).toBeInTheDocument()
      expect(screen.getByText(/keyword 2/i)).toBeInTheDocument()
      expect(screen.getByText(/position 1 in queue/i)).toBeInTheDocument()
      expect(screen.getByText(/position 2 in queue/i)).toBeInTheDocument()
    })
  })

  it('should display both generating and queued articles', async () => {
    const mockArticles = [
      {
        id: 'article-1',
        keyword: 'generating keyword',
        status: 'generating',
        created_at: '2026-01-15T10:00:00Z',
      },
      {
        id: 'article-2',
        keyword: 'queued keyword',
        status: 'queued',
        created_at: '2026-01-15T10:01:00Z',
      },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: mockArticles }),
    } as Response)

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(screen.getByText(/generating keyword/i)).toBeInTheDocument()
      expect(screen.getByText(/queued keyword/i)).toBeInTheDocument()
      expect(screen.getByText(/position 1 in queue/i)).toBeInTheDocument()
    })
  })

  it('should poll queue status every 5 seconds', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ articles: [] }),
    } as Response)

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    // Advance timer by 5 seconds
    vi.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    // Advance timer by another 5 seconds
    vi.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3)
    })
  })

  it('should handle cancel action', async () => {
    const user = userEvent.setup({ delay: null })
    const mockArticles = [
      {
        id: 'article-1',
        keyword: 'test keyword',
        status: 'queued',
        created_at: '2026-01-15T10:00:00Z',
      },
    ]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: mockArticles }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [] }),
      } as Response)

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(screen.getByText(/test keyword/i)).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: '' }) // Icon button
    await user.click(cancelButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/articles/article-1/cancel',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load queue status/i)).toBeInTheDocument()
    })
  })

  it('should not display when no articles in queue', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: [] }),
    } as Response)

    const { container } = render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      // Component returns null when no articles
      expect(container.firstChild).toBeNull()
    })
  })

  it('should cleanup polling interval on unmount', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ articles: [] }),
    } as Response)

    const { unmount } = render(<ArticleQueueStatus organizationId={mockOrganizationId} />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    unmount()

    // Advance timer - should not trigger another fetch
    vi.advanceTimersByTime(5000)

    // Fetch count should still be 1 (no new calls after unmount)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

