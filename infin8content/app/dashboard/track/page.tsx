'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  Eye,
  MousePointerClick,
  AlertCircle,
  Zap,
  ExternalLink,
  Settings,
  RefreshCw,
} from 'lucide-react'

interface GAMetricRow {
  date: string
  sessions: number
  pageviews: number
  users: number
  bounce_rate: number
  avg_session_duration: number
}

interface GAOverview {
  total_sessions: number
  total_users: number
  total_pageviews: number
  avg_bounce_rate: number
  avg_session_duration: number
  daily: GAMetricRow[]
}

interface GSCMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCQueryData {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCPageData {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCData {
  metrics: GSCMetrics
  topQueries: GSCQueryData[]
  topPages: GSCPageData[]
}

interface IndexingData {
  discoveredUrls: number
  indexedUrls: number
  crawlErrors: number
  lastSubmission: string
  pendingUrls: number
  submissionHistory: Array<{
    date: string
    count: number
    status: 'success' | 'pending' | 'failed'
  }>
}

interface PerformanceInsight {
  title: string
  description: string
  metric: string
  value: string | number
  trend: 'up' | 'down' | 'stable'
  actionable: boolean
  recommendation?: string
}

export default function TrackPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [gaData, setGAData] = useState<GAOverview | null>(null)
  const [gscData, setGSCData] = useState<GSCData | null>(null)
  const [indexingData, setIndexingData] = useState<IndexingData | null>(null)
  const [insights, setInsights] = useState<PerformanceInsight[]>([])

  // Load all analytics data on mount
  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [gaRes, gscRes, indexingRes] = await Promise.all([
        fetch('/api/dashboard/google/analytics'),
        fetch('/api/dashboard/google/search-console'),
        fetch('/api/dashboard/google/indexing'),
      ])

      let gaData: GAOverview | null = null
      let gscData: GSCData | null = null
      let indexingData: IndexingData | null = null

      if (gaRes.ok) {
        gaData = await gaRes.json()
        setGAData(gaData)
      }

      if (gscRes.ok) {
        gscData = await gscRes.json()
        setGSCData(gscData)
      }

      if (indexingRes.ok) {
        indexingData = await indexingRes.json()
        setIndexingData(indexingData)
      }

