// SEO Reports Component
// Story 14.6: SEO Testing and Validation
// Component to display comprehensive SEO reports and analytics

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Target,
  Zap
} from 'lucide-react'

interface SEOReport {
  id: string
  title: string
  overallScore: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  generatedAt: string
  contentType: string
  wordCount: number
  keywordDensity: number
  readabilityScore: number
  structureScore: number
  semanticCoverage: number
  recommendations: Array<{
    type: string
    priority: 'high' | 'medium' | 'low'
    description: string
    impact: number
  }>
  historicalData?: Array<{
    date: string
    score: number
  }>
}

interface SEOReportsProps {
  report: SEOReport
  onExport?: (format: 'pdf' | 'csv' | 'json') => void
  className?: string
}

export function SEOReports({ report, onExport, className }: SEOReportsProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'D':
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-blue-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatScore = (score: number) => {
    return Math.round(score)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SEO Report: {report.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Generated on {formatDate(report.generatedAt)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getGradeColor(report.grade)}>
                Grade: {report.grade}
              </Badge>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                  {formatScore(report.overallScore)}
                </div>
                <div className="text-xs text-gray-500">Overall Score</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{report.wordCount}</div>
              <div className="text-sm text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{report.keywordDensity.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Keyword Density</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Grade {report.readabilityScore}</div>
              <div className="text-sm text-gray-600">Readability</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{report.semanticCoverage}%</div>
              <div className="text-sm text-gray-600">Semantic Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Keyword Optimization</span>
                <span className={`text-sm font-bold ${getScoreColor(report.keywordDensity * 10)}`}>
                  {formatScore(report.keywordDensity * 10)}/100
                </span>
              </div>
              <Progress 
                value={report.keywordDensity * 10} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Readability</span>
                <span className={`text-sm font-bold ${getScoreColor(report.readabilityScore * 8)}`}>
                  {formatScore(report.readabilityScore * 8)}/100
                </span>
              </div>
              <Progress 
                value={report.readabilityScore * 8} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Content Structure</span>
                <span className={`text-sm font-bold ${getScoreColor(report.structureScore)}`}>
                  {formatScore(report.structureScore)}/100
                </span>
              </div>
              <Progress 
                value={report.structureScore} 
                className="h-2"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Semantic Coverage</span>
                <span className={`text-sm font-bold ${getScoreColor(report.semanticCoverage)}`}>
                  {formatScore(report.semanticCoverage)}/100
                </span>
              </div>
              <Progress 
                value={report.semanticCoverage} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommendations Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Zap className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-red-700">
                {report.recommendations.filter(r => r.priority === 'high').length}
              </div>
              <div className="text-sm text-red-600">High Priority</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-yellow-700">
                {report.recommendations.filter(r => r.priority === 'medium').length}
              </div>
              <div className="text-sm text-yellow-600">Medium Priority</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-700">
                {report.recommendations.filter(r => r.priority === 'low').length}
              </div>
              <div className="text-sm text-blue-600">Low Priority</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {report.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                  {rec.priority}
                </Badge>
                <span className="text-sm">{rec.description}</span>
                <span className="text-xs text-gray-500 ml-auto">+{rec.impact} pts</span>
              </div>
            ))}
            {report.recommendations.length > 3 && (
              <div className="text-sm text-gray-500 text-center pt-2">
                ... and {report.recommendations.length - 3} more recommendations
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historical Trend */}
      {report.historicalData && report.historicalData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.historicalData.slice(-5).map((data, index) => {
                const previousScore = index > 0 ? report.historicalData![index - 1].score : data.score
                const trend = data.score - previousScore
                const isImproving = trend > 0
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatDate(data.date)}</span>
                      {index > 0 && (
                        <div className={`flex items-center gap-1 text-xs ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
                          {isImproving ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(trend)} pts
                        </div>
                      )}
                    </div>
                    <span className={`font-bold ${getScoreColor(data.score)}`}>
                      {formatScore(data.score)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </CardTitle>
          <CardDescription>
            Download this SEO report in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport?.('pdf')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export as PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport?.('csv')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Export as CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport?.('json')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
