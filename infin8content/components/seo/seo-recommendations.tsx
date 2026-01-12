// SEO Recommendations Component
// Story 14.6: SEO Testing and Validation
// Component to display real-time SEO recommendations

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbulb, TrendingUp, Target, Zap } from 'lucide-react'

import { ValidationRecommendation } from '@/lib/seo/validation-engine'

interface SEORecommendationsProps {
  recommendations: ValidationRecommendation[]
  onApplyRecommendation?: (recommendation: ValidationRecommendation) => void
  className?: string
}

export function SEORecommendations({ 
  recommendations, 
  onApplyRecommendation,
  className 
}: SEORecommendationsProps) {
  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Zap className="h-4 w-4 text-red-500" />
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Target className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword':
        return <Target className="h-4 w-4" />
      case 'readability':
        return <TrendingUp className="h-4 w-4" />
      case 'structure':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const sortedRecommendations = recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            SEO Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No SEO recommendations at this time.</p>
            <p className="text-sm">Your content is well-optimized!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          SEO Recommendations
        </CardTitle>
        <CardDescription>
          {recommendations.length} recommendation(s) to improve your SEO score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedRecommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-lg ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getPriorityIcon(rec.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(rec.type)}
                  <h4 className="font-medium text-gray-900">
                    {rec.message}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {rec.type}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">
                  {rec.action}
                </p>
                
                {rec.expectedValue && rec.actualValue && (
                  <div className="text-xs text-gray-600 mb-3 bg-white/50 rounded p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Expected:</span> {rec.expectedValue}
                      </div>
                      <div>
                        <span className="font-medium">Current:</span> {rec.actualValue}
                      </div>
                    </div>
                  </div>
                )}
                
                {onApplyRecommendation && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onApplyRecommendation(rec)}
                      className="text-xs"
                    >
                      Apply Suggestion
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lightbulb className="h-4 w-4" />
            <span>
              High priority recommendations can improve your SEO score by 10+ points. 
              Medium priority by 5-10 points. Low priority by 1-5 points.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