      // Generate insights from the data
      const newInsights = generateInsights(gaData, gscData, indexingData)
      setInsights(newInsights)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-poppins text-h2-desktop font-bold text-neutral-900">Track & Analyze</h1>
          <p className="mt-1 font-lato text-body text-neutral-600">
            Google Analytics, Search Console, and indexing metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{error}</p>
              <p className="text-sm text-red-700 mt-1">
                Make sure your Google integrations are connected in Settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'analytics'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('search-console')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'search-console'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Search Console
        </button>
        <button
          onClick={() => setActiveTab('indexing')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'indexing'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Indexing
        </button>
      </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 mt-6">
            {/* Performance Insights */}
            <div>
              <h2 className="font-poppins text-h4-desktop font-bold text-neutral-900 mb-4">
                Performance Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900">{insight.title}</h3>
                          <p className="text-sm text-neutral-600 mt-1">{insight.description}</p>
                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-neutral-900">
                              {insight.value}
                            </span>
                            <Badge
                              variant={
                                insight.trend === 'up'
                                  ? 'default'
                                  : insight.trend === 'down'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="gap-1"
                            >
                              <TrendingUp className="w-3 h-3" />
                              {insight.trend}
                            </Badge>
                          </div>
                          {insight.recommendation && (
                            <p className="text-xs text-neutral-600 mt-3 italic">
                              💡 {insight.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gaData && (
                <>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-600">Sessions</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {gaData.total_sessions.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-600">Users</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {gaData.total_users.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-600">Pageviews</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {gaData.total_pageviews.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-neutral-600">Avg Session</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {(gaData.avg_session_duration / 60).toFixed(1)}m
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Sessions Chart */}
            {gaData && gaData.daily.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sessions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={gaData.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#1f2937"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 mt-6">
            {gaData ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Google Analytics 4</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-sm font-medium text-neutral-600">Total Sessions</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {gaData.total_sessions.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-sm font-medium text-neutral-600">Total Users</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {gaData.total_users.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-sm font-medium text-neutral-600">Avg Bounce Rate</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {(gaData.avg_bounce_rate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <p className="text-sm font-medium text-neutral-600">Avg Session Duration</p>
                        <p className="text-2xl font-bold text-neutral-900 mt-2">
                          {(gaData.avg_session_duration / 60).toFixed(1)}m
                        </p>
                      </div>
                    </div>

                    {gaData.daily.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-4">Daily Metrics</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={gaData.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                            />
                            <Legend />
                            <Bar dataKey="sessions" fill="#1f2937" />
                            <Bar dataKey="pageviews" fill="#9ca3af" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <p className="text-neutral-700">
                    Google Analytics not connected. Visit Settings to connect your GA4 property.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Search Console Tab */}
        {activeTab === 'search-console' && (
          <div className="space-y-6 mt-6">
            {gscData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Impressions</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {gscData.metrics.impressions.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Clicks</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {gscData.metrics.clicks.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">CTR</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {(gscData.metrics.ctr * 100).toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Avg Position</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {gscData.metrics.position.toFixed(1)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {gscData.topQueries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Queries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {gscData.topQueries.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-neutral-50 rounded">
                            <div>
                              <p className="font-medium text-neutral-900">{q.query}</p>
                              <p className="text-xs text-neutral-600">
                                Position: {q.position.toFixed(1)} • CTR: {(q.ctr * 100).toFixed(2)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-neutral-900">{q.clicks}</p>
                              <p className="text-xs text-neutral-600">{q.impressions} impressions</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {gscData.topPages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {gscData.topPages.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-neutral-50 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900 truncate text-sm">{p.page}</p>
                              <p className="text-xs text-neutral-600">
                                Position: {p.position.toFixed(1)} • CTR: {(p.ctr * 100).toFixed(2)}%
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-neutral-900">{p.clicks}</p>
                              <p className="text-xs text-neutral-600">{p.impressions} imp.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <p className="text-neutral-700">
                    Google Search Console not connected. Visit Settings to connect your GSC property.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Indexing Tab */}
        {activeTab === 'indexing' && (
          <div className="space-y-6 mt-6">
            {indexingData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Indexed URLs</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {indexingData.indexedUrls.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Discovered URLs</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {indexingData.discoveredUrls.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Pending URLs</p>
                      <p className="text-2xl font-bold text-neutral-900 mt-2">
                        {indexingData.pendingUrls.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-neutral-600">Crawl Errors</p>
                      <p className={`text-2xl font-bold mt-2 ${
                        indexingData.crawlErrors > 0 ? 'text-red-600' : 'text-neutral-900'
                      }`}>
                        {indexingData.crawlErrors.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {indexingData.submissionHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={indexingData.submissionHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                          />
                          <Bar dataKey="count" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-blue-900">
                      <strong>Last Submission:</strong> {indexingData.lastSubmission}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <p className="text-neutral-700">
                    Indexing data not available. Configure Google Search Console integration to enable URL submission tracking.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  )
}

// Generate performance insights from analytics data
function generateInsights(
  gaData: GAOverview | null,
  gscData: GSCData | null,
  indexingData: IndexingData | null
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = []

  if (gaData) {
    if (gaData.avg_bounce_rate > 0.5) {
      insights.push({
        title: 'High Bounce Rate',
        description: 'More than 50% of sessions leave without interaction',
        metric: 'bounce_rate',
        value: `${(gaData.avg_bounce_rate * 100).toFixed(1)}%`,
        trend: 'down',
        actionable: true,
        recommendation: 'Improve above-the-fold content and call-to-action visibility',
      })
    } else {
      insights.push({
        title: 'Engagement Strong',
        description: 'Bounce rate is healthy and trending well',
        metric: 'bounce_rate',
        value: `${(gaData.avg_bounce_rate * 100).toFixed(1)}%`,
        trend: 'up',
        actionable: false,
      })
    }

    if (gaData.avg_session_duration < 60) {
      insights.push({
        title: 'Short Session Duration',
        description: 'Average session is less than 1 minute',
        metric: 'session_duration',
        value: `${(gaData.avg_session_duration / 60).toFixed(1)}m`,
        trend: 'down',
        actionable: true,
        recommendation: 'Add more internal links and content recommendations to keep users engaged',
      })
    } else {
      insights.push({
        title: 'Strong Content Engagement',
        description: 'Users spending quality time on your content',
        metric: 'session_duration',
        value: `${(gaData.avg_session_duration / 60).toFixed(1)}m`,
        trend: 'up',
        actionable: false,
      })
    }
  }

  if (gscData) {
    if (gscData.metrics.ctr < 0.02) {
      insights.push({
        title: 'Low Search CTR',
        description: 'Click-through rate from search results is below average',
        metric: 'ctr',
        value: `${(gscData.metrics.ctr * 100).toFixed(2)}%`,
        trend: 'down',
        actionable: true,
        recommendation: 'Optimize meta descriptions and title tags for higher CTR',
      })
    } else {
      insights.push({
        title: 'Good Search Visibility',
        description: 'Your pages are attracting clicks from search results',
        metric: 'ctr',
        value: `${(gscData.metrics.ctr * 100).toFixed(2)}%`,
        trend: 'up',
        actionable: false,
      })
    }

    if (gscData.metrics.position > 10) {
      insights.push({
        title: 'Below Top 10 Rankings',
        description: 'Average ranking position is outside top 10',
        metric: 'position',
        value: `#${gscData.metrics.position.toFixed(1)}`,
        trend: 'down',
        actionable: true,
        recommendation: 'Focus on improving on-page SEO and building backlinks',
      })
    } else {
      insights.push({
        title: 'Strong Rankings',
        description: 'Averaging position in top 10 search results',
        metric: 'position',
        value: `#${gscData.metrics.position.toFixed(1)}`,
        trend: 'up',
        actionable: false,
      })
    }
  }

  if (indexingData && indexingData.crawlErrors > 0) {
    insights.push({
      title: 'Crawl Errors Detected',
      description: 'Google encountered errors crawling your site',
      metric: 'crawl_errors',
      value: indexingData.crawlErrors,
      trend: 'down',
      actionable: true,
      recommendation: 'Check Google Search Console for error details and fix immediately',
    })
  }

  return insights.slice(0, 4)
}
