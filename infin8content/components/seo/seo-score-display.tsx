// SEO Score Display Component
// Story 14.6: SEO Testing and Validation
// Component: SEO Score Visualization

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SEOScoreResult } from '@/lib/seo/seo-scoring'

interface SEOScoreDisplayProps {
  scoreResult: SEOScoreResult
  showDetails?: boolean
  compact?: boolean
}

export function SEOScoreDisplay({ 
  scoreResult, 
  showDetails = true, 
  compact = false 
}: SEOScoreDisplayProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number): string => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 67) return 'D+'
    if (score >= 63) return 'D'
    if (score >= 60) return 'D-'
    return 'F'
  }

  const getScoreStatus = (score: number): string => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Poor'
  }

  const getProgressColor = (score: number): string => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 75) return 'bg-blue-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const scoreBreakdown = [
    { label: 'Keyword Density', value: scoreResult.breakdown.keywordDensity, weight: 25 },
    { label: 'Readability', value: scoreResult.breakdown.readability, weight: 20 },
    { label: 'Structure', value: scoreResult.breakdown.structure, weight: 20 },
    { label: 'Semantic Coverage', value: scoreResult.breakdown.semanticCoverage, weight: 15 },
    { label: 'Content Length', value: scoreResult.breakdown.contentLength, weight: 10 },
    { label: 'Meta Optimization', value: scoreResult.breakdown.metaOptimization, weight: 10 }
  ]

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(scoreResult.overallScore)}`}>
            {scoreResult.overallScore}
          </div>
          <div className="text-sm text-gray-500">{getScoreGrade(scoreResult.overallScore)}</div>
        </div>
        <Progress 
          value={scoreResult.overallScore} 
          className="w-32 h-2"
        />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>SEO Score</span>
            <Badge variant={scoreResult.overallScore >= 75 ? 'default' : 'destructive'}>
              {getScoreGrade(scoreResult.overallScore)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(scoreResult.overallScore)}`}>
                {scoreResult.overallScore}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {getScoreStatus(scoreResult.overallScore)} SEO Score
              </div>
              <Progress 
                value={scoreResult.overallScore} 
                className="mt-2 h-3"
              />
            </div>

            {/* Score Breakdown */}
            {showDetails && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Score Breakdown</h4>
                <div className="space-y-2">
                  {scoreBreakdown.map((item, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{item.label}</span>
                            <span className="text-xs text-gray-400">({item.weight}%)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getScoreColor(item.value)}`}>
                              {item.value}
                            </span>
                            <Progress 
                              value={item.value} 
                              className="w-16 h-1"
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Contribution: {Math.round(item.value * item.weight / 100)} points</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {showDetails && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Key Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Word Count:</span>
                    <span className="ml-2 font-medium">{scoreResult.metrics.wordCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Keyword Density:</span>
                    <span className="ml-2 font-medium">{scoreResult.metrics.keywordDensity}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Readability:</span>
                    <span className="ml-2 font-medium">Grade {scoreResult.metrics.readabilityScore}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Headings:</span>
                    <span className="ml-2 font-medium">{scoreResult.metrics.headingCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Issues Summary */}
            {scoreResult.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Issues Found</h4>
                <div className="space-y-1">
                  {scoreResult.issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant={issue.type === 'error' ? 'destructive' : 
                                     issue.type === 'warning' ? 'default' : 'secondary'}>
                        {issue.type}
                      </Badge>
                      <span className="text-sm text-gray-600">{issue.message}</span>
                    </div>
                  ))}
                  {scoreResult.issues.length > 3 && (
                    <div className="text-sm text-gray-500">
                      ... and {scoreResult.issues.length - 3} more issues
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
