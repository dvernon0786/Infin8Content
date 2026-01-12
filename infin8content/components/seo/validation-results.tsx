// SEO Validation Results Component
// Story 14.6: SEO Testing and Validation
// Component to display validation results and issues

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

import { ValidationResult, ValidationRecommendation } from '@/lib/seo/validation-engine'

interface ValidationResultsProps {
  result: ValidationResult
  className?: string
}

export function ValidationResults({ result, className }: ValidationResultsProps) {
  const getSeverityIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'info':
        return 'outline'
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            SEO Validation Results
          </CardTitle>
          <CardDescription>
            Overall Score: {result.score}/100 • {result.metrics.passedRules}/{result.metrics.totalRules} rules passed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{result.metrics.passedRules}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{result.metrics.failedRules}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{result.metrics.errorCount}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{result.metrics.validationTime}ms</div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {result.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues Found</CardTitle>
            <CardDescription>
              {result.issues.length} issue(s) need attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.issues.map((issue, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(issue.type)}
                    <div className="flex-1">
                      <div className="font-medium">
                        {issue.message}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {issue.suggestion}
                      </p>
                    </div>
                    <Badge variant={getSeverityColor(issue.type) as any}>
                      {issue.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              {result.recommendations.length} recommendation(s) to improve SEO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{rec.message}</h4>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.action}</p>
                  {rec.expectedValue && rec.actualValue && (
                    <div className="text-xs text-gray-500">
                      Expected: {rec.expectedValue} • Actual: {rec.actualValue}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
