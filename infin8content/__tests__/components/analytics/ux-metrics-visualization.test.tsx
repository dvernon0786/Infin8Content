/**
 * UX Metrics Visualization Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.2: Implement UX metrics visualization components
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UXMetricsVisualization } from '@/components/analytics/ux-metrics-visualization'

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
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />
}))

describe('UXMetricsVisualization', () => {
  const mockUXMetrics = {
    completion_rate: { value: 92.5, target: 90.0, trend: 'up' as const },
    collaboration_adoption: { value: 78.3, target: 85.0, trend: 'stable' as const },
    trust_score: { value: 4.2, target: 4.5, trend: 'up' as const },
    perceived_value: { value: 8.7, target: 8.0, trend: 'up' as const }
  }

  const mockHistoricalData = [
    { week: '2024-W01', completion_rate: 88.2, collaboration_adoption: 75.1, trust_score: 4.0, perceived_value: 8.2 },
    { week: '2024-W02', completion_rate: 90.1, collaboration_adoption: 76.8, trust_score: 4.1, perceived_value: 8.4 },
    { week: '2024-W03', completion_rate: 92.5, collaboration_adoption: 78.3, trust_score: 4.2, perceived_value: 8.7 }
  ]

  it('renders UX metrics visualization with charts', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('UX Metrics Visualization')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('displays current metrics with trend indicators', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('92.5%')).toBeInTheDocument()
    expect(screen.getByText('78.3%')).toBeInTheDocument()
    expect(screen.getByText('4.2/5')).toBeInTheDocument()
    expect(screen.getByText('8.7/10')).toBeInTheDocument()
  })

  it('shows trend indicators for each metric', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    const trendIndicators = screen.getAllByTestId(/trend-indicator/)
    expect(trendIndicators.length).toBeGreaterThan(0)
  })

  it('displays target comparisons', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Target: 90.0%')).toBeInTheDocument()
    expect(screen.getByText('Target: 85.0%')).toBeInTheDocument()
    expect(screen.getByText('Target: 4.5/5')).toBeInTheDocument()
    expect(screen.getByText('Target: 8.0/10')).toBeInTheDocument()
  })

  it('renders historical trend chart', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Historical Trends')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
  })

  it('renders metric comparison bar chart', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Current vs Target')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders metric distribution pie chart', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Metric Distribution')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('handles empty historical data gracefully', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={[]}
      />
    )

    expect(screen.getByText('No historical data available')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
        loading={true}
      />
    )

    expect(screen.getByText('Loading UX metrics...')).toBeInTheDocument()
    expect(screen.getByTestId('ux-metrics-loading-skeleton')).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
        error="Failed to load data"
      />
    )

    expect(screen.getByText('Failed to load UX metrics')).toBeInTheDocument()
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('allows metric selection', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    const metricSelect = screen.getByRole('combobox')
    expect(metricSelect).toBeInTheDocument()
    
    metricSelect.click()
    expect(screen.getByText('Completion Rate')).toBeInTheDocument()
    expect(screen.getByText('Collaboration Adoption')).toBeInTheDocument()
    expect(screen.getByText('Trust Score')).toBeInTheDocument()
    expect(screen.getByText('Perceived Value')).toBeInTheDocument()
  })

  it('displays metric insights', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    expect(screen.getByText('Key Insights')).toBeInTheDocument()
    expect(screen.getByText(/completion rate.*above target/i)).toBeInTheDocument()
  })

  it('supports time range selection', () => {
    render(
      <UXMetricsVisualization 
        currentMetrics={mockUXMetrics} 
        historicalData={mockHistoricalData}
      />
    )

    const timeRangeSelect = screen.getByLabelText('Time range')
    expect(timeRangeSelect).toBeInTheDocument()
  })
})
