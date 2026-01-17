/**
 * Content Performance Dashboard Component
 * 
 * Displays content generation metrics and user-relevant statistics
 * for the Infin8Content dashboard.
 */

"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MobileCard } from '@/components/mobile/mobile-card'

interface ContentMetrics {
  articlesInProgress: number
  articlesCompleted: number
  wordsWrittenToday: number
  averageGenerationTime: number
  seoScoreImprovement: number
  contentViews: number
  contentEngagements: number
  generationSpeed: string
}

export const ContentPerformanceDashboard: React.FC = () => {
  const router = useRouter()
  const [metrics, setMetrics] = useState<ContentMetrics>({
    articlesInProgress: 0,
    articlesCompleted: 0,
    wordsWrittenToday: 0,
    averageGenerationTime: 0,
    seoScoreImprovement: 0,
    contentViews: 0,
    contentEngagements: 0,
    generationSpeed: 'Calculating...'
  })

  const [isLoading, setIsLoading] = useState(true)

  // Fetch content metrics
  useEffect(() => {
    const fetchContentMetrics = async () => {
      try {
        setIsLoading(true)
        
        // Simulate API call - replace with real data fetching
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setMetrics({
          articlesInProgress: 3,
          articlesCompleted: 12,
          wordsWrittenToday: 2450,
          averageGenerationTime: 2.3,
          seoScoreImprovement: 15,
          contentViews: 1200,
          contentEngagements: 45,
          generationSpeed: '2.3 min/article'
        })
      } catch (error) {
        console.error('Failed to fetch content metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContentMetrics()
    
    // Update metrics every 30 seconds
    const interval = setInterval(fetchContentMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }

  const getSpeedColor = (time: number): string => {
    if (time <= 2) return 'green'
    if (time <= 3) return 'yellow'
    return 'orange'
  }

  if (isLoading) {
    return (
      <MobileCard>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading content metrics...</p>
          </div>
        </CardContent>
      </MobileCard>
    )
  }

  return (
    <MobileCard>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Content Performance
          <div className="flex items-center gap-2">
            <Badge 
              variant={metrics.seoScoreImprovement >= 10 ? "default" : "secondary"}
              className="text-xs"
            >
              {metrics.seoScoreImprovement >= 10 ? 'Improving' : 'Stable'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Articles Status */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.articlesInProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.articlesCompleted}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          
          {/* Words Written */}
          <div className="text-center">
            <div className="text-2xl font-bold">{(metrics.wordsWrittenToday / 1000).toFixed(1)}k</div>
            <p className="text-xs text-muted-foreground">Words Today</p>
          </div>
          
          {/* Generation Speed */}
          <div className="text-center">
            <div className={`text-2xl font-bold text-${getSpeedColor(metrics.averageGenerationTime)}-600`}>
              {metrics.averageGenerationTime}m
            </div>
            <p className="text-xs text-muted-foreground">Avg Generation</p>
          </div>
          
          {/* SEO Improvement */}
          <div className="text-center">
            <div className={`text-2xl font-bold text-${getPerformanceColor(metrics.seoScoreImprovement)}-600`}>
              +{metrics.seoScoreImprovement}%
            </div>
            <p className="text-xs text-muted-foreground">SEO Score</p>
          </div>
          
          {/* Content Performance */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.contentViews}</div>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
        </div>
        
        {/* Engagement Rate */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Engagement Rate</span>
            <span className="text-sm font-medium">
              {((metrics.contentEngagements / metrics.contentViews) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(metrics.contentEngagements / metrics.contentViews) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => router.push('/dashboard/articles/generate')}
          >
            New Article
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => router.push('/analytics')}
          >
            View Analytics
          </Button>
        </div>
      </CardContent>
    </MobileCard>
  )
}
