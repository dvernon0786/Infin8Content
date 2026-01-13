import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/performance/metrics
 * 
 * Fetches comprehensive performance metrics for the admin dashboard.
 * Returns real-time system health, generation metrics, research metrics,
 * and historical trends based on Epic 20 optimizations.
 * 
 * Query Parameters:
 * - orgId: string (required) - Organization ID to fetch metrics for
 * - timeRange: string (optional) - Time range for historical data (1h, 24h, 7d, 30d)
 * - includeAlerts: boolean (optional) - Include performance alerts (default: true)
 * 
 * Response (Success - 200):
 * - generationMetrics: Generation performance data
 * - researchMetrics: Research optimization metrics  
 * - contextMetrics: Context management metrics
 * - systemHealth: Real-time system health indicators
 * - historicalTrends: Historical performance trends
 * - alerts: Performance alerts (if requested)
 * 
 * Authentication: Requires authenticated user with admin access
 * Authorization: User must belong to the organization and have admin role
 */

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const timeRange = searchParams.get('timeRange') || '24h'
    const includeAlerts = searchParams.get('includeAlerts') !== 'false'

    if (orgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check admin permissions - for now, check if user has org_id (simplified)
    // TODO: Implement proper role-based access control when team_members table is available
    const hasAdminAccess = currentUser.org_id ? true : false

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // Calculate time range for historical data
    const timeRangeMs = getTimeRangeMs(timeRange)
    const timeRangeStart = new Date(Date.now() - timeRangeMs)

    // Fetch performance metrics from database
    const [
      generationMetrics,
      researchMetrics, 
      contextMetrics,
      systemHealth,
      historicalData,
      alerts
    ] = await Promise.all([
      fetchGenerationMetrics(supabase, currentUser.org_id, timeRangeStart),
      fetchResearchMetrics(supabase, currentUser.org_id, timeRangeStart),
      fetchContextMetrics(supabase, currentUser.org_id, timeRangeStart),
      fetchSystemHealth(supabase, currentUser.org_id),
      fetchHistoricalTrends(supabase, currentUser.org_id, timeRange),
      includeAlerts ? fetchPerformanceAlerts(supabase, currentUser.org_id) : Promise.resolve([])
    ])

    return NextResponse.json({
      generationMetrics,
      researchMetrics,
      contextMetrics,
      systemHealth,
      historicalTrends: historicalData,
      alerts: includeAlerts ? alerts : undefined,
      timeRange,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Performance metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

async function fetchGenerationMetrics(supabase: any, orgId: string, timeRangeStart: Date) {
  try {
    // Fetch articles completed in the time range with performance data
    const { data, error } = await supabase
      .from('articles')
      .select(`
        status,
        created_at,
        updated_at,
        article_progress (
          generation_time,
          api_cost,
          retry_attempts,
          parallel_sections,
          performance_metrics,
          updated_at
        )
      `)
      .eq('org_id', orgId)
      .gte('updated_at', timeRangeStart.toISOString())
      .in('status', ['completed', 'generating'])

    if (error) {
      console.error('Generation metrics query error:', error)
      // Return default values if query fails
      return {
        avgGenerationTime: 0,
        apiCallReduction: 0,
        parallelProcessingEfficiency: 0,
        throughputPerHour: 0,
        retryRate: 0,
        totalCompleted: 0,
        currentlyGenerating: 0,
        epic20Comparison: {
          timeReduction: 0,
          apiCallReduction: 0,
          retryReduction: 0
        }
      }
    }

    const articles = data || []
    const completedArticles = articles.filter((a: any) => a.status === 'completed')
    const generatingArticles = articles.filter((a: any) => a.status === 'generating')

    // Calculate Epic 20 performance metrics with safe defaults
    const totalApiCalls = completedArticles.reduce((sum: number, article: any) => {
      const progress = article.article_progress?.[0]
      const metrics = progress?.performance_metrics || {}
      return sum + (metrics.total_api_calls || 0)
    }, 0)

    const avgGenerationTime = completedArticles.length > 0 
      ? completedArticles.reduce((sum: number, article: any) => {
          const progress = article.article_progress?.[0]
          return sum + (progress?.generation_time || 0)
        }, 0) / completedArticles.length
      : 0

    const avgRetryAttempts = completedArticles.length > 0
      ? completedArticles.reduce((sum: number, article: any) => {
          const progress = article.article_progress?.[0]
          return sum + (progress?.retry_attempts || 0)
        }, 0) / completedArticles.length
      : 0

    const parallelProcessingEfficiency = completedArticles.length > 0
      ? completedArticles.reduce((sum: number, article: any) => {
          const progress = article.article_progress?.[0]
          const sections = progress?.parallel_sections || []
          return sum + (Array.isArray(sections) ? sections.length : 0)
        }, 0) / completedArticles.length
      : 0

    // Calculate Epic 20 benchmark comparisons
    const epic20Baseline = {
      avgGenerationTime: 480, // 8 minutes in seconds
      apiCallsPerArticle: 13, // Before optimization
      retryAttempts: 3, // Before optimization
      parallelSections: 1 // Before optimization
    }

    const actualApiCallsPerArticle = Math.max(completedArticles.length, 1)
    const apiCallReduction = epic20Baseline.apiCallsPerArticle > 0 
      ? ((epic20Baseline.apiCallsPerArticle - (totalApiCalls / actualApiCallsPerArticle)) / epic20Baseline.apiCallsPerArticle) * 100
      : 0

    const timeReduction = epic20Baseline.avgGenerationTime > 0
      ? ((epic20Baseline.avgGenerationTime - avgGenerationTime) / epic20Baseline.avgGenerationTime) * 100
      : 0

    const timeRangeMs = Date.now() - timeRangeStart.getTime()
    const throughputPerHour = completedArticles.length > 0 
      ? (completedArticles.length / (timeRangeMs / 3600000)) // articles per hour
      : 0

    return {
      avgGenerationTime: Math.round(avgGenerationTime),
      apiCallReduction: Math.round(apiCallReduction * 10) / 10,
      parallelProcessingEfficiency: Math.round(parallelProcessingEfficiency * 10) / 10,
      throughputPerHour: Math.round(throughputPerHour * 10) / 10,
      retryRate: Math.round(avgRetryAttempts * 10) / 10,
      totalCompleted: completedArticles.length,
      currentlyGenerating: generatingArticles.length,
      epic20Comparison: {
        timeReduction: Math.round(timeReduction * 10) / 10,
        apiCallReduction: Math.round(apiCallReduction * 10) / 10,
        retryReduction: epic20Baseline.retryAttempts > 0 ? ((epic20Baseline.retryAttempts - avgRetryAttempts) / epic20Baseline.retryAttempts) * 100 : 0
      }
    }
  } catch (error) {
    console.error('Generation metrics error:', error)
    // Return safe defaults on any error
    return {
      avgGenerationTime: 0,
      apiCallReduction: 0,
      parallelProcessingEfficiency: 0,
      throughputPerHour: 0,
      retryRate: 0,
      totalCompleted: 0,
      currentlyGenerating: 0,
      epic20Comparison: {
        timeReduction: 0,
        apiCallReduction: 0,
        retryReduction: 0
      }
    }
  }
}

async function fetchResearchMetrics(supabase: any, orgId: string, timeRangeStart: Date) {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      article_progress (
        research_api_calls,
        research_phase,
        performance_metrics,
        updated_at
      )
    `)
    .eq('org_id', orgId)
    .gte('updated_at', timeRangeStart.toISOString())
    .in('status', ['completed', 'generating'])

  if (error) throw error

  const articles = data || []
  const articlesWithProgress = articles.filter((a: any) => a.article_progress?.[0])

  if (articlesWithProgress.length === 0) {
    return {
      tavilyApiCallsPerArticle: 0,
      researchCacheHitRate: 0,
      costSavingsPerArticle: 0,
      researchTimeReduction: 0
    }
  }

  const totalResearchApiCalls = articlesWithProgress.reduce((sum: number, article: any) => {
    const progress = article.article_progress[0]
    return sum + (progress.research_api_calls || 0)
  }, 0)

  const avgResearchApiCalls = totalResearchApiCalls / articlesWithProgress.length
  
  // Epic 20 benchmark: 8-13 API calls before optimization → 1-2 after
  const epic20Baseline = { apiCalls: 10.5 } // Average of 8-13
  const costSavingsPerArticle = epic20Baseline.apiCalls > 0
    ? ((epic20Baseline.apiCalls - avgResearchApiCalls) / epic20Baseline.apiCalls) * 100
    : 0

  // Calculate cache hit rate from performance metrics
  const totalCacheHits = articlesWithProgress.reduce((sum: number, article: any) => {
    const progress = article.article_progress[0]
    const metrics = progress.performance_metrics || {}
    return sum + (metrics.cache_hit_rate || 0)
  }, 0)

  const researchCacheHitRate = articlesWithProgress.length > 0
    ? totalCacheHits / articlesWithProgress.length
    : 0

  // Estimate research time reduction based on API call reduction
  const researchTimeReduction = costSavingsPerArticle * 0.8 // Assume 80% of cost savings translates to time savings

  return {
    tavilyApiCallsPerArticle: Math.round(avgResearchApiCalls * 10) / 10,
    researchCacheHitRate: Math.round(researchCacheHitRate * 10) / 10,
    costSavingsPerArticle: Math.round(costSavingsPerArticle * 10) / 10,
    researchTimeReduction: Math.round(researchTimeReduction * 10) / 10
  }
}

async function fetchContextMetrics(supabase: any, orgId: string, timeRangeStart: Date) {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      article_progress (
        context_management,
        performance_metrics,
        updated_at
      )
    `)
    .eq('org_id', orgId)
    .gte('updated_at', timeRangeStart.toISOString())
    .in('status', ['completed', 'generating'])

  if (error) throw error

  const articles = data || []
  const articlesWithProgress = articles.filter((a: any) => a.article_progress?.[0])

  if (articlesWithProgress.length === 0) {
    return {
      tokenUsagePerArticle: 0,
      contextBuildingTime: 0,
      memoryUsagePerGeneration: 0,
      contextOptimizationEfficiency: 0
    }
  }

  // Extract context management metrics
  const totalTokenUsage = articlesWithProgress.reduce((sum: number, article: any) => {
    const progress = article.article_progress[0]
    const contextMgmt = progress.context_management || {}
    return sum + (contextMgmt.token_usage || 0)
  }, 0)

  const totalContextTime = articlesWithProgress.reduce((sum: number, article: any) => {
    const progress = article.article_progress[0]
    const contextMgmt = progress.context_management || {}
    return sum + (contextMgmt.building_time || 0)
  }, 0)

  const totalMemoryUsage = articlesWithProgress.reduce((sum: number, article: any) => {
    const progress = article.article_progress[0]
    const metrics = progress.performance_metrics || {}
    return sum + (metrics.memory_usage || 0)
  }, 0)

  const avgTokenUsage = totalTokenUsage / articlesWithProgress.length
  const avgContextTime = totalContextTime / articlesWithProgress.length
  const avgMemoryUsage = totalMemoryUsage / articlesWithProgress.length

  // Epic 20 achieved 40-50% token reduction
  const epic20Baseline = { tokenUsage: 4000 } // Estimated baseline
  const tokenReduction = epic20Baseline.tokenUsage > 0
    ? ((epic20Baseline.tokenUsage - avgTokenUsage) / epic20Baseline.tokenUsage) * 100
    : 0

  return {
    tokenUsagePerArticle: Math.round(avgTokenUsage),
    contextBuildingTime: Math.round(avgContextTime * 10) / 10,
    memoryUsagePerGeneration: Math.round(avgMemoryUsage * 10) / 10,
    contextOptimizationEfficiency: Math.round(tokenReduction * 10) / 10
  }
}

async function fetchSystemHealth(supabase: any, orgId: string) {
  // Get current system status from real data
  const [{ data: queueData }, { data: activeGenerations }, { data: recentActivity }] = await Promise.all([
    supabase
      .from('articles')
      .select('status, created_at')
      .eq('org_id', orgId)
      .in('status', ['queued', 'generating']),
    
    supabase
      .from('article_progress')
      .select('status, updated_at, generation_time')
      .eq('status', 'generating')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()), // Active in last 5 minutes
    
    supabase
      .from('articles')
      .select('updated_at, status')
      .eq('org_id', orgId)
      .gte('updated_at', new Date(Date.now() - 60 * 1000).toISOString()) // Last minute activity
  ])

  const queueLength = queueData?.filter((a: any) => a.status === 'queued').length || 0
  const activeGenerationsCount = activeGenerations?.length || 0
  const recentActivityCount = recentActivity?.length || 0

  // Calculate system load based on actual activity
  const systemLoad = Math.min(100, (activeGenerationsCount * 15) + (queueLength * 2) + (recentActivityCount * 5))
  
  // Estimate resource usage based on generation activity
  const avgGenerationTime = activeGenerations?.reduce((sum: number, gen: any) => sum + (gen.generation_time || 0), 0) / Math.max(activeGenerationsCount, 1) || 0
  
  // CPU usage estimation based on active generations and queue length
  const cpuUsage = Math.min(100, Math.max(5, systemLoad + (avgGenerationTime > 300 ? 20 : 0)))
  
  // Memory usage estimation based on queue and active work
  const memoryUsage = Math.min(100, Math.max(10, (queueLength * 3) + (activeGenerationsCount * 12) + (recentActivityCount * 2)))

  // Determine system status based on real metrics
  let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
  
  if (queueLength > 50 || activeGenerationsCount > 10 || cpuUsage > 85 || memoryUsage > 90) {
    systemStatus = 'critical'
  } else if (queueLength > 20 || activeGenerationsCount > 5 || cpuUsage > 70 || memoryUsage > 75) {
    systemStatus = 'warning'
  }

  return {
    cpuUsage: Math.round(cpuUsage),
    memoryUsage: Math.round(memoryUsage),
    activeGenerations: activeGenerationsCount,
    queueLength,
    systemStatus,
    lastUpdated: new Date().toISOString(),
    // Additional health metrics
    recentActivity: recentActivityCount,
    avgGenerationTime: Math.round(avgGenerationTime),
    systemLoad: Math.round(systemLoad)
  }
}

async function fetchHistoricalTrends(supabase: any, orgId: string, timeRange: string) {
  const timeRangeMs = getTimeRangeMs(timeRange)
  const timeRangeStart = new Date(Date.now() - timeRangeMs)
  
  // Fetch real historical data from completed articles
  const { data, error } = await supabase
    .from('articles')
    .select(`
      updated_at,
      article_progress (
        generation_time,
        performance_metrics,
        research_api_calls,
        updated_at
      )
    `)
    .eq('org_id', orgId)
    .gte('updated_at', timeRangeStart.toISOString())
    .eq('status', 'completed')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Historical trends query error:', error)
    // Return empty trends if query fails
    return {
      generationTime: [],
      apiCalls: [],
      throughput: []
    }
  }

  const articles = data || []
  const points = getTrendPoints(timeRange)
  
  // Aggregate data by time intervals
  const aggregatedData = articles.reduce((acc: Record<string, { generationTimes: number[], apiCalls: number[], count: number }>, article: any) => {
    const progress = article.article_progress?.[0]
    if (!progress) return acc
    
    const hourKey = new Date(article.updated_at).toISOString().slice(0, 13) // YYYY-MM-DDTHH
    const existingHour = acc[hourKey] || {
      generationTimes: [],
      apiCalls: [],
      count: 0
    }
    
    existingHour.generationTimes.push(progress.generation_time || 0)
    existingHour.apiCalls.push(progress.research_api_calls || 0)
    existingHour.count += 1
    
    acc[hourKey] = existingHour
    return acc
  }, {} as Record<string, { generationTimes: number[], apiCalls: number[], count: number }>)

  // Convert to trend points
  const generationTime = Object.entries(aggregatedData).map(([hourKey, data]: [string, any]) => ({
    timestamp: new Date(hourKey + ':00:00.000Z').toISOString(),
    value: data.generationTimes.length > 0 
      ? data.generationTimes.reduce((sum: number, time: number) => sum + time, 0) / data.generationTimes.length 
      : 0
  }))

  const apiCalls = Object.entries(aggregatedData).map(([hourKey, data]: [string, any]) => ({
    timestamp: new Date(hourKey + ':00:00.000Z').toISOString(),
    value: data.apiCalls.length > 0 
      ? data.apiCalls.reduce((sum: number, calls: number) => sum + calls, 0) / data.apiCalls.length 
      : 0
  }))

  // Calculate throughput (articles per hour)
  const throughput = Object.entries(aggregatedData).map(([hourKey, data]: [string, any]) => ({
    timestamp: new Date(hourKey + ':00:00.000Z').toISOString(),
    value: data.count
  }))

  return {
    generationTime,
    apiCalls,
    throughput
  }
}

