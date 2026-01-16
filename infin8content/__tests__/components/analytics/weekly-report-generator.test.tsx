/**
 * Weekly Report Generator Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.1: Create weekly report generation system
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WeeklyReportGenerator } from '@/components/analytics/weekly-report-generator'

// Mock the report generation API
global.fetch = vi.fn()

describe('WeeklyReportGenerator', () => {
  const mockReportData = {
    weekNumber: 3,
    year: 2024,
    period: '2024-01-15 to 2024-01-21',
    uxMetrics: {
      completion_rate: { current: 92.5, previous: 88.2, target: 90.0, trend: 'up' },
      collaboration_adoption: { current: 78.3, previous: 75.1, target: 85.0, trend: 'up' },
      trust_score: { current: 4.2, previous: 4.0, target: 4.5, trend: 'up' },
      perceived_value: { current: 8.7, previous: 8.4, target: 8.0, trend: 'up' }
    },
    performanceMetrics: {
      dashboard_load_time: { current: 1.2, previous: 1.5, target: 2.0, trend: 'down' },
      article_creation_time: { current: 3.4, previous: 3.8, target: 5.0, trend: 'down' },
      comment_latency: { current: 0.8, previous: 0.9, target: 1.0, trend: 'down' }
    },
    insights: [
      { type: 'positive', message: 'User engagement increased by 15%' },
      { type: 'warning', message: 'Collaboration adoption needs improvement' }
    ],
    recommendations: [
      { priority: 'high', action: 'Increase collaboration features visibility' },
      { priority: 'medium', action: 'Continue performance optimization' }
    ],
    summary: {
      overallScore: 85,
      keyAchievements: ['Improved completion rate', 'Reduced load times'],
      challenges: ['Below target collaboration adoption'],
      nextFocus: ['Enhance collaboration features', 'Monitor performance trends']
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockReportData
    } as Response)
  })

  it('renders weekly report generator', () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    expect(screen.getByText('Weekly Report Generator')).toBeInTheDocument()
    expect(screen.getByText('Generate comprehensive weekly analytics reports')).toBeInTheDocument()
  })

  it('displays week selector with current week', () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const weekSelector = screen.getByLabelText('Select week')
    expect(weekSelector).toBeInTheDocument()
  })

  it('generates report when Generate Report button is clicked', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/analytics/weekly-report?orgId=test-org&week=2024-W3'
      )
    })
  })

  it('displays loading state during report generation', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))
    
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    expect(screen.getByText('Generating report...')).toBeInTheDocument()
    expect(screen.getByTestId('report-loading-skeleton')).toBeInTheDocument()
  })

  it('displays generated report with all sections', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Analytics Report')).toBeInTheDocument()
      expect(screen.getByText('Executive Summary')).toBeInTheDocument()
      expect(screen.getByText('User Experience Metrics')).toBeInTheDocument()
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument()
      expect(screen.getByText('Key Insights')).toBeInTheDocument()
      expect(screen.getByText('Recommendations')).toBeInTheDocument()
    })
  })

  it('displays metrics with comparisons and trends', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('92.5%')).toBeInTheDocument()
      expect(screen.getByText('Previous: 88.2%')).toBeInTheDocument()
      expect(screen.getByText('Target: 90.0%')).toBeInTheDocument()
    })
  })

  it('shows overall score and performance indicators', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('Overall Score: 85/100')).toBeInTheDocument()
      expect(screen.getByText('Good Performance')).toBeInTheDocument()
    })
  })

  it('displays key achievements and challenges', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('Key Achievements')).toBeInTheDocument()
      expect(screen.getByText('Improved completion rate')).toBeInTheDocument()
      expect(screen.getByText('Challenges')).toBeInTheDocument()
      expect(screen.getByText('Below target collaboration adoption')).toBeInTheDocument()
    })
  })

  it('provides download options for generated report', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /share report/i })).toBeInTheDocument()
    })
  })

  it('handles report generation errors', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to generate report' })
    } as Response)
    
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to generate report')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('allows scheduling recurring reports', () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    expect(screen.getByText('Schedule Recurring Reports')).toBeInTheDocument()
    expect(screen.getByLabelText('Enable weekly reports')).toBeInTheDocument()
  })

  it('supports email delivery configuration', () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    expect(screen.getByLabelText('Email recipients')).toBeInTheDocument()
    expect(screen.getByLabelText('Delivery time')).toBeInTheDocument()
  })

  it('validates report parameters before generation', async () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    // Try to generate without selecting week (should default to current week)
    const generateButton = screen.getByRole('button', { name: /generate report/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      // Should still attempt to generate with default week
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('displays report preview before generation', () => {
    render(<WeeklyReportGenerator orgId="test-org" />)
    
    expect(screen.getByText('Report Preview')).toBeInTheDocument()
    expect(screen.getByText('Preview includes:')).toBeInTheDocument()
  })
})
