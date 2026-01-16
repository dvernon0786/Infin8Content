/**
 * Performance Metrics Collection API Endpoint
 * Story 32.2: Efficiency & Performance Metrics
 * Task 1.2: Implement metric collection endpoints
 * 
 * POST /api/admin/metrics/collect
 * Collects and stores performance metrics from various sources
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { performanceMetricsService, PerformanceMetric } from '@/lib/services/performance-metrics'

export async function POST(request: NextRequest) {
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
    const userRole = user.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const metric: PerformanceMetric = {
      metric_type: body.metric_type,
      metric_value: body.metric_value,
      target_value: body.target_value,
      user_id: body.user_id,
      article_id: body.article_id,
      session_id: body.session_id,
      metadata: body.metadata
    }

    // Validate required fields
    if (!metric.metric_type || typeof metric.metric_value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request: metric_type and metric_value are required' },
        { status: 400 }
      )
    }

    // Track the metric
    const success = await performanceMetricsService.trackMetric(metric)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Metric tracked successfully',
        metric: {
          type: metric.metric_type,
          value: metric.metric_value,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to track metric' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[API] Error in metrics collection:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid metric type')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('must be positive')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle rate limiting
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed - Use POST to collect metrics' },
    { status: 405 }
  )
}
