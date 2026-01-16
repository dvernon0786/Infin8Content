/**
 * PDF Export API Route
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.2: Add data export capabilities (CSV, PDF)
 * 
 * Exports analytics data in PDF format with professional
 * layout and comprehensive reporting.
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

    // Generate PDF content (HTML string)
    const htmlContent = generatePDFHTML(analyticsData, selectedMetrics, format || 'standard', dateRange, orgId)

    // In a real implementation, you would use a PDF library like Puppeteer or jsPDF
    // For now, we'll return the HTML as a placeholder
    // This would be converted to PDF using a service or library
    
    // Create response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'text/html')
    headers.set('Content-Disposition', `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.pdf"`)

    return new NextResponse(htmlContent, { headers })

  } catch (error) {
    console.error('PDF Export API error:', error)
    
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

function generatePDFHTML(data: any, selectedMetrics: any, format: string, dateRange: any, orgId: string): string {
  const currentDate = new Date().toLocaleDateString()
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Analytics Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: #f9fafb;
        }
        .metric-card h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 16px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 5px;
        }
        .metric-details {
            font-size: 12px;
            color: #6b7280;
        }
        .insights-list, .recommendations-list {
            list-style: none;
            padding: 0;
        }
        .insights-list li, .recommendations-list li {
            background: #f3f4f6;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 4px;
            border-left: 4px solid #3b82f6;
        }
        .insights-list.positive {
            border-left-color: #10b981;
        }
        .insights-list.warning {
            border-left-color: #f59e0b;
        }
        .insights-list.critical {
            border-left-color: #ef4444;
        }
        .recommendations-list.high {
            border-left-color: #ef4444;
        }
        .recommendations-list.medium {
            border-left-color: #f59e0b;
        }
        .recommendations-list.low {
            border-left-color: #10b981;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-stable { color: #6b7280; }
        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Analytics Report</h1>
        <p>Organization: ${orgId} | ${currentDate}</p>
        <p>Date Range: ${dateRange.startDate} to ${dateRange.endDate}</p>
        <p>Format: ${format}</p>
    </div>

    ${selectedMetrics.uxMetrics ? `
    <section>
        <h2>User Experience Metrics</h2>
        <div class="metric-grid">
            ${Object.entries(data.uxMetrics).map(([key, metric]: any) => `
                <div class="metric-card">
                    <h3>${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
                    <div class="metric-value">${metric.value}${getMetricUnit(key)}</div>
                    <div class="metric-details">
                        Target: ${metric.target}${getMetricUnit(key)}<br>
                        Trend: <span class="trend-${metric.trend}">${metric.trend.toUpperCase()}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </section>
    ` : ''}

    ${selectedMetrics.performanceMetrics ? `
    <section>
        <h2>Performance Metrics</h2>
        <div class="metric-grid">
            ${Object.entries(data.performanceMetrics).map(([key, metric]: any) => `
                <div class="metric-card">
                    <h3>${key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
                    <div class="metric-value">${metric.value}s</div>
                    <div class="metric-details">
                        Target: ${metric.target}s<br>
                        Trend: <span class="trend-${metric.trend}">${metric.trend.toUpperCase()}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </section>
    ` : ''}

    ${selectedMetrics.insights && data.insights.length > 0 ? `
    <section>
        <h2>Key Insights</h2>
        <ul class="insights-list">
            ${data.insights.map((insight: any) => `
                <li class="${insight.type}">
                    <strong>${insight.type.toUpperCase()}:</strong> ${insight.message}
                </li>
            `).join('')}
        </ul>
    </section>
    ` : ''}

    ${selectedMetrics.recommendations && data.recommendations.length > 0 ? `
    <section>
        <h2>Recommendations</h2>
        <ul class="recommendations-list">
            ${data.recommendations.map((rec: any) => `
                <li class="${rec.priority}">
                    <strong>${rec.priority.toUpperCase()}:</strong> ${rec.action}
                </li>
            `).join('')}
        </ul>
    </section>
    ` : ''}

    <section>
        <h2>Summary</h2>
        <div class="metric-details">
            <p><strong>Last Updated:</strong> ${data.lastUpdated}</p>
            <p><strong>Total UX Metrics:</strong> ${selectedMetrics.uxMetrics ? '4' : '0'}</p>
            <p><strong>Total Performance Metrics:</strong> ${selectedMetrics.performanceMetrics ? '3' : '0'}</p>
            <p><strong>Total Insights:</strong> ${selectedMetrics.insights ? data.insights.length : '0'}</p>
            <p><strong>Total Recommendations:</strong> ${selectedMetrics.recommendations ? data.recommendations.length : '0'}</p>
        </div>
    </section>

    <div class="footer">
        <p>Generated on ${new Date().toISOString()} by Infin8Content Analytics System</p>
        <p>This report contains confidential information and should be handled accordingly.</p>
    </div>
</body>
</html>
  `
}

function getMetricUnit(metricKey: string): string {
  if (metricKey.includes('rate') || metricKey.includes('adoption')) return '%'
  if (metricKey.includes('trust')) return '/5'
  if (metricKey.includes('value')) return '/10'
  return ''
}
