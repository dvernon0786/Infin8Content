/**
 * Weekly Report Generator Component
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.1: Create weekly report generation system
 * 
 * Comprehensive weekly report generation with scheduling,
 * export capabilities, and delivery options.
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText,
  Download,
  Share2,
  Calendar,
  Clock,
  Mail,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Users,
  Zap,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'

// Types
export interface WeeklyReportData {
  weekNumber: number
  year: number
  period: string
  uxMetrics: {
    completion_rate: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
    collaboration_adoption: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
    trust_score: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
    perceived_value: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
  }
  performanceMetrics: {
    dashboard_load_time: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
    article_creation_time: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
    comment_latency: { current: number; previous: number; target: number; trend: 'up' | 'down' | 'stable' }
  }
  insights: Array<{ type: 'positive' | 'warning' | 'critical'; message: string }>
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string }>
  summary: {
    overallScore: number
    keyAchievements: string[]
    challenges: string[]
    nextFocus: string[]
  }
}

interface WeeklyReportGeneratorProps {
  orgId: string
  className?: string
}

export function WeeklyReportGenerator({ orgId, className = '' }: WeeklyReportGeneratorProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekNumber = Math.ceil((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return `${now.getFullYear()}-W${weekNumber}`
  })
  
  const [reportData, setReportData] = useState<WeeklyReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Scheduling state
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('09:00')
  const [deliveryDay, setDeliveryDay] = useState('monday')

  // Get week options
  const getWeekOptions = () => {
    const options = []
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const weekDate = subWeeks(now, i)
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 })
      const weekNumber = Math.ceil((weekDate.getTime() - startOfWeek(weekDate, { weekStartsOn: 1 }).getTime()) / (7 * 24 * 60 * 60 * 1000))
      
      options.push({
        value: `${weekDate.getFullYear()}-W${weekNumber}`,
        label: `Week ${weekNumber} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`,
        isCurrent: i === 0
      })
    }
    
    return options
  }

  // Generate weekly report
  const generateReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/analytics/weekly-report?orgId=${orgId}&week=${selectedWeek}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Report generation error:', err)
    } finally {
      setLoading(false)
    }
  }, [orgId, selectedWeek])

  // Download report as PDF
  const downloadPDF = async () => {
    if (!reportData) return
    
    try {
      const response = await fetch('/api/analytics/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, orgId })
      })
      
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weekly-report-${selectedWeek}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('PDF download error:', err)
    }
  }

  // Download report as CSV
  const downloadCSV = async () => {
    if (!reportData) return
    
    try {
      const response = await fetch('/api/analytics/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, orgId })
      })
      
      if (!response.ok) throw new Error('Failed to generate CSV')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weekly-report-${selectedWeek}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('CSV download error:', err)
    }
  }

  // Share report
  const shareReport = async () => {
    if (!reportData) return
    
    try {
      const response = await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, orgId, recipients: emailRecipients.split(',').map(e => e.trim()) })
      })
      
      if (!response.ok) throw new Error('Failed to share report')
      
      // Show success message
      alert('Report shared successfully!')
    } catch (err) {
      console.error('Share error:', err)
      alert('Failed to share report')
    }
  }

  // Get performance score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-yellow-600 bg-yellow-100'
    if (score >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  // Get performance label
  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />
      case 'stable': return <div className="h-3 w-3 bg-gray-400 rounded-full" />
      default: return <div className="h-3 w-3 bg-gray-400 rounded-full" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Weekly Report Generator</h2>
            <p className="text-sm text-gray-600">
              Generate comprehensive weekly analytics reports
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Week Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="week-select">Select Week</Label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger id="week-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getWeekOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} {option.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateReport}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating report...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Recurring Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Recurring Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="schedule-enabled">Enable weekly reports</Label>
                <Switch
                  id="schedule-enabled"
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                />
              </div>

              {scheduleEnabled && (
                <>
                  <div>
                    <Label htmlFor="email-recipients">Email recipients</Label>
                    <Textarea
                      id="email-recipients"
                      placeholder="Enter email addresses, separated by commas"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="delivery-day">Delivery day</Label>
                    <Select value={deliveryDay} onValueChange={setDeliveryDay}>
                      <SelectTrigger id="delivery-day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="delivery-time">Delivery time</Label>
                    <Input
                      id="delivery-time"
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Preview includes:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Executive summary</li>
                  <li>UX metrics analysis</li>
                  <li>Performance metrics</li>
                  <li>Key insights</li>
                  <li>Recommendations</li>
                  <li>Trend analysis</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2">
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-lg font-medium">Generating report...</p>
                    <p className="text-sm text-gray-600 mt-2">Please wait while we compile your weekly analytics</p>
                  </div>
                </div>
                <div data-testid="report-loading-skeleton" className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Failed to generate report</div>
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                </div>
                <Button 
                  onClick={generateReport}
                  variant="outline" 
                  className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {reportData && !loading && (
            <div className="space-y-6">
              {/* Report Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Weekly Analytics Report</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-sm', getScoreColor(reportData.summary.overallScore))}>
                        Score: {reportData.summary.overallScore}/100
                      </Badge>
                      <Badge variant="outline">
                        {getPerformanceLabel(reportData.summary.overallScore)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    {reportData.period} • Week {reportData.weekNumber}, {reportData.year}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={downloadPDF} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button onClick={downloadCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                    <Button onClick={shareReport} variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Key Achievements</h4>
                      <ul className="space-y-1">
                        {reportData.summary.keyAchievements.map((achievement, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2">Challenges</h4>
                      <ul className="space-y-1">
                        {reportData.summary.challenges.map((challenge, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Next Focus</h4>
                      <ul className="space-y-1">
                        {reportData.summary.nextFocus.map((focus, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <Zap className="h-3 w-3 text-blue-600" />
                            {focus}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* UX Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    User Experience Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(reportData.uxMetrics).map(([key, metric]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{key.replace(/_/g, ' ')}</h4>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Current:</span>
                            <span className="font-medium">{metric.current}{key.includes('rate') || key.includes('adoption') ? '%' : key.includes('trust') ? '/5' : '/10'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Previous:</span>
                            <span className="text-gray-600">{metric.previous}{key.includes('rate') || key.includes('adoption') ? '%' : key.includes('trust') ? '/5' : '/10'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target:</span>
                            <span className="text-gray-600">{metric.target}{key.includes('rate') || key.includes('adoption') ? '%' : key.includes('trust') ? '/5' : '/10'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(reportData.performanceMetrics).map(([key, metric]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{key.replace(/_/g, ' ')}</h4>
                          {getTrendIcon(metric.trend)}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Current:</span>
                            <span className="font-medium">{metric.current}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Previous:</span>
                            <span className="text-gray-600">{metric.previous}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target:</span>
                            <span className="text-gray-600">{metric.target}s</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.insights.map((insight, index) => (
                        <div 
                          key={index}
                          className={cn(
                            'p-3 rounded-lg border',
                            insight.type === 'positive' ? 'bg-green-50 border-green-200 text-green-800' :
                            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                            'bg-red-50 border-red-200 text-red-800'
                          )}
                        >
                          <p className="text-sm">{insight.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.recommendations.map((rec, index) => (
                        <div 
                          key={index}
                          className={cn(
                            'p-3 rounded-lg border',
                            rec.priority === 'high' ? 'bg-red-50 border-red-200 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                            'bg-green-50 border-green-200 text-green-800'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium uppercase">{rec.priority}</span>
                          </div>
                          <p className="text-sm">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeeklyReportGenerator
