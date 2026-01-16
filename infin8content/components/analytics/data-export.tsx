/**
 * Data Export Component
 * Story 32-3: Analytics Dashboard and Reporting
 * Task 2.2: Add data export capabilities (CSV, PDF)
 * 
 * Comprehensive data export functionality with multiple formats,
 * scheduling, and delivery options.
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
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  Download,
  FileText,
  Calendar,
  Mail,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  Share2,
  Filter,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subDays, addDays } from 'date-fns'

// Types
export interface AnalyticsData {
  uxMetrics: {
    completion_rate: { value: number; target: number; trend: string }
    collaboration_adoption: { value: number; target: number; trend: string }
    trust_score: { value: number; target: number; trend: string }
    perceived_value: { value: number; target: number; trend: string }
  }
  performanceMetrics: {
    dashboard_load_time: { value: number; target: number; trend: string }
    article_creation_time: { value: number; target: number; trend: string }
    comment_latency: { value: number; target: number; trend: string }
  }
  insights: Array<{ type: string; message: string }>
  recommendations: Array<{ priority: string; action: string }>
  lastUpdated: string
}

interface DataExportProps {
  analyticsData: AnalyticsData
  orgId: string
  className?: string
}

export function DataExport({ analyticsData, orgId, className = '' }: DataExportProps) {
  // Export state
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState('standard')
  
  // Export options
  const [selectedMetrics, setSelectedMetrics] = useState({
    uxMetrics: true,
    performanceMetrics: true,
    insights: true,
    recommendations: true
  })
  
  // Date range
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exportPeriod, setExportPeriod] = useState('custom')
  
  // Scheduled exports
  const [scheduledExports, setScheduledExports] = useState(false)
  const [exportFrequency, setExportFrequency] = useState('weekly')
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailExport, setEmailExport] = useState(false)
  const [exportEmailRecipients, setExportEmailRecipients] = useState('')

  // Validate export options
  const validateExportOptions = () => {
    const hasSelectedMetrics = Object.values(selectedMetrics).some(selected => selected)
    if (!hasSelectedMetrics) {
      setExportError('Please select at least one metric to export')
      return false
    }
    return true
  }

  // Export data function
  const exportData = useCallback(async (format: 'csv' | 'pdf') => {
    if (!validateExportOptions()) return
    
    setExporting(true)
    setExportError(null)
    setExportProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)
      
      const response = await fetch(`/api/analytics/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyticsData,
          orgId,
          format: exportFormat,
          selectedMetrics,
          dateRange: { startDate, endDate },
          includeEmail: emailExport,
          emailRecipients: exportEmailRecipients
        })
      })
      
      clearInterval(progressInterval)
      setExportProgress(100)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-export-${format}-${format(new Date(), 'yyyy-MM-dd')}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Reset after successful export
      setTimeout(() => {
        setExporting(false)
        setExportProgress(0)
      }, 1000)
      
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'An error occurred')
      setExporting(false)
      setExportProgress(0)
    }
  }, [analyticsData, orgId, exportFormat, selectedMetrics, startDate, endDate, emailExport, exportEmailRecipients])

  // Export all formats
  const exportAllFormats = async () => {
    await exportData('csv')
    setTimeout(() => exportData('pdf'), 500)
  }

  // Export historical data
  const exportHistoricalData = async () => {
    setExporting(true)
    setExportError(null)
    setExportProgress(0)
    
    try {
      // Simulate longer export for historical data
      for (let i = 0; i <= 100; i += 5) {
        setExportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // Mock historical data export
      const response = await fetch('/api/analytics/export/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, startDate, endDate })
      })
      
      if (!response.ok) throw new Error('Historical export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historical-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setExporting(false)
      setExportProgress(0)
    }
  }

  // Get export preview
  const getExportPreview = () => {
    const metrics = []
    if (selectedMetrics.uxMetrics) metrics.push('4 UX metrics')
    if (selectedMetrics.performanceMetrics) metrics.push('3 performance metrics')
    if (selectedMetrics.insights) metrics.push(`${analyticsData.insights.length} insights`)
    if (selectedMetrics.recommendations) metrics.push(`${analyticsData.recommendations.length} recommendations`)
    return metrics.join(', ')
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Data Export</h2>
            <p className="text-sm text-gray-600">
              Export analytics data in various formats
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="export-format">Export format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="export-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard CSV</SelectItem>
                    <SelectItem value="detailed-csv">Detailed CSV</SelectItem>
                    <SelectItem value="summary-pdf">Summary PDF</SelectItem>
                    <SelectItem value="detailed-pdf">Detailed PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quick Export</Label>
                <div className="space-y-2">
                  <Button 
                    onClick={() => exportData('csv')}
                    disabled={exporting}
                    className="w-full"
                    variant="outline"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={() => exportData('pdf')}
                    disabled={exporting}
                    className="w-full"
                    variant="outline"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bulk Operations</Label>
                <Button 
                  onClick={exportAllFormats}
                  disabled={exporting}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Formats
                </Button>
                
                <Button 
                  onClick={exportHistoricalData}
                  disabled={exporting}
                  className="w-full"
                  variant="outline"
                >
                  <History className="h-4 w-4 mr-2" />
                  Export Historical Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="export-period">Export period</Label>
                <Select value={exportPeriod} onValueChange={setExportPeriod}>
                  <SelectTrigger id="export-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {exportPeriod === 'custom' && (
                <>
                  <div>
                    <Label htmlFor="start-date">Start date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end-date">End date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-export">Email export</Label>
                <Switch
                  id="email-export"
                  checked={emailExport}
                  onCheckedChange={setEmailExport}
                />
              </div>

              {emailExport && (
                <div>
                  <Label htmlFor="export-email-recipients">Email recipients for export</Label>
                  <Textarea
                    id="export-email-recipients"
                    placeholder="Enter email addresses, separated by commas"
                    value={exportEmailRecipients}
                    onChange={(e) => setExportEmailRecipients(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Export Options and Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metric Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Select Metrics to Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ux-metrics"
                    checked={selectedMetrics.uxMetrics}
                    onCheckedChange={(checked) => 
                      setSelectedMetrics(prev => ({ ...prev, uxMetrics: checked as boolean }))
                    }
                  />
                  <Label htmlFor="ux-metrics">UX Metrics</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="performance-metrics"
                    checked={selectedMetrics.performanceMetrics}
                    onCheckedChange={(checked) => 
                      setSelectedMetrics(prev => ({ ...prev, performanceMetrics: checked as boolean }))
                    }
                  />
                  <Label htmlFor="performance-metrics">Performance Metrics</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insights"
                    checked={selectedMetrics.insights}
                    onCheckedChange={(checked) => 
                      setSelectedMetrics(prev => ({ ...prev, insights: checked as boolean }))
                    }
                  />
                  <Label htmlFor="insights">Insights</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recommendations"
                    checked={selectedMetrics.recommendations}
                    onCheckedChange={(checked) => 
                      setSelectedMetrics(prev => ({ ...prev, recommendations: checked as boolean }))
                    }
                  />
                  <Label htmlFor="recommendations">Recommendations</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Export will include:</strong></p>
                <p>{getExportPreview()}</p>
                <p><strong>Date range:</strong> {startDate} to {endDate}</p>
                <p><strong>Format:</strong> {exportFormat}</p>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {exporting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Error */}
          {exportError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Export failed</div>
                    <div className="text-sm text-red-600">{exportError}</div>
                  </div>
                </div>
                <Button 
                  onClick={() => setExportError(null)}
                  variant="outline" 
                  className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Exports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Scheduled Exports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scheduled-exports">Enable scheduled exports</Label>
                <Switch
                  id="scheduled-exports"
                  checked={scheduledExports}
                  onCheckedChange={setScheduledExports}
                />
              </div>

              {scheduledExports && (
                <>
                  <div>
                    <Label htmlFor="export-frequency">Export frequency</Label>
                    <Select value={exportFrequency} onValueChange={setExportFrequency}>
                      <SelectTrigger id="export-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email-recipients">Email recipients</Label>
                    <Textarea
                      id="email-recipients"
                      placeholder="Enter email addresses, separated by commas"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" />
                Export History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Recent exports will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DataExport
