/**
 * UX Metrics Visualization Component
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 1.2: Implement UX metrics visualization components
 * 
 * Advanced visualization components for user experience metrics
 * including trend charts, comparisons, and distribution analysis.
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
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Target,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimplePieChart, SimpleLineChart } from './simple-chart'

// Types
export interface UXMetrics {
  completion_rate: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  collaboration_adoption: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  trust_score: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
  perceived_value: { value: number; target: number; trend: 'up' | 'down' | 'stable' }
}

export interface HistoricalDataPoint {
  week: string
  completion_rate: number
  collaboration_adoption: number
  trust_score: number
  perceived_value: number
}

interface UXMetricsVisualizationProps {
  currentMetrics: UXMetrics
  historicalData: HistoricalDataPoint[]
  loading?: boolean
  error?: string | null
  className?: string
}

const COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)']

export function UXMetricsVisualization({
  currentMetrics,
  historicalData,
  loading = false,
  error = null,
  className = ''
}: UXMetricsVisualizationProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('30d')

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
      case 'stable': return <Minus className="h-3 w-3 text-gray-600" />
      default: return <Minus className="h-3 w-3 text-gray-600" />
    }
  }

  // Format metric value
  const formatMetricValue = (key: string, value: number) => {
    switch (key) {
      case 'completion_rate':
      case 'collaboration_adoption':
        return `${value}%`
      case 'trust_score':
        return `${value}/5`
      case 'perceived_value':
        return `${value}/10`
      default:
        return value.toString()
    }
  }

  // Calculate insights
  const insights = useMemo(() => {
    const insightsList = []
    
    // Completion rate insights
    if (currentMetrics.completion_rate.value > currentMetrics.completion_rate.target) {
      insightsList.push({
        type: 'positive',
        message: `Completion rate (${formatMetricValue('completion_rate', currentMetrics.completion_rate.value)}) is above target (${formatMetricValue('completion_rate', currentMetrics.completion_rate.target)})`
      })
    } else if (currentMetrics.completion_rate.value < currentMetrics.completion_rate.target * 0.8) {
      insightsList.push({
        type: 'warning',
        message: `Completion rate needs improvement to reach target`
      })
    }

    // Collaboration adoption insights
    if (currentMetrics.collaboration_adoption.trend === 'up') {
      insightsList.push({
        type: 'positive',
        message: `Collaboration adoption is trending upward`
      })
    }

    // Trust score insights
    if (currentMetrics.trust_score.value >= 4.0) {
      insightsList.push({
        type: 'positive',
        message: `High user trust score indicates strong confidence`
      })
    }

    return insightsList
  }, [currentMetrics])

  // Prepare data for charts
  const lineChartData = useMemo(() => {
    return historicalData.map(point => ({
      week: point.week.split('-W')[1], // Extract week number
      'Completion Rate': point.completion_rate,
      'Collaboration Adoption': point.collaboration_adoption,
      'Trust Score': point.trust_score * 20, // Scale to 0-100 for better visualization
      'Perceived Value': point.perceived_value * 10 // Scale to 0-100 for better visualization
    }))
  }, [historicalData])

  const barChartData = useMemo(() => {
    return [
      { name: 'Completion Rate', current: currentMetrics.completion_rate.value, target: currentMetrics.completion_rate.target },
      { name: 'Collaboration', current: currentMetrics.collaboration_adoption.value, target: currentMetrics.collaboration_adoption.target },
      { name: 'Trust Score', current: currentMetrics.trust_score.value * 20, target: currentMetrics.trust_score.target * 20 },
      { name: 'Perceived Value', current: currentMetrics.perceived_value.value * 10, target: currentMetrics.perceived_value.target * 10 }
    ]
  }, [currentMetrics])

  const pieChartData = useMemo(() => {
    return [
      { name: 'Completion Rate', value: currentMetrics.completion_rate.value },
      { name: 'Collaboration', value: currentMetrics.collaboration_adoption.value },
      { name: 'Trust Score', value: currentMetrics.trust_score.value * 20 },
      { name: 'Perceived Value', value: currentMetrics.perceived_value.value * 10 }
    ]
  }, [currentMetrics])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">UX Metrics Visualization</h2>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div data-testid="ux-metrics-loading-skeleton" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="font-medium">Failed to load UX metrics</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">UX Metrics Visualization</h2>
            <p className="text-sm text-gray-600">
              Detailed analysis of user experience metrics and trends
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Metric Selector */}
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="completion_rate">Completion Rate</SelectItem>
              <SelectItem value="collaboration_adoption">Collaboration Adoption</SelectItem>
              <SelectItem value="trust_score">Trust Score</SelectItem>
              <SelectItem value="perceived_value">Perceived Value</SelectItem>
            </SelectContent>
          </Select>

          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" aria-label="Time range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(currentMetrics).map(([key, metric]) => (
          <Card key={key} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium capitalize">
                {key.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatMetricValue(key, metric.value)}
                  </span>
                  <div data-testid={`trend-indicator-${key}`}>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Target:</span>
                  <span>{formatMetricValue(key, metric.target)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full',
                      metric.value >= metric.target ? 'bg-green-500' : 
                      metric.value >= metric.target * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Historical Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Completion Rate" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Collaboration Adoption" stroke="var(--color-success)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Trust Score" stroke="var(--color-warning)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Perceived Value" stroke="var(--color-danger)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No historical data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current vs Target Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Current vs Target
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
                <Bar dataKey="current" fill="var(--color-primary)" name="Current" />
                <Bar dataKey="target" fill="var(--color-success)" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Metric Distribution and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Metric Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                  outerRadius={80}
                  fill="var(--color-info)"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={cn(
                    'flex items-start gap-2 p-3 rounded-lg border',
                    insight.type === 'positive' ? 'bg-green-50 border-green-200 text-green-800' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    'bg-red-50 border-red-200 text-red-800'
                  )}
                >
                  {insight.type === 'positive' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-gray-500 text-sm">
                  No insights available for the current metrics
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UXMetricsVisualization
