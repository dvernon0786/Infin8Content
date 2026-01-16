/**
 * Performance Metrics Dashboard API Endpoint
 * Story 32.2: Efficiency & Performance Metrics
 * Task 1.2: Implement metric collection endpoints
 * 
 * GET /api/admin/metrics/dashboard
 * Returns aggregated metrics with trends and comparisons for dashboard display
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { performanceMetricsService } from '@/lib/services/performance-metrics'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getCurrentUser()
    if (!user || !user.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Check if user has admin role
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const metric_type = searchParams.get('metric_type') as any
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const user_id = searchParams.get('user_id')
    const limit = searchParams.get('limit')

    // Build query options
    const options: any = {}
    if (metric_type) options.metric_type = metric_type
    if (date_from) options.date_from = date_from
    if (date_to) options.date_to = date_to
    if (user_id) options.user_id = user_id
    if (limit) options.limit = parseInt(limit, 10)

    // Get metrics
    const metrics = await performanceMetricsService.getMetrics(options)

    // Get efficiency summary if no specific filters
    let efficiencySummary = null
    if (!metric_type && !user_id) {
      efficiencySummary = await performanceMetricsService.getEfficiencySummary()
    }

    // Calculate basic statistics
    const stats = metrics.length > 0 ? {
      count: metrics.length,
      average: metrics.reduce((sum: number, m: any) => sum + (m.metric_value || 0), 0) / metrics.length,
      min: Math.min(...metrics.map((m: any) => m.metric_value || 0)),
      max: Math.max(...metrics.map((m: any) => m.metric_value || 0)),
      latest: metrics[0]?.created_at,
      oldest: metrics[metrics.length - 1]?.created_at
    } : null

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        stats,
        efficiency_summary: efficiencySummary,
        filters: options,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[API] Error in dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed - Use GET to retrieve metrics' },
    { status: 405 }
  )
}
