/**
 * Efficiency Metrics Card Component
 * Story 32.2: Efficiency & Performance Metrics
 * Task 2.1: Create admin dashboard for metrics visualization
 * 
 * Displays key efficiency metrics with trends and achievement rates
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EfficiencyMetricsProps {
  timeToFirstArticle: {
    average: number
    target: number
    achievementRate: number
    trend: 'improving' | 'declining' | 'stable'
  }
  reviewCycleReduction: {
    average: number
    target: number
    achievementRate: number
    trend: 'improving' | 'declining' | 'stable'
  }
  dashboardPerformance: {
    averageLoadTime: number
    target: number
    achievementRate: number
    trend: 'improving' | 'declining' | 'stable'
  }
  className?: string
}

export function EfficiencyMetricsCard({
  timeToFirstArticle,
  reviewCycleReduction,
  dashboardPerformance,
  className = ''
}: EfficiencyMetricsProps) {
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-100'
      case 'declining':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getAchievementColor = (rate: number) => {
    if (rate >= 1) return 'text-green-600'
    if (rate >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTime = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`
    }
    return `${minutes.toFixed(1)}m`
  }

  return (
    <Card className={cn('border-blue-200 bg-blue-50/30', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Efficiency Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time to First Article */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Time to First Article</span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(timeToFirstArticle.trend)}
              <Badge className={cn('text-xs', getTrendColor(timeToFirstArticle.trend))}>
                {timeToFirstArticle.trend}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getAchievementColor(timeToFirstArticle.achievementRate))}>
                {formatTime(timeToFirstArticle.average)}
              </div>
              <div className="text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatTime(timeToFirstArticle.target)}
              </div>
              <div className="text-gray-600">Target</div>
            </div>
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getAchievementColor(timeToFirstArticle.achievementRate))}>
                {Math.round(timeToFirstArticle.achievementRate * 100)}%
              </div>
              <div className="text-gray-600">Achievement</div>
            </div>
          </div>
        </div>

        {/* Review Cycle Reduction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium">Review Cycle Reduction</span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(reviewCycleReduction.trend)}
              <Badge className={cn('text-xs', getTrendColor(reviewCycleReduction.trend))}>
                {reviewCycleReduction.trend}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getAchievementColor(reviewCycleReduction.achievementRate))}>
                {reviewCycleReduction.average.toFixed(1)}%
              </div>
              <div className="text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {reviewCycleReduction.target}%
              </div>
              <div className="text-gray-600">Target</div>
            </div>
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getAchievementColor(reviewCycleReduction.achievementRate))}>
                {Math.round(reviewCycleReduction.achievementRate * 100)}%
              </div>
              <div className="text-gray-600">Achievement</div>
            </div>
          </div>
        </div>

        {/* Dashboard Performance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Dashboard Load Time</span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(dashboardPerformance.trend)}
              <Badge className={cn('text-xs', getTrendColor(dashboardPerformance.trend))}>
                {dashboardPerformance.trend}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getAchievementColor(dashboardPerformance.achievementRate))}>
                {dashboardPerformance.averageLoadTime.toFixed(1)}s
              </div>
              <div className="text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {dashboardPerformance.target}s
              </div>
              <div className="text-gray-600">Target</div>
            </div>
            <div className="text-center">
              <div className={cn('text-2xl font-bold', getAchievementColor(dashboardPerformance.achievementRate))}>
                {Math.round(dashboardPerformance.achievementRate * 100)}%
              </div>
              <div className="text-gray-600">Achievement</div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Efficiency Score</span>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(
                  (timeToFirstArticle.achievementRate + 
                   reviewCycleReduction.achievementRate + 
                   dashboardPerformance.achievementRate) / 3 * 100
                )}
              </div>
              <span className="text-gray-600">/100</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
