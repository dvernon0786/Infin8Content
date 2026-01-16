/**
 * Recommendation Engine Component
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 3.2: Create recommendation engine based on metrics
 * 
 * AI-powered recommendation engine that analyzes metrics,
 * trends, and patterns to generate actionable insights.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Clock,
  Filter,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Eye,
  Star,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface Recommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: 'performance' | 'ux' | 'maintenance' | 'growth'
  title: string
  description: string
  action: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  expectedImprovement: string
  metrics: string[]
  confidence: number
  implemented?: boolean
  implementationDate?: string
  actualImprovement?: string
}

export interface RecommendationData {
  recommendations: Recommendation[]
  insights: Array<{
    type: 'opportunity' | 'warning' | 'success'
    message: string
    relatedRecommendations: string[]
  }>
  summary: {
    totalRecommendations: number
    highPriority: number
    mediumPriority: number
    lowPriority: number
    categories: Record<string, number>
    avgConfidence: number
  }
}

interface RecommendationEngineProps {
  orgId: string
  className?: string
}

export function RecommendationEngine({ orgId, className = '' }: RecommendationEngineProps) {
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [implementedFilter, setImplementedFilter] = useState<string>('all')
  
  // Settings
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7)
  const [minImpactLevel, setMinImpactLevel] = useState('low')
  const [maxEffortLevel, setMaxEffortLevel] = useState('high')

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analytics/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          confidenceThreshold,
          minImpactLevel,
          maxEffortLevel
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }
      
      const data = await response.json()
      setRecommendationData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [orgId, confidenceThreshold, minImpactLevel, maxEffortLevel])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Filter recommendations
  const filteredRecommendations = recommendationData?.recommendations.filter(rec => {
    if (priorityFilter !== 'all' && rec.priority !== priorityFilter) return false
    if (categoryFilter !== 'all' && rec.category !== categoryFilter) return false
    if (implementedFilter !== 'all' && rec.implemented?.toString() !== implementedFilter) return false
    return true
  }) || []

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-purple-600 bg-purple-100'
      case 'medium': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get effort color
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-indigo-600 bg-indigo-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4" />
      case 'ux': return <Eye className="h-4 w-4" />
      case 'maintenance': return <Settings className="h-4 w-4" />
      case 'growth': return <TrendingUp className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  // Mark recommendation as implemented
  const markAsImplemented = async (recommendationId: string) => {
    try {
      const response = await fetch('/api/analytics/recommendations/implement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, recommendationId })
      })
      
      if (!response.ok) throw new Error('Failed to mark as implemented')
      
      // Refresh recommendations
      fetchRecommendations()
    } catch (err) {
      // Implementation error handled silently
    }
  }

  // Export recommendations
  const exportRecommendations = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`/api/analytics/export/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationData, orgId, format })
      })
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recommendations-${format}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      // Export error handled silently
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recommendation Engine</h2>
          <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        </div>
        <div data-testid="recommendation-loading-skeleton" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="font-medium">Failed to generate recommendations</div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
          </div>
          <Button 
            onClick={fetchRecommendations}
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Recommendation Engine</h2>
            <p className="text-sm text-gray-600">
              AI-powered insights and actionable recommendations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={fetchRecommendations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Recommendations
          </Button>
          <Button onClick={() => exportRecommendations('pdf')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => exportRecommendations('csv')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="ux">UX</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select value={implementedFilter} onValueChange={setImplementedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Implementation status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Implemented</SelectItem>
              <SelectItem value="false">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Recommendation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{recommendationData?.summary.totalRecommendations || 0}</div>
              <div className="text-sm text-gray-600">Total recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{recommendationData?.summary.highPriority || 0}</div>
              <div className="text-sm text-gray-600">High priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{recommendationData?.summary.mediumPriority || 0}</div>
              <div className="text-sm text-gray-600">Medium priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{recommendationData?.summary.lowPriority || 0}</div>
              <div className="text-sm text-gray-600">Low priority</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>AI Confidence</span>
              <span>{Math.round((recommendationData?.summary.avgConfidence || 0) * 100)}%</span>
            </div>
            <Progress value={(recommendationData?.summary.avgConfidence || 0) * 100} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
        {filteredRecommendations.map((recommendation) => (
          <Card key={recommendation.id} className={cn(
            "relative",
            recommendation.implemented && "opacity-75"
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(recommendation.category)}
                  <div>
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority.toUpperCase()}
                  </Badge>
                  {recommendation.implemented && (
                    <Badge className="text-green-600 bg-green-100">
                      IMPLEMENTED
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Action */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Recommended Action:</h4>
                  <p className="text-sm text-gray-700">{recommendation.action}</p>
                </div>
                
                {/* Metrics */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Related Metrics:</h4>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.metrics.map((metric, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {metric.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Impact, Effort, Confidence */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Impact</span>
                    </div>
                    <Badge className={getImpactColor(recommendation.impact)}>
                      {recommendation.impact.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Effort</span>
                    </div>
                    <Badge className={getEffortColor(recommendation.effort)}>
                      {recommendation.effort.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Confidence</span>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {Math.round(recommendation.confidence * 100)}%
                    </div>
                  </div>
                </div>
                
                {/* Expected Improvement */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Expected Improvement:</span>
                  </div>
                  <p className="text-sm text-green-700 font-medium">{recommendation.expectedImprovement}</p>
                </div>
                
                {/* Implementation Status */}
                {!recommendation.implemented && (
                  <Button 
                    onClick={() => markAsImplemented(recommendation.id)}
                    variant="outline"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Implemented
                  </Button>
                )}
                
                {recommendation.implemented && recommendation.implementationDate && (
                  <div className="text-sm text-green-600">
                    Implemented on {new Date(recommendation.implementationDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {recommendationData?.insights && recommendationData.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendationData.insights.map((insight, index) => (
                <div 
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border',
                    insight.type === 'opportunity' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    'bg-green-50 border-green-200 text-green-800'
                  )}
                >
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Implementation Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {recommendationData?.recommendations.filter(r => r.implemented).length || 0}
              </div>
              <div className="text-sm text-gray-600">Implemented</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {recommendationData?.recommendations.filter(r => !r.implemented).length || 0}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RecommendationEngine
