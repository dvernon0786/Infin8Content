/**
 * Weekly Report API Route
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.1: Create weekly report generation system
 * 
 * Generates comprehensive weekly analytics reports
 * with metrics aggregation, insights, and recommendations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns'

// Query parameter schema
const querySchema = z.object({
  orgId: z.string().uuid(),
  week: z.string().regex(/^\d{4}-W\d{1,2}$/) // Format: 2024-W3
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { orgId, week } = querySchema.parse({
      orgId: searchParams.get('orgId'),
      week: searchParams.get('week')
    })

    // Parse week to get date range
    const [year, weekNumber] = week.split('-W')
    const weekNum = parseInt(weekNumber)
    const yearNum = parseInt(year)
    
    // Calculate start and end dates for the week
    const firstDayOfYear = new Date(yearNum, 0, 1)
    const daysOffset = (weekNum - 1) * 7 - firstDayOfYear.getDay() + 1 // Monday as first day
    const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    
    // Previous week for comparison
    const previousWeekStart = subWeeks(weekStart, 1)
    const previousWeekEnd = subWeeks(weekEnd, 1)

    const supabase = createClient()

    // Fetch current week UX metrics
    const { data: currentUXMetrics, error: currentUXError } = await supabase
      .from('user_experience_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', weekStart.toISOString())
      .lte('recorded_at', weekEnd.toISOString())
      .order('recorded_at', { ascending: false })

    if (currentUXError) {
      console.error('Current UX Metrics fetch error:', currentUXError)
      return NextResponse.json(
        { error: 'Failed to fetch current UX metrics' },
        { status: 500 }
      )
    }

    // Fetch previous week UX metrics for comparison
    const { data: previousUXMetrics, error: previousUXError } = await supabase
      .from('user_experience_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', previousWeekStart.toISOString())
      .lte('recorded_at', previousWeekEnd.toISOString())
      .order('recorded_at', { ascending: false })

    if (previousUXError) {
      console.error('Previous UX Metrics fetch error:', previousUXError)
      return NextResponse.json(
        { error: 'Failed to fetch previous UX metrics' },
        { status: 500 }
      )
    }

    // Fetch current week performance metrics
    const { data: currentPerfMetrics, error: currentPerfError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', weekStart.toISOString())
      .lte('recorded_at', weekEnd.toISOString())
      .order('recorded_at', { ascending: false })

    if (currentPerfError) {
      console.error('Current Performance Metrics fetch error:', currentPerfError)
      return NextResponse.json(
        { error: 'Failed to fetch current performance metrics' },
        { status: 500 }
      )
    }

    // Fetch previous week performance metrics for comparison
    const { data: previousPerfMetrics, error: previousPerfError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', previousWeekStart.toISOString())
      .lte('recorded_at', previousWeekEnd.toISOString())
      .order('recorded_at', { ascending: false })

    if (previousPerfError) {
      console.error('Previous Performance Metrics fetch error:', previousPerfError)
      return NextResponse.json(
        { error: 'Failed to fetch previous performance metrics' },
        { status: 500 }
      )
    }

    // Process metrics data
    const processedUXMetrics = processWeeklyUXMetrics(currentUXMetrics || [], previousUXMetrics || [])
    const processedPerfMetrics = processWeeklyPerfMetrics(currentPerfMetrics || [], previousPerfMetrics || [])

    // Generate insights
    const insights = generateWeeklyInsights(processedUXMetrics, processedPerfMetrics)
    
    // Generate recommendations
    const recommendations = generateWeeklyRecommendations(insights, processedUXMetrics, processedPerfMetrics)

    // Calculate overall score
    const overallScore = calculateOverallScore(processedUXMetrics, processedPerfMetrics)

    // Generate summary
    const summary = generateWeeklySummary(processedUXMetrics, processedPerfMetrics, insights)

    const reportData = {
      weekNumber: weekNum,
      year: yearNum,
      period: `${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`,
      uxMetrics: processedUXMetrics,
      performanceMetrics: processedPerfMetrics,
      insights,
      recommendations,
      summary: {
        overallScore,
        ...summary
      }
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Weekly Report API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process UX metrics for weekly report
function processWeeklyUXMetrics(currentMetrics: any[], previousMetrics: any[]) {
  const latestCurrent = getLatestMetrics(currentMetrics)
  const latestPrevious = getLatestMetrics(previousMetrics)

  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (previous === 0) return 'stable'
    const changePercent = ((current - previous) / previous) * 100
    if (Math.abs(changePercent) < 2) return 'stable'
    return changePercent > 0 ? 'up' : 'down'
  }

  return {
    completion_rate: {
      current: latestCurrent.completion_rate || 0,
      previous: latestPrevious.completion_rate || 0,
      target: latestCurrent.completion_rate_target || 90,
      trend: calculateTrend(latestCurrent.completion_rate || 0, latestPrevious.completion_rate || 0)
    },
    collaboration_adoption: {
      current: latestCurrent.collaboration_adoption || 0,
      previous: latestPrevious.collaboration_adoption || 0,
      target: latestCurrent.collaboration_adoption_target || 85,
      trend: calculateTrend(latestCurrent.collaboration_adoption || 0, latestPrevious.collaboration_adoption || 0)
    },
    trust_score: {
      current: latestCurrent.trust_score || 0,
      previous: latestPrevious.trust_score || 0,
      target: latestCurrent.trust_score_target || 4.5,
      trend: calculateTrend(latestCurrent.trust_score || 0, latestPrevious.trust_score || 0)
    },
    perceived_value: {
      current: latestCurrent.perceived_value || 0,
      previous: latestPrevious.perceived_value || 0,
      target: latestCurrent.perceived_value_target || 8.0,
      trend: calculateTrend(latestCurrent.perceived_value || 0, latestPrevious.perceived_value || 0)
    }
  }
}

// Process performance metrics for weekly report
function processWeeklyPerfMetrics(currentMetrics: any[], previousMetrics: any[]) {
  const latestCurrent = getLatestMetrics(currentMetrics)
  const latestPrevious = getLatestMetrics(previousMetrics)

  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
    if (previous === 0) return 'stable'
    const changePercent = ((current - previous) / previous) * 100
    if (Math.abs(changePercent) < 2) return 'stable'
    // For performance metrics, lower is better, so reverse the logic
    return changePercent > 0 ? 'up' : 'down'
  }

  return {
    dashboard_load_time: {
      current: latestCurrent.dashboard_load_time || 0,
      previous: latestPrevious.dashboard_load_time || 0,
      target: latestCurrent.dashboard_load_time_target || 2.0,
      trend: calculateTrend(latestCurrent.dashboard_load_time || 0, latestPrevious.dashboard_load_time || 0)
    },
    article_creation_time: {
      current: latestCurrent.article_creation_time || 0,
      previous: latestPrevious.article_creation_time || 0,
      target: latestCurrent.article_creation_time_target || 5.0,
      trend: calculateTrend(latestCurrent.article_creation_time || 0, latestPrevious.article_creation_time || 0)
    },
    comment_latency: {
      current: latestCurrent.comment_latency || 0,
      previous: latestPrevious.comment_latency || 0,
      target: latestCurrent.comment_latency_target || 1.0,
      trend: calculateTrend(latestCurrent.comment_latency || 0, latestPrevious.comment_latency || 0)
    }
  }
}

// Get latest metrics from a list
function getLatestMetrics(metrics: any[]) {
  return metrics.reduce((acc: any, metric) => {
    if (!acc[metric.metric_type] || new Date(metric.recorded_at) > new Date(acc[metric.metric_type]?.recorded_at || 0)) {
      acc[metric.metric_type] = {
        value: metric.metric_value,
        target: metric.target_value,
        recorded_at: metric.recorded_at
      }
    }
    return acc
  }, {})
}

// Generate weekly insights
function generateWeeklyInsights(uxMetrics: any, perfMetrics: any) {
  const insights = []

  // UX insights
  if (uxMetrics.completion_rate.current > uxMetrics.completion_rate.target) {
    insights.push({
      type: 'positive',
      message: `User completion rate (${uxMetrics.completion_rate.current}%) exceeds target (${uxMetrics.completion_rate.target}%)`
    })
  }

  if (uxMetrics.collaboration_adoption.trend === 'up') {
    insights.push({
      type: 'positive',
      message: `Collaboration adoption is trending upward (${uxMetrics.collaboration_adoption.current}%)`
    })
  } else if (uxMetrics.collaboration_adoption.current < uxMetrics.collaboration_adoption.target * 0.8) {
    insights.push({
      type: 'warning',
      message: `Collaboration adoption (${uxMetrics.collaboration_adoption.current}%) needs improvement`
    })
  }

  if (uxMetrics.trust_score.current >= 4.0) {
    insights.push({
      type: 'positive',
      message: `High user trust score (${uxMetrics.trust_score.current}/5) indicates strong confidence`
    })
  }

  // Performance insights
  if (perfMetrics.dashboard_load_time.current < perfMetrics.dashboard_load_time.target) {
    insights.push({
      type: 'positive',
      message: `Dashboard load time (${perfMetrics.dashboard_load_time.current}s) is better than target`
    })
  } else if (perfMetrics.dashboard_load_time.current > perfMetrics.dashboard_load_time.target * 1.5) {
    insights.push({
      type: 'critical',
      message: `Dashboard load time (${perfMetrics.dashboard_load_time.current}s) significantly exceeds target`
    })
  }

  if (perfMetrics.article_creation_time.trend === 'down') {
    insights.push({
      type: 'positive',
      message: `Article creation time is improving (${perfMetrics.article_creation_time.current}s)`
    })
  }

  return insights
}

// Generate weekly recommendations
function generateWeeklyRecommendations(insights: any[], uxMetrics: any, perfMetrics: any) {
  const recommendations = []

  // UX recommendations
  if (uxMetrics.completion_rate.current < uxMetrics.completion_rate.target) {
    recommendations.push({
      priority: 'high',
      action: 'Review and optimize user onboarding flow to improve completion rates'
    })
  }

  if (uxMetrics.collaboration_adoption.current < uxMetrics.collaboration_adoption.target) {
    recommendations.push({
      priority: 'medium',
      action: 'Increase visibility and accessibility of collaboration features'
    })
  }

  // Performance recommendations
  if (perfMetrics.dashboard_load_time.current > perfMetrics.dashboard_load_time.target) {
    recommendations.push({
      priority: 'high',
      action: 'Optimize dashboard loading performance through caching and lazy loading'
    })
  }

  if (perfMetrics.article_creation_time.current > perfMetrics.article_creation_time.target) {
    recommendations.push({
      priority: 'medium',
      action: 'Streamline article creation workflow to reduce processing time'
    })
  }

  // General recommendations based on insights
  const criticalInsights = insights.filter(i => i.type === 'critical')
  if (criticalInsights.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Address critical performance issues immediately to prevent user impact'
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      action: 'Continue monitoring metrics and maintain current performance levels'
    })
  }

  return recommendations
}

// Calculate overall score
function calculateOverallScore(uxMetrics: any, perfMetrics: any) {
  const scores = []

  // UX metrics scores (0-100)
  scores.push(Math.min((uxMetrics.completion_rate.current / uxMetrics.completion_rate.target) * 100, 100))
  scores.push(Math.min((uxMetrics.collaboration_adoption.current / uxMetrics.collaboration_adoption.target) * 100, 100))
  scores.push(Math.min((uxMetrics.trust_score.current / uxMetrics.trust_score.target) * 100, 100))
  scores.push(Math.min((uxMetrics.perceived_value.current / uxMetrics.perceived_value.target) * 100, 100))

  // Performance metrics scores (0-100, inverted since lower is better)
  scores.push(Math.min((perfMetrics.dashboard_load_time.target / perfMetrics.dashboard_load_time.current) * 100, 100))
  scores.push(Math.min((perfMetrics.article_creation_time.target / perfMetrics.article_creation_time.current) * 100, 100))
  scores.push(Math.min((perfMetrics.comment_latency.target / perfMetrics.comment_latency.current) * 100, 100))

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

// Generate weekly summary
function generateWeeklySummary(uxMetrics: any, perfMetrics: any, insights: any[]) {
  const achievements = []
  const challenges = []
  const nextFocus = []

  // Achievements
  if (uxMetrics.completion_rate.current > uxMetrics.completion_rate.target) {
    achievements.push('Improved completion rate')
  }
  if (perfMetrics.dashboard_load_time.current < perfMetrics.dashboard_load_time.target) {
    achievements.push('Reduced dashboard load times')
  }
  if (uxMetrics.trust_score.current >= 4.0) {
    achievements.push('High user trust maintained')
  }

  // Challenges
  if (uxMetrics.collaboration_adoption.current < uxMetrics.collaboration_adoption.target) {
    challenges.push('Below target collaboration adoption')
  }
  if (perfMetrics.article_creation_time.current > perfMetrics.article_creation_time.target) {
    challenges.push('Article creation time needs improvement')
  }

  // Next focus
  if (uxMetrics.collaboration_adoption.current < uxMetrics.collaboration_adoption.target) {
    nextFocus.push('Enhance collaboration features')
  }
  if (perfMetrics.dashboard_load_time.current > perfMetrics.dashboard_load_time.target) {
    nextFocus.push('Optimize dashboard performance')
  }
  nextFocus.push('Monitor performance trends')

  return {
    keyAchievements: achievements.length > 0 ? achievements : ['Maintained stable performance'],
    challenges: challenges.length > 0 ? challenges : ['No significant challenges identified'],
    nextFocus: nextFocus.length > 0 ? nextFocus : ['Continue current optimization efforts']
  }
}
