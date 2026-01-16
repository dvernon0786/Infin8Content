/**
 * Analytics Dashboard Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.1: Design dashboard layout with metric cards
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED')
        return Promise.resolve()
      })
    })),
    removeChannel: vi.fn()
  }))
}))

// Mock fetch API
global.fetch = vi.fn()

describe('AnalyticsDashboard', () => {
  const mockOrgId = 'test-org-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful fetch response
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        uxMetrics: {
          completion_rate: { value: 92.5, target: 90.0, trend: 'up' },
          collaboration_adoption: { value: 78.3, target: 85.0, trend: 'stable' },
          trust_score: { value: 4.2, target: 4.5, trend: 'up' },
          perceived_value: { value: 8.7, target: 8.0, trend: 'up' }
        },
        performanceMetrics: {
          dashboard_load_time: { value: 1.2, target: 2.0, trend: 'down' },
          article_creation_time: { value: 3.4, target: 5.0, trend: 'stable' },
          comment_latency: { value: 0.8, target: 1.0, trend: 'down' }
        },
        insights: [
          { type: 'positive', message: 'User engagement has increased by 15%' },
          { type: 'warning', message: 'Collaboration adoption is below target' }
        ],
        recommendations: [
          { priority: 'high', action: 'Increase collaboration features visibility' },
          { priority: 'medium', action: 'Optimize dashboard loading further' }
        ],
        lastUpdated: '2024-01-15T10:30:00Z'
      })
    } as Response)
  })

  it('renders analytics dashboard with metric cards', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    })

    // Check for metric cards
    expect(screen.getByText('User Experience')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Insights')).toBeInTheDocument()
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
  })

  it('displays UX metrics correctly', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByText('92.5%')).toBeInTheDocument() // completion_rate
      expect(screen.getByText('78.3%')).toBeInTheDocument() // collaboration_adoption
      expect(screen.getByText('4.2/5')).toBeInTheDocument() // trust_score
      expect(screen.getByText('8.7/10')).toBeInTheDocument() // perceived_value
    })
  })

  it('displays performance metrics correctly', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByText('1.2s')).toBeInTheDocument() // dashboard_load_time
      expect(screen.getByText('3.4s')).toBeInTheDocument() // article_creation_time
      expect(screen.getByText('0.8s')).toBeInTheDocument() // comment_latency
    })
  })

  it('shows insights and recommendations', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByText('User engagement has increased by 15%')).toBeInTheDocument()
      expect(screen.getByText('Collaboration adoption is below target')).toBeInTheDocument()
      expect(screen.getByText('Increase collaboration features visibility')).toBeInTheDocument()
      expect(screen.getByText('Optimize dashboard loading further')).toBeInTheDocument()
    })
  })

  it('handles loading state correctly', () => {
    // Mock fetch to delay response
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))

    render(<AnalyticsDashboard orgId={mockOrgId} />)

    expect(screen.getByText('Loading analytics data...')).toBeInTheDocument()
    expect(screen.getByTestId('analytics-loading-skeleton')).toBeInTheDocument()
  })

  it('handles error state correctly', async () => {
    // Mock fetch to return error
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500
    } as Response)

    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('allows manual refresh', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    refreshButton.click()

    // Verify fetch was called again
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('supports time range selection', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const timeRangeSelect = screen.getByRole('combobox')
    timeRangeSelect.click()

    // Check for time range options
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument()
    expect(screen.getByText('Last 3 Months')).toBeInTheDocument()
  })

  it('shows real-time connection status', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  it('displays trend indicators', async () => {
    render(<AnalyticsDashboard orgId={mockOrgId} />)

    await waitFor(() => {
      // Check for trend indicators (up/down/stable)
      const trendIndicators = screen.getAllByTestId(/trend-indicator/)
      expect(trendIndicators.length).toBeGreaterThan(0)
    })
  })
})
