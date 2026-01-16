/**
 * Performance Metrics Display Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.3: Add technical performance metrics display
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PerformanceMetricsDisplay } from '@/components/analytics/performance-metrics-display'

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />
}))

describe('PerformanceMetricsDisplay', () => {
  const mockPerformanceMetrics = {
    dashboard_load_time: { value: 1.2, target: 2.0, trend: 'down' as const },
    article_creation_time: { value: 3.4, target: 5.0, trend: 'stable' as const },
    comment_latency: { value: 0.8, target: 1.0, trend: 'down' as const }
  }

  const mockHistoricalData = [
    { timestamp: '2024-01-15T10:00:00Z', dashboard_load_time: 1.5, article_creation_time: 3.8, comment_latency: 0.9 },
    { timestamp: '2024-01-15T11:00:00Z', dashboard_load_time: 1.3, article_creation_time: 3.6, comment_latency: 0.85 },
    { timestamp: '2024-01-15T12:00:00Z', dashboard_load_time: 1.2, article_creation_time: 3.4, comment_latency: 0.8 }
  ]

  it('renders performance metrics display with charts', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('displays current performance metrics with values', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('1.2s')).toBeInTheDocument() // dashboard_load_time
    expect(screen.getByText('3.4s')).toBeInTheDocument() // article_creation_time
    expect(screen.getByText('0.8s')).toBeInTheDocument() // comment_latency
  })

  it('shows performance targets', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Target: 2.0s')).toBeInTheDocument()
    expect(screen.getByText('Target: 5.0s')).toBeInTheDocument()
    expect(screen.getByText('Target: 1.0s')).toBeInTheDocument()
  })

  it('displays trend indicators for performance metrics', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    const trendIndicators = screen.getAllByTestId(/trend-indicator/)
    expect(trendIndicators.length).toBeGreaterThan(0)
  })

  it('renders performance timeline chart', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Performance Timeline')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders performance distribution area chart', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Performance Distribution')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renders performance comparison bar chart', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Performance Comparison')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows performance status indicators', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Optimal')).toBeInTheDocument() // Since metrics are better than targets
  })

  it('displays performance alerts for metrics above target', () => {
    const poorMetrics = {
      dashboard_load_time: { value: 3.0, target: 2.0, trend: 'up' as const },
      article_creation_time: { value: 6.0, target: 5.0, trend: 'up' as const },
      comment_latency: { value: 1.5, target: 1.0, trend: 'up' as const }
    }

    render(
      <PerformanceMetricsDisplay 
        currentMetrics={poorMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Needs Attention')).toBeInTheDocument()
    expect(screen.getByText(/Performance degradation detected/i)).toBeInTheDocument()
  })

  it('handles empty historical data gracefully', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={[]}
      />
    )

    expect(screen.getByText('No historical data available')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
        loading={true}
      />
    )

    expect(screen.getByText('Loading performance metrics...')).toBeInTheDocument()
    expect(screen.getByTestId('performance-loading-skeleton')).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
        error="Failed to load performance data"
      />
    )

    expect(screen.getByText('Failed to load performance metrics')).toBeInTheDocument()
    expect(screen.getByText('Failed to load performance data')).toBeInTheDocument()
  })

  it('displays performance score calculation', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Performance Score')).toBeInTheDocument()
    expect(screen.getByText(/\d+/)).toBeInTheDocument() // Score value
  })

  it('shows performance recommendations', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Recommendations')).toBeInTheDocument()
  })

  it('supports time range selection', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    const timeRangeSelect = screen.getByLabelText('Time range')
    expect(timeRangeSelect).toBeInTheDocument()
  })

  it('allows metric filtering', () => {
    render(
      <PerformanceMetricsDisplay 
        currentMetrics={mockPerformanceMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    const metricFilter = screen.getByRole('combobox', { name: /filter/i })
    expect(metricFilter).toBeInTheDocument()
  })
})
