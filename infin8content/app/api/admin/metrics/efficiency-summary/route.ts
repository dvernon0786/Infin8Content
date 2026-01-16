/**
 * Efficiency Summary API Endpoint
 * Story 32.2: Efficiency & Performance Metrics
 * Task 1.2: Implement metric collection endpoints
 * 
 * GET /api/admin/metrics/efficiency-summary
 * Returns time-to-first-article and review cycle reduction analytics
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
    const userRole = user.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      )
    }

    // Parse query parameters for time range
    const { searchParams } = new URL(request.url)
    const days = searchParams.get('days')
    const timeRangeDays = days ? parseInt(days, 10) : 7

    // Get efficiency summary
    const efficiencySummary = await performanceMetricsService.getEfficiencySummary()

    // Add additional analytics
    const analytics = {
      ...efficiencySummary,
      timeRange: {
        days: timeRangeDays,
        from: new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      },
      targets: {
        timeToFirstArticle: 15, // 15 minutes
        reviewCycleReduction: 60, // 60% reduction
        dashboardLoadTime: 2, // 2 seconds
        commentLatency: 1, // 1 second
        progressUpdateFrequency: 3 // 3 seconds
      },
      overallScore: calculateOverallScore(efficiencySummary)
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[API] Error in efficiency summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate overall efficiency score (0-100)
 */
function calculateOverallScore(summary: any): number {
  const scores = [
    Math.min(summary.timeToFirstArticle.achievementRate * 100, 100),
    Math.min(summary.reviewCycleReduction.achievementRate * 100, 100),
    Math.min(summary.dashboardPerformance.achievementRate * 100, 100)
  ]
  
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return Math.round(averageScore)
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed - Use GET to retrieve efficiency summary' },
    { status: 405 }
  )
}
