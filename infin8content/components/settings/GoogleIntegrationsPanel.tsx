'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart2, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { AnalyticsMeta, SearchConsoleMeta } from '@/lib/services/google/credential-manager'

type GoogleIntegrationMeta = AnalyticsMeta | SearchConsoleMeta

interface Banner {
  type: 'success' | 'error'
  message: string
}

export function GoogleIntegrationsPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [analyticsMeta, setAnalyticsMeta] = useState<AnalyticsMeta | null>(null)
  const [searchConsoleMeta, setSearchConsoleMeta] = useState<SearchConsoleMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<'analytics' | 'search_console' | null>(null)
  const [disconnecting, setDisconnecting] = useState<'analytics' | 'search_console' | null>(null)
  const [banner, setBanner] = useState<Banner | null>(null)

  // Load connection status and read URL params on mount
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const [analyticsRes, gscRes] = await Promise.all([
          fetch('/api/dashboard/google/analytics'),
          fetch('/api/dashboard/google/search-console'),
        ])

        const analyticsData = await analyticsRes.json()
        const gscData = await gscRes.json()

        if (analyticsData.connected !== false) {
          setAnalyticsMeta(analyticsData.meta || null)
        }
        if (gscData.connected !== false) {
          setSearchConsoleMeta(gscData.meta || null)
        }
      } catch (err) {
        console.error('Failed to load Google integration status:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStatus()

    // Check URL params for success/error feedback
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected) {
      setBanner({
        type: 'success',
        message: `${connected === 'analytics' ? 'Google Analytics' : 'Google Search Console'} connected successfully!`,
      })
      // Clean up URL
      router.replace('/dashboard/settings/integrations')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: 'You cancelled the authorization',
        unauthorized: 'Your session has expired',
        org_mismatch: 'Organization mismatch',
        unknown_service: 'Unknown service',
        server_error: 'Server error during authorization',
        missing_code: 'Missing authorization code',
      }
      setBanner({
        type: 'error',
        message: errorMessages[error] || `Authorization failed: ${error}`,
      })
      // Clean up URL
      router.replace('/dashboard/settings/integrations')
    }
  }, [searchParams, router])

  const handleConnect = async (service: 'analytics' | 'search_console') => {
    setConnecting(service)
    try {
      const res = await fetch(`/api/dashboard/google/oauth/start?service=${service}`)
      if (!res.ok) throw new Error('Failed to start OAuth')
      const data = await res.json()
      window.location.href = data.url
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message || 'Failed to start connection' })
      setConnecting(null)
    }
  }

  const handleDisconnect = async (service: 'analytics' | 'search_console') => {
    if (!confirm(`Disconnect ${service === 'analytics' ? 'Google Analytics' : 'Google Search Console'}?`)) {
      return
    }

    setDisconnecting(service)
    try {
      const res = await fetch(`/api/dashboard/google/disconnect?service=${service}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')

      if (service === 'analytics') {
        setAnalyticsMeta(null)
      } else {
        setSearchConsoleMeta(null)
      }

      setBanner({
        type: 'success',
        message: `${service === 'analytics' ? 'Google Analytics' : 'Google Search Console'} disconnected`,
      })
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message || 'Failed to disconnect' })
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      {banner && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            banner.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{banner.message}</p>
        </div>
      )}

      {/* Google Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Analytics Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Google Analytics</CardTitle>
              <Badge
                className="ml-auto text-xs"
                variant={analyticsMeta ? 'default' : 'secondary'}
              >
                {analyticsMeta ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsMeta ? (
              <>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {analyticsMeta.email}
                  </p>
                  {analyticsMeta.property_name && (
                    <p className="text-gray-600">
                      <span className="font-medium">Property:</span> {analyticsMeta.property_name}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs">
                    Connected {new Date(analyticsMeta.connected_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDisconnect('analytics')}
                  disabled={disconnecting === 'analytics'}
                >
                  {disconnecting === 'analytics' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Connect your Google Analytics account to view performance metrics.
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleConnect('analytics')}
                  disabled={connecting === 'analytics'}
                >
                  {connecting === 'analytics' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Connect with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Google Search Console Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-base">Search Console</CardTitle>
              <Badge
                className="ml-auto text-xs"
                variant={searchConsoleMeta ? 'default' : 'secondary'}
              >
                {searchConsoleMeta ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchConsoleMeta ? (
              <>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {searchConsoleMeta.email}
                  </p>
                  <p className="text-gray-600 break-all">
                    <span className="font-medium">Site:</span> {(searchConsoleMeta as any).site_url}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Connected {new Date(searchConsoleMeta.connected_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDisconnect('search_console')}
                  disabled={disconnecting === 'search_console'}
                >
                  {disconnecting === 'search_console' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Connect your Search Console account to view SEO metrics and search performance.
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleConnect('search_console')}
                  disabled={connecting === 'search_console'}
                >
                  {connecting === 'search_console' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Connect with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
