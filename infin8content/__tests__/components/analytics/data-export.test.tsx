/**
 * Data Export Component Tests
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.2: Add data export capabilities (CSV, PDF)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataExport } from '@/components/analytics/data-export'

// Mock export APIs
global.fetch = vi.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document.createElement for download simulation
const mockCreateElement = vi.fn(() => ({
  href: 'mock-url',
  download: '',
  click: vi.fn(),
  remove: vi.fn()
}))
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
})

// Mock document.body.appendChild and removeChild
Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  writable: true
})

describe('DataExport', () => {
  const mockAnalyticsData = {
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
      { type: 'positive', message: 'User engagement increased by 15%' },
      { type: 'warning', message: 'Collaboration adoption needs improvement' }
    ],
    recommendations: [
      { priority: 'high', action: 'Increase collaboration features visibility' },
      { priority: 'medium', action: 'Continue performance optimization' }
    ],
    lastUpdated: '2024-01-15T10:30:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['test data'], { type: 'application/pdf' })
    } as Response)
  })

  it('renders data export component with export options', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByText('Data Export')).toBeInTheDocument()
    expect(screen.getByText('Export analytics data in various formats')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
  })

  it('exports data as CSV when CSV export button is clicked', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['csv,data'], { type: 'text/csv' })
    } as Response)

    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    const csvButton = screen.getByRole('button', { name: /export csv/i })
    fireEvent.click(csvButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsData: mockAnalyticsData, orgId: 'test-org' })
      })
    })

    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(document.body.appendChild).toHaveBeenCalled()
  })

  it('exports data as PDF when PDF export button is clicked', async () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    const pdfButton = screen.getByRole('button', { name: /export pdf/i })
    fireEvent.click(pdfButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/analytics/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsData: mockAnalyticsData, orgId: 'test-org' })
      })
    })

    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(document.body.appendChild).toHaveBeenCalled()
  })

  it('shows loading state during export', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))
    
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    const csvButton = screen.getByRole('button', { name: /export csv/i })
    fireEvent.click(csvButton)
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument()
    expect(csvButton).toBeDisabled()
  })

  it('handles export errors gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Export failed' })
    } as Response)
    
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    const csvButton = screen.getByRole('button', { name: /export csv/i })
    fireEvent.click(csvButton)
    
    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('allows date range selection for export', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByLabelText('Start date')).toBeInTheDocument()
    expect(screen.getByLabelText('End date')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /export period/i })).toBeInTheDocument()
  })

  it('allows metric selection for export', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByLabelText('Select metrics to export')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /ux metrics/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /performance metrics/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /insights/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /recommendations/i })).toBeInTheDocument()
  })

  it('validates export parameters before export', async () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    // Uncheck all metrics
    const uxCheckbox = screen.getByRole('checkbox', { name: /ux metrics/i })
    const perfCheckbox = screen.getByRole('checkbox', { name: /performance metrics/i })
    
    fireEvent.click(uxCheckbox)
    fireEvent.click(perfCheckbox)
    
    const csvButton = screen.getByRole('button', { name: /export csv/i })
    fireEvent.click(csvButton)
    
    expect(screen.getByText('Please select at least one metric to export')).toBeInTheDocument()
  })

  it('supports scheduled exports', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByText('Scheduled Exports')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /enable scheduled exports/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Export frequency')).toBeInTheDocument()
    expect(screen.getByLabelText('Email recipients')).toBeInTheDocument()
  })

  it('shows export history', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByText('Export History')).toBeInTheDocument()
    expect(screen.getByText('Recent exports will appear here')).toBeInTheDocument()
  })

  it('allows custom export format selection', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByLabelText('Export format')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /standard csv/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /detailed csv/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /summary pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /detailed pdf/i })).toBeInTheDocument()
  })

  it('displays export preview', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByText('Export Preview')).toBeInTheDocument()
    expect(screen.getByText('Export will include:')).toBeInTheDocument()
    expect(screen.getByText('4 UX metrics')).toBeInTheDocument()
    expect(screen.getByText('3 performance metrics')).toBeInTheDocument()
    expect(screen.getByText('2 insights')).toBeInTheDocument()
    expect(screen.getByText('2 recommendations')).toBeInTheDocument()
  })

  it('supports bulk export operations', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByRole('button', { name: /export all formats/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export historical data/i })).toBeInTheDocument()
  })

  it('shows export progress for large datasets', async () => {
    vi.mocked(global.fetch).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          blob: async () => new Blob(['large,data'], { type: 'application/pdf' })
        } as Response), 100)
      )
    )
    
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    const pdfButton = screen.getByRole('button', { name: /export pdf/i })
    fireEvent.click(pdfButton)
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('allows email delivery of exported data', () => {
    render(<DataExport analyticsData={mockAnalyticsData} orgId="test-org" />)
    
    expect(screen.getByRole('checkbox', { name: /email export/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Email recipients for export')).toBeInTheDocument()
  })
})
