/**
 * Trend Analysis Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 3.1: Implement trend analysis algorithms
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TrendAnalysis } from '@/components/analytics/trend-analysis'

// Mock the trend analysis API
global.fetch = vi.fn()

describe('TrendAnalysis', () => {
  const mockTrendData = {
    uxMetrics: {
      completion_rate: [
        { week: '2024-W1', value: 85.2, target: 90.0 },
        { week: '2024-W2', value: 88.7, target: 90.0 },
        { week: '2024-W3', value: 92.5, target: 90.0 },
        { week: '2024-W4', value: 91.8, target: 90.0 }
      ],
      collaboration_adoption: [
        { week: '2024-W1', value: 72.1, target: 85.0 },
        { week: '2024-W2', value: 74.8, target: 85.0 },
        { week: '2024-W3', value: 78.3, target: 85.0 },
        { week: '2024-W4', value: 80.1, target: 85.0 }
      ],
      trust_score: [
        { week: '2024-W1', value: 3.8, target: 4.5 },
        { week: '2024-W2', value: 4.0, target: 4.5 },
        { week: '2024-W3', value: 4.2, target: 4.5 },
        { week: '2024-W4', value: 4.3, target: 4.5 }
      ],
      perceived_value: [
        { week: '2024-W1', value: 8.2, target: 8.0 },
        { week: '2024-W2', value: 8.4, target: 8.0 },
        { week: '2024-W3', value: 8.7, target: 8.0 },
        { week: '2024-W4', value: 8.6, target: 8.0 }
      ]
    },
    performanceMetrics: {
      dashboard_load_time: [
        { week: '2024-W1', value: 2.1, target: 2.0 },
        { week: '2024-W2', value: 1.8, target: 2.0 },
        { week: '2024-W3', value: 1.2, target: 2.0 },
        { week: '2024-W4', value: 1.3, target: 2.0 }
      ],
      article_creation_time: [
        { week: '2024-W1', value: 4.2, target: 5.0 },
        { week: '2024-W2', value: 3.9, target: 5.0 },
        { week: '2024-W3', value: 3.4, target: 5.0 },
        { week: '2024-W4', value: 3.6, target: 5.0 }
      ],
      comment_latency: [
        { week: '2024-W1', value: 1.2, target: 1.0 },
        { week: '2024-W2', value: 1.0, target: 1.0 },
        { week: '2024-W3', value: 0.8, target: 1.0 },
        { week: '2024-W4', value: 0.9, target: 1.0 }
      ]
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        trends: {
          uxMetrics: {
            completion_rate: { direction: 'up', strength: 'strong', confidence: 0.85, projection: 95.0 },
            collaboration_adoption: { direction: 'up', strength: 'moderate', confidence: 0.78, projection: 82.0 },
            trust_score: { direction: 'up', strength: 'moderate', confidence: 0.72, projection: 4.6 },
            perceived_value: { direction: 'up', strength: 'strong', confidence: 0.90, projection: 9.0 }
          },
          performanceMetrics: {
            dashboard_load_time: { direction: 'down', strength: 'strong', confidence: 0.92, projection: 1.0 },
            article_creation_time: { direction: 'down', strength: 'moderate', confidence: 0.80, projection: 3.0 },
            comment_latency: { direction: 'down', strength: 'strong', confidence: 0.88, projection: 0.7 }
          }
        },
        anomalies: [
          { metric: 'completion_rate', week: '2024-W2', type: 'spike', description: 'Unusual increase in completion rate' },
          { metric: 'dashboard_load_time', week: '2024-W3', type: 'improvement', description: 'Significant performance improvement' }
        ],
        correlations: [
          { metric1: 'completion_rate', metric2: 'trust_score', correlation: 0.75, significance: 'high' },
          { metric1: 'dashboard_load_time', metric2: 'user_satisfaction', correlation: -0.68, significance: 'medium' }
        ]
      })
    } as Response)
  })

  it('renders trend analysis component', () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    expect(screen.getByText('Trend Analysis')).toBeInTheDocument()
    expect(screen.getByText('Analyze patterns and predict future metrics')).toBeInTheDocument()
  })

  it('displays trend analysis results', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('UX Metrics Trends')).toBeInTheDocument()
    expect(screen.getByText('Performance Metrics Trends')).toBeInTheDocument()
    expect(screen.getByText('Trend Insights')).toBeInTheDocument()
  })

  it('shows trend directions and strengths', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('UP')).toBeInTheDocument()
    expect(screen.getByText('DOWN')).toBeInTheDocument()
    expect(screen.getByText('Strong')).toBeInTheDocument()
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('displays trend confidence levels', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText(/85%/)).toBeInTheDocument()
    expect(screen.getByText(/78%/)).toBeInTheDocument()
    expect(screen.getByText(/72%/)).toBeInTheDocument()
    expect(screen.getByText(/90%/)).toBeInTheDocument()
  })

  it('shows trend projections', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Projected: 95.0%')).toBeInTheDocument()
    expect(screen.getByText('Projected: 82.0%')).toBeInTheDocument()
    expect(screen.getByText('Projected: 4.6')).toBeInTheDocument()
    expect(screen.getByText('Projected: 1.0s')).toBeInTheDocument()
  })

  it('identifies trend anomalies', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Anomalies Detected')).toBeInTheDocument()
    expect(screen.getByText('Unusual increase in completion rate')).toBeInTheDocument()
    expect(screen.getByText('Significant performance improvement')).toBeInTheDocument()
  })

  it('displays metric correlations', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Metric Correlations')).toBeInTheDocument()
    expect(screen.getByText('completion_rate ↔ trust_score')).toBeInTheDocument()
    expect(screen.getByText('Correlation: 0.75')).toBeInTheDocument()
    expect(screen.getByText('High Significance')).toBeInTheDocument()
  })

  it('allows time period selection', () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    expect(screen.getByLabelText('Time period')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /time period/i })).toBeInTheDocument()
  })

  it('supports trend comparison modes', () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    expect(screen.getByLabelText('Analysis mode')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /analysis mode/i })).toBeInTheDocument()
  })

  it('displays trend visualization charts', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    expect(screen.getByTestId('correlation-matrix')).toBeInTheDocument()
    expect(screen.getByTestId('anomaly-detector')).toBeInTheDocument()
  })

  it('shows loading state during analysis', () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))
    
    render(<TrendAnalysis orgId="test-org" />)
    
    expect(screen.getByText('Analyzing trends...')).toBeInTheDocument()
    expect(screen.getByTestId('trend-loading-skeleton')).toBeInTheDocument()
  })

  it('handles analysis errors gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Analysis failed' })
    } as Response)
    
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Failed to analyze trends')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('allows metric filtering', () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    expect(screen.getByLabelText('Select metrics to analyze')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /completion rate/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /collaboration adoption/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /trust score/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /perceived value/i })).toBeInTheDocument()
  })

  it('provides trend summary statistics', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Trend Summary')).toBeInTheDocument()
    expect(screen.getByText('4 improving trends')).toBeInTheDocument()
    expect(screen.getByText('2 declining trends')).toBeInTheDocument()
    expect(screen.getByText('3 stable trends')).toBeInTheDocument()
  })

  it('supports predictive forecasting', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Predictive Forecasting')).toBeInTheDocument()
    expect(screen.getByText('Next 4 weeks prediction')).toBeInTheDocument()
    expect(screen.getByText('Confidence interval: ±5%')).toBeInTheDocument()
  })

  it('displays seasonal pattern detection', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Seasonal Patterns')).toBeInTheDocument()
    expect(screen.getByText('Weekly patterns detected')).toBeInTheDocument()
    expect(screen.getByText('Monthly patterns detected')).toBeInTheDocument()
  })

  it('shows trend change points', async () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(screen.getByText('Change Points')).toBeInTheDocument()
    expect(screen.getByText('2 significant changes identified')).toBeInTheDocument()
    expect(screen.getByText('Week 2: Acceleration detected')).toBeInTheDocument()
  })

  it('allows export of trend analysis results', () => {
    render(<TrendAnalysis orgId="test-org" />)
    
    expect(screen.getByRole('button', { name: /export trends/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
  })
})
