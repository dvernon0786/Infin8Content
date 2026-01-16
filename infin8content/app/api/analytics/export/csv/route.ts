/**
 * CSV Export API Route
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.2: Add data export capabilities (CSV, PDF)
 * 
 * Exports analytics data in CSV format with configurable
 * metrics and date ranges.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Request body schema
const requestSchema = z.object({
  analyticsData: z.object({
    uxMetrics: z.object({
      completion_rate: z.object({ value: z.number(), target: z.number(), trend: z.string() }),
      collaboration_adoption: z.object({ value: z.number(), target: z.number(), trend: z.string() }),
      trust_score: z.object({ value: z.number(), target: z.number(), trend: z.string() }),
      perceived_value: z.object({ value: z.number(), target: z.number(), trend: z.string() })
    }),
    performanceMetrics: z.object({
      dashboard_load_time: z.object({ value: z.number(), target: z.number(), trend: z.string() }),
      article_creation_time: z.object({ value: z.number(), target: z.number(), trend: z.string() }),
      comment_latency: z.object({ value: z.number(), target: z.number(), trend: z.string() })
    }),
    insights: z.array(z.object({ type: z.string(), message: z.string() })),
    recommendations: z.array(z.object({ priority: z.string(), action: z.string() })),
    lastUpdated: z.string()
  }),
  orgId: z.string().uuid(),
  format: z.string().optional(),
  selectedMetrics: z.object({
    uxMetrics: z.boolean(),
    performanceMetrics: z.boolean(),
    insights: z.boolean(),
    recommendations: z.boolean()
  }),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string()
  }),
  includeEmail: z.boolean().optional(),
  emailRecipients: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analyticsData, orgId, format, selectedMetrics, dateRange } = requestSchema.parse(body)

    // Generate CSV content
    const csvContent = generateCSV(analyticsData, selectedMetrics, format || 'standard', dateRange)

    // Create response headers for CSV download
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv')
    headers.set('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`)

    return new NextResponse(csvContent, { headers })

  } catch (error) {
    console.error('CSV Export API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateCSV(data: any, selectedMetrics: any, format: string, dateRange: any): string {
  const rows = []
  const headers = []

  // Add metadata
  rows.push(['Analytics Export'])
  rows.push([`Organization ID: ${data.orgId || 'N/A'}`])
  rows.push([`Export Date: ${new Date().toISOString()}`])
  rows.push([`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`])
  rows.push([`Format: ${format}`])
  rows.push([]) // Empty row separator

  // UX Metrics
  if (selectedMetrics.uxMetrics) {
    headers.push('UX Metrics')
    rows.push(['Metric', 'Current Value', 'Target', 'Trend'])
    
    Object.entries(data.uxMetrics).forEach(([key, metric]: any) => {
      const metricName = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      const unit = getMetricUnit(key)
      rows.push([
        metricName,
        `${metric.value}${unit}`,
        `${metric.target}${unit}`,
        metric.trend
      ])
    })
    rows.push([])
  }

  // Performance Metrics
  if (selectedMetrics.performanceMetrics) {
    headers.push('Performance Metrics')
    rows.push(['Metric', 'Current Value', 'Target', 'Trend'])
    
    Object.entries(data.performanceMetrics).forEach(([key, metric]: any) => {
      const metricName = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      rows.push([
        metricName,
        `${metric.value}s`,
        `${metric.target}s`,
        metric.trend
      ])
    })
    rows.push([])
  }

  // Insights
  if (selectedMetrics.insights && data.insights.length > 0) {
    headers.push('Insights')
    rows.push(['Type', 'Message'])
    
    data.insights.forEach((insight: any) => {
      rows.push([insight.type, insight.message])
    })
    rows.push([])
  }

  // Recommendations
  if (selectedMetrics.recommendations && data.recommendations.length > 0) {
    headers.push('Recommendations')
    rows.push(['Priority', 'Action'])
    
    data.recommendations.forEach((rec: any) => {
      rows.push([rec.priority, rec.action])
    })
    rows.push([])
  }

  // Summary
  headers.push('Summary')
  rows.push(['Last Updated', data.lastUpdated])
  rows.push(['Total UX Metrics', selectedMetrics.uxMetrics ? '4' : '0'])
  rows.push(['Total Performance Metrics', selectedMetrics.performanceMetrics ? '3' : '0'])
  rows.push(['Total Insights', selectedMetrics.insights ? data.insights.length : '0'])
  rows.push(['Total Recommendations', selectedMetrics.recommendations ? data.recommendations.length : '0'])

  // Convert to CSV string
  return rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
}

function getMetricUnit(metricKey: string): string {
  if (metricKey.includes('rate') || metricKey.includes('adoption')) return '%'
  if (metricKey.includes('trust')) return '/5'
  if (metricKey.includes('value')) return '/10'
  return ''
}
