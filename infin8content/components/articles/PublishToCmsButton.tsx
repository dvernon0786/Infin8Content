'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExternalLink, Loader2, CheckCircle, AlertCircle, ChevronDown, Globe } from 'lucide-react'
import { CMS_PLATFORM_LABELS } from '@/lib/services/publishing/cms-engine'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'
import Link from 'next/link'

interface CmsConnection {
  id: string
  platform: CMSPlatform
  name: string
  credentials: Record<string, string>
}

interface PublishToCmsButtonProps {
  articleId: string
  articleStatus: string
  className?: string
}

export function PublishToCmsButton({ articleId, articleStatus, className }: PublishToCmsButtonProps) {
  const [connections, setConnections] = useState<CmsConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [selectedConnection, setSelectedConnection] = useState<CmsConnection | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    url?: string
    error?: string
    alreadyPublished?: boolean
    connectionName?: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/cms-connections')
      .then(r => r.json())
      .then(data => {
        const conns: CmsConnection[] = data.connections || []
        setConnections(conns)
        if (conns.length === 1) setSelectedConnection(conns[0])
      })
      .catch(() => setConnections([]))
      .finally(() => setIsLoadingConnections(false))
  }, [])

  const handlePublish = async (connection: CmsConnection) => {
    setIsPublishing(true)
    setResult(null)

    try {
      const response = await fetch('/api/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, connectionId: connection.id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          url: data.url,
          alreadyPublished: data.alreadyPublished,
          connectionName: connection.name,
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to publish',
          connectionName: connection.name,
        })
      }
    } catch {
      setResult({
        success: false,
        error: 'Network error occurred while publishing',
        connectionName: connection.name,
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Success state
  if (result?.success && result.url) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-lato text-green-800 font-medium">
                {result.alreadyPublished
                  ? `Already published to ${result.connectionName}`
                  : `Published to ${result.connectionName}`}
              </p>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-lato text-green-600 hover:text-green-800 text-sm mt-1"
              >
                View published article
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (result?.success === false) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-lato text-red-800 font-medium">Publishing failed</p>
              <p className="font-lato text-red-600 text-sm mt-1">{result.error}</p>
              <Button
                onClick={() => setResult(null)}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading connections
  if (isLoadingConnections) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading publishing options...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No connections configured
  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <p className="font-lato text-gray-700 font-medium">No CMS connected</p>
              <p className="font-lato text-gray-500 text-sm mt-0.5">
                Connect a platform to publish this article.
              </p>
              <Link
                href="/settings/integrations"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
              >
                Settings → Integrations
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Single connection — simple button
  if (connections.length === 1) {
    const conn = connections[0]
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div>
              <h3 className="font-poppins text-neutral-900 text-h4-desktop mb-1">
                Publish to {conn.name}
              </h3>
              <p className="font-lato text-neutral-500 text-sm">
                {CMS_PLATFORM_LABELS[conn.platform]}
              </p>
            </div>
            <Button
              onClick={() => handlePublish(conn)}
              disabled={isPublishing}
              size="lg"
              className={className}
            >
              {isPublishing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</>
              ) : (
                `Publish to ${conn.name}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Multiple connections — dropdown
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div>
            <h3 className="font-poppins text-neutral-900 text-h4-desktop mb-1">Publish Article</h3>
            <p className="font-lato text-neutral-500 text-sm">Choose your destination</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isPublishing} size="lg" className={className}>
                {isPublishing ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing...</>
                ) : (
                  <>Publish <ChevronDown className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[220px]">
              <DropdownMenuLabel>Choose destination</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {connections.map(conn => {
                const platformUrl = conn.credentials?.url || conn.credentials?.site_url
                return (
                  <DropdownMenuItem
                    key={conn.id}
                    onClick={() => handlePublish(conn)}
                    className="flex flex-col items-start"
                  >
                    <span className="font-medium">{conn.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {CMS_PLATFORM_LABELS[conn.platform]}
                      {platformUrl ? ` — ${platformUrl.replace(/^https?:\/\//, '')}` : ''}
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
