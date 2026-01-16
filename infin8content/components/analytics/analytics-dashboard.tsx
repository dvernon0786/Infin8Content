/**
 * Analytics Dashboard Component
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.1: Design dashboard layout with metric cards
 * 
 * Comprehensive analytics dashboard displaying user experience metrics,
 * performance metrics, insights, and recommendations.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  BarChart3,
  Lightbulb,
  Target,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Types for analytics data
export interface UXMetrics {
  completion_rate: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  collaboration_adoption: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  trust_score: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  perceived_value: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
}

export interface PerformanceMetrics {
  dashboard_load_time: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  article_creation_time: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  comment_latency: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
}

export interface Insight {
  type: 'positive' | 'warning' | 'critical'
  message: string
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
}

export interface AnalyticsData {
  uxMetrics: UXMetrics
  performanceMetrics: PerformanceMetrics
  insights: Insight[]
  recommendations: Recommendation[]
  lastUpdated: string
}

interface AnalyticsDashboardProps {
  orgId: string
  refreshInterval?: number
  className?: string
}

export function AnalyticsDashboard({ 
  orgId, 
  refreshInterval = 30000,
  className = ''
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  // Initialize Supabase client
  useEffect(() => {
    const client = createClient()
    setSupabase(client)
  }, [])

  // Real-time subscription handler
  const handleRealtimeUpdate = useCallback((payload: any) => {
    fetchAnalyticsData()
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!supabase || !orgId) return

    const channel = supabase
      .channel('analytics-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_experience_metrics',
          filter: `organization_id=eq.${orgId}`
        },
        handleRealtimeUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_metrics',
          filter: `organization_id=eq.${orgId}`
        },
        handleRealtimeUpdate
      )
      .subscribe((status: any) => {
        setRealtimeConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
      setRealtimeConnected(false)
    }
  }, [supabase, orgId, handleRealtimeUpdate])

  // Fetch analytics data
  const fetchAnalyticsData = async (selectedTimeRange?: string) => {
    try {
      setError(null)
      const range = selectedTimeRange || timeRange
      
      // Fetch analytics data from API
      const response = await fetch(
        `/api/analytics/metrics?orgId=${orgId}&timeRange=${range}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAnalyticsData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAnalyticsData()
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [orgId, refreshInterval])

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange)
    setLoading(true)
    fetchAnalyticsData(newTimeRange)
  }

  // Manual refresh
  const handleManualRefresh = () => {
    setIsRefreshing(true)
    fetchAnalyticsData()
  }

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
      case 'stable': return <Minus className="h-3 w-3 text-gray-600" />
      default: return <Minus className="h-3 w-3 text-gray-600" />
    }
  }

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'text-green-700 bg-green-100 border-green-200'
      case 'warning': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'critical': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  // Get recommendation priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div data-testid="analytics-loading-skeleton" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="font-medium">Failed to load analytics data</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
          <Button 
            onClick={() => fetchAnalyticsData()} 
            variant="outline" 
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">
              User experience and performance metrics insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time Connection Status */}
          <Badge className={cn(
            'text-xs',
            realtimeConnected 
              ? 'text-green-600 bg-green-100' 
              : 'text-gray-600 bg-gray-100'
          )}>
            {realtimeConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Polling
              </>
            )}
          </Badge>
          
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Manual Refresh */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            aria-label="refresh"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Experience Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              User Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Completion Rate</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.uxMetrics.completion_rate.value}%</span>
                  <div data-testid="trend-indicator-completion_rate">
                    {getTrendIcon(data.uxMetrics.completion_rate.trend)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Collaboration</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.uxMetrics.collaboration_adoption.value}%</span>
                  <div data-testid="trend-indicator-collaboration_adoption">
                    {getTrendIcon(data.uxMetrics.collaboration_adoption.trend)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Trust Score</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.uxMetrics.trust_score.value}/5</span>
                  <div data-testid="trend-indicator-trust_score">
                    {getTrendIcon(data.uxMetrics.trust_score.trend)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Perceived Value</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.uxMetrics.perceived_value.value}/10</span>
                  <div data-testid="trend-indicator-perceived_value">
                    {getTrendIcon(data.uxMetrics.perceived_value.trend)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Dashboard Load</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.performanceMetrics.dashboard_load_time.value}s</span>
                  <div data-testid="trend-indicator-dashboard_load_time">
                    {getTrendIcon(data.performanceMetrics.dashboard_load_time.trend)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Article Creation</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.performanceMetrics.article_creation_time.value}s</span>
                  <div data-testid="trend-indicator-article_creation_time">
                    {getTrendIcon(data.performanceMetrics.article_creation_time.trend)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Comment Latency</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{data.performanceMetrics.comment_latency.value}s</span>
                  <div data-testid="trend-indicator-comment_latency">
                    {getTrendIcon(data.performanceMetrics.comment_latency.trend)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.insights.slice(0, 3).map((insight, index) => (
                <div 
                  key={index} 
                  className={cn(
                    'text-xs p-2 rounded border',
                    getInsightColor(insight.type)
                  )}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.recommendations.slice(0, 3).map((rec, index) => (
                <div 
                  key={index} 
                  className={cn(
                    'text-xs p-2 rounded border',
                    getPriorityColor(rec.priority)
                  )}
                >
                  {rec.action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <div>
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-4">
          <div>Auto-refresh: {refreshInterval / 1000}s</div>
          <div>Time range: {timeRange}</div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
