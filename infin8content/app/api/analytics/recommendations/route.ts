/**
 * Recommendations API Route
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 3.2: Create recommendation engine based on metrics
 * 
 * AI-powered recommendation engine that analyzes metrics,
 * trends, and patterns to generate actionable insights.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request body schema
const requestSchema = z.object({
  orgId: z.string().uuid(),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  minImpactLevel: z.enum(['low', 'medium', 'high']).default('low'),
  maxEffortLevel: z.enum(['low', 'medium', 'high']).default('high')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, confidenceThreshold, minImpactLevel, maxEffortLevel } = requestSchema.parse(body)

    const supabase = await createClient()

    // Fetch current metrics
    const { data: currentUXMetrics, error: currentUXError } = await supabase
      .from('ux_metrics_weekly_rollups')
      .select('*')
      .eq('organization_id', orgId)
      .order('recorded_at', { ascending: false })
      .limit(100)

    if (currentUXError) {
      console.error('Current UX Metrics fetch error:', currentUXError)
      return NextResponse.json(
        { error: 'Failed to fetch current UX metrics' },
        { status: 500 }
      )
    }

    const { data: currentPerfMetrics, error: currentPerfError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .order('recorded_at', { ascending: false })
      .limit(100)

    if (currentPerfError) {
      console.error('Current Performance Metrics fetch error:', currentPerfError)
      return NextResponse.json(
        { error: 'Failed to fetch current performance metrics' },
        { status: 500 }
      )
    }

    // Fetch historical data for trend analysis
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90) // Last 90 days

    const { data: historicalUXMetrics, error: historicalUXError } = await supabase
      .from('ux_metrics_weekly_rollups')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (historicalUXError) {
      console.error('Historical UX Metrics fetch error:', historicalUXError)
      return NextResponse.json(
        { error: 'Failed to fetch historical UX metrics' },
        { status: 500 }
      )
    }

    const { data: historicalPerfMetrics, error: historicalPerfError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (historicalPerfError) {
      console.error('Historical Performance Metrics fetch error:', historicalPerfError)
      return NextResponse.json(
          { error: 'Failed to fetch historical performance metrics' },
          { status: 500 }
        )
    }

    // Generate recommendations
    const recommendations = generateRecommendations(
      currentUXMetrics || [],
      currentPerfMetrics || [],
      historicalUXMetrics || [],
      historicalPerfMetrics || [],
      confidenceThreshold,
      minImpactLevel,
      maxEffortLevel
    )

    // Generate insights
    const insights = generateInsights(recommendations)

    // Calculate summary
    const summary = calculateRecommendationSummary(recommendations)

    const recommendationData = {
      recommendations,
      insights,
      summary
    }

    return NextResponse.json(recommendationData)

  } catch (error) {
    console.error('Recommendations API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate recommendations based on metrics analysis
function generateRecommendations(
  currentUXMetrics: any[],
  currentPerfMetrics: any[],
  historicalUXMetrics: any[],
  historicalPerfMetrics: any[],
  confidenceThreshold: number,
  minImpactLevel: string,
  maxEffortLevel: string
): any[] {
  const recommendations: any[] = []

  // Analyze performance metrics
  const perfMetrics = currentPerfMetrics.reduce((acc: any, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = []
    }
    acc[metric.metric_type].push(metric)
    return acc
  }, {})

  Object.entries(perfMetrics).forEach(([metricType, metrics]: any) => {
    const latestMetric = metrics[metrics.length - 1]
    if (!latestMetric) return

    const target = latestMetric.target_value
    const current = latestMetric.metric_value
    
    // Check if metric is performing poorly
    if (current > target * 1.2) {
      const impact = current > target * 2 ? 'high' : current > target * 1.5 ? 'medium' : 'low'
      
      if (shouldIncludeImpact(impact, minImpactLevel)) {
        const effort = current > target * 2 ? 'high' : 'medium'
        
        if (shouldIncludeEffort(effort, maxEffortLevel)) {
          const confidence = calculateConfidence(historicalPerfMetrics.filter(m => m.metric_type === metricType))
          
          if (confidence >= confidenceThreshold) {
            recommendations.push({
              id: `perf_${metricType}_${Date.now()}`,
              priority: impact === 'high' ? 'high' : impact === 'medium' ? 'medium' : 'low',
              category: 'performance',
              title: generatePerformanceTitle(metricType, current, target),
              description: generatePerformanceDescription(metricType, current, target),
              action: generatePerformanceAction(metricType, current, target),
              impact,
              effort,
              expectedImprovement: generateExpectedImprovement(metricType, current, target),
              metrics: [metricType],
              confidence
            })
          }
        }
      }
    }
  })

  // Analyze UX metrics
  const uxMetrics = currentUXMetrics.reduce((acc: any, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = []
    }
    acc[metric.metric_type].push(metric)
    return acc
  }, {})

  Object.entries(uxMetrics).forEach(([metricType, metrics]: any) => {
    const latestMetric = metrics[metrics.length - 1]
    if (!latestMetric) return

    const target = latestMetric.target_value
    const current = latestMetric.metric_value
    
    // Check if UX metric needs improvement
    if (current < target * 0.8) {
      const impact = current < target * 0.6 ? 'high' : current < target * 0.7 ? 'medium' : 'low'
      
      if (shouldIncludeImpact(impact, minImpactLevel)) {
        const effort = 'low'
        
        if (shouldIncludeEffort(effort, maxEffortLevel)) {
          const confidence = calculateConfidence(historicalUXMetrics.filter(m => m.metric_type === metricType))
          
          if (confidence >= confidenceThreshold) {
            recommendations.push({
              id: `ux_${metricType}_${Date.now()}`,
              priority: impact === 'high' ? 'high' : impact === 'medium' ? 'medium' : 'low',
              category: 'ux',
              title: generateUXTitle(metricType, current, target),
              description: generateUXDescription(metricType, current, target),
              action: generateUXAction(metricType, current, target),
              impact,
              effort,
              expectedImprovement: generateExpectedImprovement(metricType, current, target),
              metrics: [metricType],
              confidence
            })
          }
        }
      }
    }
  })

  // Add growth recommendations based on trends
  const growthRecommendations = generateGrowthRecommendations(
    historicalUXMetrics,
    historicalPerfMetrics,
    confidenceThreshold
  )
  
  recommendations.push(...growthRecommendations)

  // Add maintenance recommendations
  const maintenanceRecommendations = generateMaintenanceRecommendations(
    currentUXMetrics,
    currentPerfMetrics,
    confidenceThreshold
  )
  
  recommendations.push(...maintenanceRecommendations)

  return recommendations
}

// Generate performance recommendations
function generatePerformanceTitle(metricType: string, current: number, target: number): string {
  const metricName = metricType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  if (current > target * 2) {
    return `Critical: Optimize ${metricName}`
  } else if (current > target * 1.5) {
    return `Improve ${metricName} Performance`
  } else {
      return `Optimize ${metricName}`
    }
}

function generatePerformanceDescription(metricType: string, current: number, target: number): string {
  const metricName = metricType.replace(/_/g, ' ')
  const percentage = ((current - target) / target) * 100
  
  if (percentage > 100) {
    return `${metricName} is ${percentage.toFixed(1)}% above target, significantly impacting user experience`
  } else if (percentage > 50) {
    return `${metricName} is ${percentage.toFixed(1)}% above target, affecting performance`
  } else {
    return `${metricName} is ${percentage.toFixed(1)}% above target`
  }
}

function generatePerformanceAction(metricType: string, current: number, target: number): string {
  const metricName = metricType.replace(/_/g, ' ')
  
  if (metricType.includes('load_time')) {
    return 'Implement lazy loading, optimize database queries, and add caching mechanisms'
  } else if (metricType.includes('creation_time')) {
    return 'Streamline creation workflow, optimize processing pipeline, and reduce bottlenecks'
  } else if (metricType.includes('latency')) {
    return 'Optimize real-time processing, implement queuing, and improve network performance'
  } else {
    return `Optimize ${metricName} through performance engineering`
  }
}

function generateExpectedImprovement(metricType: string, current: number, target: number): string {
  const improvement = ((current - target) / target) * 100
  const reduction = Math.abs(improvement)
  
  if (metricType.includes('time')) {
    return `${reduction.toFixed(1)}% reduction in ${metricType.replace(/_/g, ' ')}`
  } else {
    return `${reduction.toFixed(1)}% improvement in ${metricType.replace(/_/g, ' ')}`
  }
}

// Generate UX recommendations
function generateUXTitle(metricType: string, current: number, target: number): string {
  const metricName = metricType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  
  if (current < target * 0.6) {
    return `Critical: Improve ${metricName}`
  } else if (current < target * 0.7) {
    return `Enhance ${metricName}`
  } else {
      return `Maintain ${metricName}`
    }
}

function generateUXDescription(metricType: string, current: number, target: number): string {
  const metricName = metricType.replace(/_/g, ' ')
  const percentage = ((target - current) / target) * 100
  
  if (percentage > 40) {
    return `${metricName} is ${percentage.toFixed(1)}% below target, requiring immediate attention`
  } else if (percentage > 20) {
    return `${metricName} is ${percentage.toFixed(1)}% below target`
  } else {
    return `${metricName} is ${percentage.toFixed(1)}% below target`
  }
}

function generateUXAction(metricType: string, current: number, target: number): string {
  const metricName = metricType.replace(/_/g, ' ')
  
  if (metricType.includes('completion_rate')) {
    return 'Simplify user workflows, add guided tutorials, and improve onboarding experience'
  } else if (metricType.includes('collaboration_adoption')) {
    return 'Increase visibility, add collaboration prompts, and showcase benefits'
  } else if (metricType.includes('trust_score')) {
    return 'Improve reliability, add user feedback loops, and enhance communication'
  } else if (metricType.includes('perceived_value')) {
    return 'Enhance features, gather user feedback, and prioritize value-add improvements'
  } else {
    return `Improve ${metricName} through user experience optimization`
  }
}

// Generate growth recommendations based on trends
function generateGrowthRecommendations(
  historicalUXMetrics: any[],
  historicalPerfMetrics: any[],
  confidenceThreshold: number
): any[] {
  const recommendations: any[] = []

  // Look for declining trends
  const decliningMetrics = findDecliningMetrics(historicalUXMetrics, historicalPerfMetrics)
  
  decliningMetrics.forEach(({ metricType, trend, confidence }) => {
    if (confidence >= confidenceThreshold) {
      recommendations.push({
        id: `growth_${metricType}_${Date.now()}`,
        priority: 'medium',
        category: 'growth',
        title: `Address declining ${metricType.replace(/_/g, ' ')}`,
        description: `${metricType.replace(/_/g, ' ')} has shown a ${trend} trend over the past 90 days`,
        action: `Implement targeted initiatives to reverse the ${trend} trend`,
        impact: 'medium',
        effort: 'medium',
        expectedImprovement: '15% improvement in 30 days',
        metrics: [metricType],
        confidence
      })
    }
  })

  return recommendations
}

// Generate maintenance recommendations
function generateMaintenanceRecommendations(
  currentUXMetrics: any[],
  currentPerfMetrics: any[],
  confidenceThreshold: number
): any[] {
  const recommendations: any[] = []

  // Look for stable but could be improved metrics
  const stableMetrics = findStableButImprovable(currentUXMetrics, currentPerfMetrics)
  
  stableMetrics.forEach(({ metricType, current, target, confidence }) => {
    if (confidence >= confidenceThreshold && current > target * 0.9) {
      recommendations.push({
        id: `maintenance_${metricType}_${Date.now()}`,
        priority: 'low',
        category: 'maintenance',
        title: `Optimize ${metricType.replace(/_/g, ' ')} further`,
        description: `${metricType.replace(/_/g, ' ')} is performing well but could be optimized for better results`,
        action: `Implement continuous improvement initiatives for ${metricType.replace(/_/g, ' ')}`,
        impact: 'low',
        effort: 'low',
        expectedImprovement: '5% additional improvement',
        metrics: [metricType],
        confidence
      })
    }
  })

  return recommendations
}

// Find metrics with declining trends
function findDecliningMetrics(historicalUXMetrics: any[], historicalPerfMetrics: any[]): any[] {
  const decliningMetrics: any[] = []
  
  // Check UX metrics for declining trends
  const uxMetricTypes = ['completion_rate', 'collaboration_adoption', 'trust_score', 'perceived_value']
  
  uxMetricTypes.forEach(metricType => {
    const metrics = historicalUXMetrics.filter(m => m.metric_type === metricType)
    if (metrics.length < 3) return
    
    const recent = metrics.slice(-3)
    const older = metrics.slice(-6, -3)
    
    const recentAvg = recent.reduce((sum, m) => sum + m.metric_value, 0) / recent.length
    const olderAvg = older.reduce((sum, m) => sum + m.metric_value, 0) / older.length
    
    if (recentAvg < olderAvg * 0.95) {
      decliningMetrics.push({
        metricType,
        trend: 'declining',
        confidence: 0.8
      })
    }
  })
  
  // Check performance metrics for declining trends
  const perfMetricTypes = ['dashboard_load_time', 'article_creation_time', 'comment_latency']
  
  perfMetricTypes.forEach(metricType => {
    const metrics = historicalPerfMetrics.filter(m => m.metric_type === metricType)
    if (metrics.length < 3) return
    
    const recent = metrics.slice(-3)
    const older = metrics.slice(-6, -3)
    
    const recentAvg = recent.reduce((sum, m) => sum + m.metric_value, 0) / recent.length
    const olderAvg = older.reduce((sum, m) => sum + m.metric_value, 0) / older.length
    
    // For performance metrics, increasing is bad (declining trend)
    if (recentAvg > olderAvg * 1.05) {
      decliningMetrics.push({
        metricType,
        trend: 'declining',
        confidence: 0.8
      })
    }
  })
  
  return decliningMetrics
}

// Find stable but improvable metrics
function findStableButImprovable(currentUXMetrics: any[], currentPerfMetrics: any[]): any[] {
  const stableMetrics: any[] = []
  
  // Check UX metrics
  const uxMetricTypes = ['completion_rate', 'collaboration_adoption', 'trust_score', 'perceived_value']
  
  uxMetricTypes.forEach(metricType => {
    const metrics = currentUXMetrics.filter(m => m.metric_type === metricType)
    if (metrics.length === 0) return
    
    const latest = metrics[metrics.length - 1]
    const target = latest.target_value
    const current = latest.metric_value
    
    if (current >= target * 0.9 && current < target * 1.1) {
      stableMetrics.push({
        metricType,
        current,
        target,
        confidence: 0.7
      })
    }
  })
  
  // Check performance metrics
  const perfMetricTypes = ['dashboard_load_time', 'article_creation_time', 'comment_latency']
  
  perfMetricTypes.forEach(metricType => {
    const metrics = currentPerfMetrics.filter(m => m.metric_type === metricType)
    if (metrics.length === 0) return
    
    const latest = metrics[metrics.length - 1]
    const target = latest.target_value
    const current = latest.metric_value
    
    // For performance metrics, stable means close to target
    if (current <= target * 1.1 && current >= target * 0.9) {
      stableMetrics.push({
        metricType,
        current,
        target,
        confidence: 0.7
      })
    }
  })
  
  return stableMetrics
}

// Calculate confidence based on historical data consistency
function calculateConfidence(historicalData: any[]): number {
  if (historicalData.length < 3) return 0.5
  
  const values = historicalData.map(m => m.metric_value)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const standardDeviation = Math.sqrt(variance)
  
  // Lower variance = higher confidence
  const coefficientOfVariation = standardDeviation / mean
  const confidence = Math.max(0.3, 1 - coefficientOfVariation)
  
  return Math.min(confidence, 0.95)
}

// Helper functions for filtering
function shouldIncludeImpact(impact: string, minImpactLevel: string): boolean {
  const impactLevels = ['low', 'medium', 'high']
  const minIndex = impactLevels.indexOf(minImpactLevel)
  const currentImpactIndex = impactLevels.indexOf(impact)
  return currentImpactIndex >= minIndex
}

function shouldIncludeEffort(effort: string, maxEffortLevel: string): boolean {
  const effortLevels = ['low', 'medium', 'high']
  const maxIndex = effortLevels.indexOf(maxEffortLevel)
  const currentEffortIndex = effortLevels.indexOf(effort)
  return currentEffortIndex <= maxIndex
}

// Generate insights based on recommendations
function generateInsights(recommendations: any[]): any[] {
  const insights = []
  
  // Look for high-priority recommendations
  const highPriorityRecs = recommendations.filter(r => r.priority === 'high')
  if (highPriorityRecs.length > 0) {
    insights.push({
      type: 'warning',
      message: `${highPriorityRecs.length} high-priority issues require immediate attention`,
      relatedRecommendations: highPriorityRecs.map(r => r.id)
    })
  }
  
  // Look for performance-related recommendations
  const perfRecs = recommendations.filter(r => r.category === 'performance')
  if (perfRecs.length > 2) {
    insights.push({
      type: 'opportunity',
      message: `Performance improvements could increase user satisfaction by ${perfRecs.length * 25}%`,
      relatedRecommendations: perfRecs.map(r => r.id)
    })
  }
  
  // Look for UX-related recommendations
  const uxRecs = recommendations.filter(r => r.category === 'ux')
  if (uxRecs.length > 1) {
    insights.push({
      type: 'opportunity',
      message: `UX improvements could increase user engagement by ${uxRecs.length * 20}%`,
      relatedRecommendations: uxRecs.map(r => r.id)
    })
  }
  
  return insights
}

// Calculate recommendation summary
function calculateRecommendationSummary(recommendations: any[]): any {
  const summary = {
    totalRecommendations: recommendations.length,
    highPriority: recommendations.filter(r => r.priority === 'high').length,
    mediumPriority: recommendations.filter(r => r.priority === 'medium').length,
    lowPriority: recommendations.filter(r => r.priority === 'low').length,
    categories: {} as Record<string, number>,
    avgConfidence: 0
  }
  
  // Count by category
  recommendations.forEach(rec => {
    summary.categories[rec.category] = (summary.categories[rec.category] || 0) + 1
  })
  
  // Calculate average confidence
  const totalConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0)
  summary.avgConfidence = recommendations.length > 0 ? totalConfidence / recommendations.length : 0
  
  return summary
}

// Implementation tracking endpoint
export async function POST_IMPLEMENT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, recommendationId } = body
    
    const supabase = await createClient()
    
    // Mark recommendation as implemented
    const { error } = await supabase
      .from('recommendations')
      .update({ 
        implemented: true, 
        implementationDate: new Date().toISOString() 
      })
      .eq('id', recommendationId)
      .eq('organization_id', orgId)
    
    if (error) {
      console.error('Implementation tracking error:', error)
      return NextResponse.json(
        { error: 'Failed to mark recommendation as implemented' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Implementation tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
