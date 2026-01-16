/**
 * Performance Metrics Display Component
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.3: Add technical performance metrics display
 * 
 * Advanced visualization components for technical performance metrics
 * including response times, throughput, and system health indicators.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive,
  Wifi,
  Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts'

// Types
export interface PerformanceMetrics {
  dashboard_load_time: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  article_creation_time: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  comment_latency: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
}

export interface PerformanceHistoricalDataPoint {
  timestamp: string
  dashboard_load_time: number
  article_creation_time: number
  comment_latency: number
}

interface PerformanceMetricsDisplayProps {
  currentMetrics: PerformanceMetrics
  historicalData: PerformanceHistoricalDataPoint[]
  loading?: boolean
  error?: string | null
  className?: string
}

const PERFORMANCE_COLORS = {
  optimal: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  dashboard_load_time: '#3b82f6',
  article_creation_time: '#8b5cf6',
  comment_latency: '#06b6d4'
}

export function PerformanceMetricsDisplay({
  currentMetrics,
  historicalData,
  loading = false,
  error = null,
  className = ''
}: PerformanceMetricsDisplayProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('1h')

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-600" />
      case 'down': return <TrendingDown className="h-3 w-3 text-green-600" />
      case 'stable': return <Minus className="h-3 w-3 text-gray-600" />
      default: return <Minus className="h-3 w-3 text-gray-600" />
    }
  }

  // Get performance status
  const getPerformanceStatus = () => {
    const metrics = Object.values(currentMetrics)
    const aboveTargetCount = metrics.filter(m => m.value > m.target).length
    const criticalCount = metrics.filter(m => m.value > m.target * 1.5).length
    
    if (criticalCount > 0) return { status: 'critical', label: 'Critical', color: 'text-red-600 bg-red-100' }
    if (aboveTargetCount > 1) return { status: 'warning', label: 'Needs Attention', color: 'text-yellow-600 bg-yellow-100' }
    return { status: 'optimal', label: 'Optimal', color: 'text-green-600 bg-green-100' }
  }

  // Calculate performance score
  const performanceScore = useMemo(() => {
    const metrics = Object.values(currentMetrics)
    const totalScore = metrics.reduce((score, metric) => {
      const ratio = metric.value / metric.target
      if (ratio <= 1) return score + 100 // Perfect score
      if (ratio <= 1.2) return score + 80 // Good
      if (ratio <= 1.5) return score + 60 // Warning
      return score + 40 // Critical
    }, 0)
    return Math.round(totalScore / metrics.length)
  }, [currentMetrics])

  // Generate performance recommendations
  const recommendations = useMemo(() => {
    const recs = []
    
    Object.entries(currentMetrics).forEach(([key, metric]) => {
      if (metric.value > metric.target * 1.5) {
        recs.push({
          priority: 'high',
          metric: key.replace(/_/g, ' '),
          action: `Urgent optimization required for ${key.replace(/_/g, ' ')}`
        })
      } else if (metric.value > metric.target) {
        recs.push({
          priority: 'medium',
          metric: key.replace(/_/g, ' '),
          action: `Consider optimizing ${key.replace(/_/g, ' ')} to meet target`
        })
      }
    })

    if (recs.length === 0) {
      recs.push({
        priority: 'low',
        metric: 'general',
        action: 'All performance metrics are within target ranges'
      })
    }

    return recs
  }, [currentMetrics])

  // Prepare data for charts
  const lineChartData = useMemo(() => {
    return historicalData.map((point, index) => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'Dashboard Load': point.dashboard_load_time,
      'Article Creation': point.article_creation_time,
      'Comment Latency': point.comment_latency
    }))
  }, [historicalData])

  const areaChartData = useMemo(() => {
    return historicalData.map(point => ({
      timestamp: new Date(point.timestamp).toLocaleTimeString(),
      dashboard_load_time: point.dashboard_load_time * 100, // Scale for better visualization
      article_creation_time: point.article_creation_time * 100,
      comment_latency: point.comment_latency * 100
    }))
  }, [historicalData])

  const barChartData = useMemo(() => {
    return [
      { 
        name: 'Dashboard Load', 
        current: currentMetrics.dashboard_load_time.value, 
        target: currentMetrics.dashboard_load_time.target,
        unit: 's'
      },
      { 
        name: 'Article Creation', 
        current: currentMetrics.article_creation_time.value, 
        target: currentMetrics.article_creation_time.target,
        unit: 's'
      },
      { 
        name: 'Comment Latency', 
        current: currentMetrics.comment_latency.value, 
        target: currentMetrics.comment_latency.target,
        unit: 's'
      }
    ]
  }, [currentMetrics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Performance Metrics</h2>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div data-testid="performance-loading-skeleton" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
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
              <div className="font-medium">Failed to load performance metrics</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const performanceStatus = getPerformanceStatus()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gauge className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Performance Metrics</h2>
            <p className="text-sm text-gray-600">
              Technical performance monitoring and optimization insights
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Performance Status Badge */}
          <Badge className={cn('text-xs', performanceStatus.color)}>
            {performanceStatus.label}
          </Badge>

          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" aria-label="Time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>

          {/* Metric Filter */}
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="dashboard_load_time">Dashboard Load</SelectItem>
              <SelectItem value="article_creation_time">Article Creation</SelectItem>
              <SelectItem value="comment_latency">Comment Latency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Score and Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <p className="text-3xl font-bold text-blue-600">{performanceScore}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-lg font-semibold text-green-600">{performanceStatus.label}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                {performanceStatus.status === 'optimal' && <CheckCircle className="h-6 w-6 text-green-600" />}
                {performanceStatus.status === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                {performanceStatus.status === 'critical' && <AlertTriangle className="h-6 w-6 text-red-600" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-lg font-semibold text-purple-600">
                  {(
                    (currentMetrics.dashboard_load_time.value + 
                     currentMetrics.article_creation_time.value + 
                     currentMetrics.comment_latency.value) / 3
                  ).toFixed(2)}s
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(currentMetrics).map(([key, metric]) => (
          <Card key={key} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {key === 'dashboard_load_time' && <Zap className="h-4 w-4" />}
                {key === 'article_creation_time' && <HardDrive className="h-4 w-4" />}
                {key === 'comment_latency' && <Wifi className="h-4 w-4" />}
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {metric.value.toFixed(1)}s
                  </span>
                  <div data-testid={`trend-indicator-${key}`}>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Target:</span>
                  <span>{metric.target.toFixed(1)}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      metric.value <= metric.target ? 'bg-green-500' : 
                      metric.value <= metric.target * 1.2 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 150)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {metric.value <= metric.target ? 'Within target' :
                   metric.value <= metric.target * 1.2 ? 'Slightly above target' :
                   'Significantly above target'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Dashboard Load" 
                    stroke={PERFORMANCE_COLORS.dashboard_load_time} 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Article Creation" 
                    stroke={PERFORMANCE_COLORS.article_creation_time} 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Comment Latency" 
                    stroke={PERFORMANCE_COLORS.comment_latency} 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No historical data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="dashboard_load_time" 
                    stackId="1"
                    stroke={PERFORMANCE_COLORS.dashboard_load_time} 
                    fill={PERFORMANCE_COLORS.dashboard_load_time}
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="article_creation_time" 
                    stackId="1"
                    stroke={PERFORMANCE_COLORS.article_creation_time} 
                    fill={PERFORMANCE_COLORS.article_creation_time}
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="comment_latency" 
                    stackId="1"
                    stroke={PERFORMANCE_COLORS.comment_latency} 
                    fill={PERFORMANCE_COLORS.comment_latency}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No historical data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
                <Bar dataKey="target" fill="#10b981" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={cn(
                    'flex items-start gap-2 p-3 rounded-lg border',
                    rec.priority === 'high' ? 'bg-red-50 border-red-200 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    'bg-green-50 border-green-200 text-green-800'
                  )}
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{rec.metric}</p>
                    <p className="text-xs mt-1">{rec.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      {performanceStatus.status !== 'optimal' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-medium">Performance degradation detected</div>
                <div className="text-sm text-orange-600">
                  One or more performance metrics are above target thresholds. Consider implementing the recommendations above.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PerformanceMetricsDisplay
