/**
 * Trend Analysis API Route
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 3.1: Implement trend analysis algorithms
 * 
 * Advanced trend analysis with pattern detection,
 * predictive forecasting, and anomaly identification.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request body schema
const requestSchema = z.object({
  orgId: z.string().uuid(),
  timePeriod: z.enum(['4weeks', '8weeks', '12weeks', '24weeks']),
  analysisMode: z.enum(['comprehensive', 'performance', 'ux']),
  selectedMetrics: z.object({
    completion_rate: z.boolean(),
    collaboration_adoption: z.boolean(),
    trust_score: z.boolean(),
    perceived_value: z.boolean(),
    dashboard_load_time: z.boolean(),
    article_creation_time: z.boolean(),
    comment_latency: z.boolean()
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, timePeriod, analysisMode, selectedMetrics } = requestSchema.parse(body)

    // Calculate date range based on time period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timePeriod) {
      case '4weeks':
        startDate.setDate(startDate.getDate() - 28)
        break
      case '8weeks':
        startDate.setDate(startDate.getDate() - 56)
        break
      case '12weeks':
        startDate.setDate(startDate.getDate() - 84)
        break
      case '24weeks':
        startDate.setDate(startDate.getDate() - 168)
        break
    }

    const supabase = await createClient()

    // Fetch historical data for trend analysis
    const { data: uxMetrics, error: uxError } = await supabase
      .from('user_experience_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (uxError) {
      console.error('UX Metrics fetch error:', uxError)
      return NextResponse.json(
        { error: 'Failed to fetch UX metrics for trend analysis' },
        { status: 500 }
      )
    }

    const { data: performanceMetrics, error: perfError } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('organization_id', orgId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true })

    if (perfError) {
      console.error('Performance Metrics fetch error:', perfError)
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics for trend analysis' },
        { status: 500 }
      )
    }

    // Perform trend analysis
    const trends = analyzeTrends(uxMetrics || [], performanceMetrics || [], selectedMetrics, analysisMode)
    const anomalies = detectAnomalies(uxMetrics || [], performanceMetrics || [], selectedMetrics)
    const correlations = calculateCorrelations(uxMetrics || [], performanceMetrics || [], selectedMetrics)

    const analysisData = {
      trends,
      anomalies,
      correlations
    }

    return NextResponse.json(analysisData)

  } catch (error) {
    console.error('Trend Analysis API error:', error)
    
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

// Analyze trends for metrics
function analyzeTrends(uxMetrics: any[], performanceMetrics: any[], selectedMetrics: any, analysisMode: string) {
  const trends = {
    uxMetrics: {} as Record<string, any>,
    performanceMetrics: {} as Record<string, any>
  }

  // Analyze UX metrics
  if (analysisMode === 'comprehensive' || analysisMode === 'ux') {
    const uxMetricTypes = ['completion_rate', 'collaboration_adoption', 'trust_score', 'perceived_value']
    
    uxMetricTypes.forEach(metricType => {
      if (selectedMetrics[metricType]) {
        const metricData = uxMetrics
          .filter(m => m.metric_type === metricType)
          .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        
        if (metricData.length >= 2) {
          trends.uxMetrics[metricType] = calculateTrend(metricData)
        }
      }
    })
  }

  // Analyze performance metrics
  if (analysisMode === 'comprehensive' || analysisMode === 'performance') {
    const perfMetricTypes = ['dashboard_load_time', 'article_creation_time', 'comment_latency']
    
    perfMetricTypes.forEach(metricType => {
      if (selectedMetrics[metricType]) {
        const metricData = performanceMetrics
          .filter(m => m.metric_type === metricType)
          .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        
        if (metricData.length >= 2) {
          trends.performanceMetrics[metricType] = calculateTrend(metricData)
        }
      }
    })
  }

  return trends
}

// Calculate trend for a single metric
function calculateTrend(metricData: any[]) {
  const values = metricData.map(m => m.metric_value)
  const firstValue = values[0]
  const lastValue = values[values.length - 1]
  
  // Calculate direction
  const change = lastValue - firstValue
  const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0
  
  let direction: 'up' | 'down' | 'stable'
  if (Math.abs(changePercent) < 2) {
    direction = 'stable'
  } else {
    // For performance metrics, lower is better
    const isPerformanceMetric = metricData[0].metric_type.includes('time') || metricData[0].metric_type.includes('latency')
    if (isPerformanceMetric) {
      direction = changePercent > 0 ? 'down' : 'up'
    } else {
      direction = changePercent > 0 ? 'up' : 'down'
    }
  }
  
  // Calculate strength
  let strength: 'weak' | 'moderate' | 'strong'
  if (Math.abs(changePercent) < 5) {
    strength = 'weak'
  } else if (Math.abs(changePercent) < 15) {
    strength = 'moderate'
  } else {
    strength = 'strong'
  }
  
  // Calculate confidence based on data consistency
  const confidence = calculateConfidence(values)
  
  // Calculate projection (next period)
  const projection = calculateProjection(values, direction, strength)
  
  return {
    direction,
    strength,
    confidence,
    projection
  }
}

// Calculate confidence level
function calculateConfidence(values: number[]): number {
  if (values.length < 3) return 0.5
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const standardDeviation = Math.sqrt(variance)
  
  // Lower variance = higher confidence
  const coefficientOfVariation = standardDeviation / mean
  const confidence = Math.max(0.3, 1 - coefficientOfVariation)
  
  return Math.min(confidence, 0.95)
}

// Calculate projection for next period
function calculateProjection(values: number[], direction: string, strength: string): number {
  const lastValue = values[values.length - 1]
  const avgChange = (values[values.length - 1] - values[0]) / (values.length - 1)
  
  let projection = lastValue + avgChange
  
  // Adjust based on strength
  const strengthMultiplier = strength === 'strong' ? 1.2 : strength === 'moderate' ? 1.0 : 0.8
  projection = lastValue + (avgChange * strengthMultiplier)
  
  // Ensure projection doesn't go negative for metrics that shouldn't
  return Math.max(0, projection)
}

// Detect anomalies in the data
function detectAnomalies(uxMetrics: any[], performanceMetrics: any[], selectedMetrics: any) {
  const anomalies = []
  
  // Combine all metrics for analysis
  const allMetrics = [...uxMetrics, ...performanceMetrics]
  
  // Group by metric type
  const groupedMetrics = allMetrics.reduce((acc: any, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = []
    }
    acc[metric.metric_type].push(metric)
    return acc
  }, {})
  
  // Check each metric type for anomalies
  Object.entries(groupedMetrics).forEach(([metricType, metrics]) => {
    if (!selectedMetrics[metricType]) return
    
    const values = metrics.map(m => m.metric_value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const standardDeviation = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
    
    // Look for values that are more than 2 standard deviations from mean
    metrics.forEach((metric: any, index: number) => {
      const zScore = Math.abs((metric.metric_value - mean) / standardDeviation)
      
      if (zScore > 2) {
        const weekNumber = Math.ceil((index + 1) / 7)
        let type: 'spike' | 'drop' | 'improvement' | 'degradation'
        
        if (metric.metric_type.includes('time') || metric.metric_type.includes('latency')) {
          type = metric.metric_value > mean ? 'degradation' : 'improvement'
        } else {
          type = metric.metric_value > mean ? 'spike' : 'drop'
        }
        
        anomalies.push({
          metric: metric.metric_type,
          week: `Week ${weekNumber}`,
          type,
          description: `${type === 'spike' ? 'Unusual increase' : type === 'drop' ? 'Unusual decrease' : type === 'improvement' ? 'Significant improvement' : 'Significant degradation'} in ${metric.metric_type.replace(/_/g, ' ')}`
        })
      }
    })
  })
  
  return anomalies
}

// Calculate correlations between metrics
function calculateCorrelations(uxMetrics: any[], performanceMetrics: any[], selectedMetrics: any) {
  const correlations = []
  
  // Create time-aligned dataset
  const timeSeriesData = alignTimeSeriesData(uxMetrics, performanceMetrics)
  
  // Calculate correlations between key metrics
  const metricPairs = [
    ['completion_rate', 'trust_score'],
    ['collaboration_adoption', 'perceived_value'],
    ['dashboard_load_time', 'user_satisfaction'],
    ['article_creation_time', 'completion_rate']
  ]
  
  metricPairs.forEach(([metric1, metric2]) => {
    if (selectedMetrics[metric1] && selectedMetrics[metric2]) {
      const correlation = calculateCorrelation(timeSeriesData, metric1, metric2)
      
      if (Math.abs(correlation) > 0.3) { // Only include meaningful correlations
        let significance: 'low' | 'medium' | 'high'
        
        if (Math.abs(correlation) > 0.7) {
          significance = 'high'
        } else if (Math.abs(correlation) > 0.5) {
          significance = 'medium'
        } else {
          significance = 'low'
        }
        
        correlations.push({
          metric1,
          metric2,
          correlation,
          significance
        })
      }
    }
  })
  
  return correlations
}

// Align time series data by date
function alignTimeSeriesData(uxMetrics: any[], performanceMetrics: any[]) {
  const allMetrics = [...uxMetrics, ...performanceMetrics]
  
  // Group by date
  const groupedByDate = allMetrics.reduce((acc: any, metric) => {
    const date = metric.recorded_at.split('T')[0]
    if (!acc[date]) {
      acc[date] = {}
    }
    acc[date][metric.metric_type] = metric.metric_value
    return acc
  }, {})
  
  return groupedByDate
}

// Calculate correlation between two metrics
function calculateCorrelation(data: any, metric1: string, metric2: string): number {
  const dates = Object.keys(data)
  const values1: number[] = []
  const values2: number[] = []
  
  dates.forEach(date => {
    if (data[date][metric1] !== undefined && data[date][metric2] !== undefined) {
      values1.push(data[date][metric1])
      values2.push(data[date][metric2])
    }
  })
  
  if (values1.length < 2) return 0
  
  // Calculate Pearson correlation coefficient
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length
  
  const numerator = values1.reduce((sum, val1, index) => {
    return sum + (val1 - mean1) * (values2[index] - mean2)
  }, 0)
  
  const denominator1 = Math.sqrt(values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0))
  const denominator2 = Math.sqrt(values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0))
  
  if (denominator1 === 0 || denominator2 === 0) return 0
  
  return numerator / (denominator1 * denominator2)
}