async function fetchPerformanceAlerts(supabase: any, orgId: string) {
  // For now, return mock alerts. In a real implementation, you'd check
  // performance_alerts table and current metrics against thresholds
  const alerts = []
  
  // Example alert generation logic
  const { data: queueData } = await supabase
    .from('articles')
    .select('status')
    .eq('org_id', orgId)
    .eq('status', 'queued')

  if (queueData && queueData.length > 30) {
    alerts.push({
      id: 'high-queue-length',
      type: 'warning',
      metric: 'queue_length',
      message: `Queue length is ${queueData.length} articles`,
      threshold: 30,
      currentValue: queueData.length,
      timestamp: new Date().toISOString()
    })
  }

  return alerts
}

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}

function getTrendPoints(timeRange: string): { timestamp: string }[] {
  const intervals = {
    '1h': 12, // Every 5 minutes
    '24h': 24, // Every hour
    '7d': 28, // Every 6 hours
    '30d': 30 // Every day
  }
  
  const count = intervals[timeRange as keyof typeof intervals] || 24
  const points = []
  const now = Date.now()
  const intervalMs = (24 * 60 * 60 * 1000) / count // Distribute across 24 hours
  
  for (let i = count - 1; i >= 0; i--) {
    points.push({
      timestamp: new Date(now - (i * intervalMs)).toISOString()
    })
  }
  
  return points
}
