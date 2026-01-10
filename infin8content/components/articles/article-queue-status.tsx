'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, X, CheckCircle, Clock, AlertCircle, Eye, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'

interface QueuedArticle {
  id: string
  keyword: string
  title?: string
  status: 'queued' | 'generating' | 'completed' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
  position?: number
  progress?: {
    progress_percentage: number
    current_stage: string
    current_section: number
    total_sections: number
    word_count: number
    error_message?: string
  }
}

interface ArticleQueueStatusProps {
  organizationId: string
  showCompleted?: boolean
  maxItems?: number
}

export function ArticleQueueStatus({ 
  organizationId, 
  showCompleted = false,
  maxItems = 10 
}: ArticleQueueStatusProps) {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  const {
    articles,
    isConnected,
    connectionStatus,
    isPollingMode,
    error,
    lastUpdated,
    refresh,
    reconnect,
  } = useRealtimeArticles({
    orgId: organizationId,
    onError: (err) => console.error('Real-time error:', err),
    onConnectionChange: (connected) => {
      console.log('Connection status changed:', connected)
    },
    pollingInterval: 5000,
    enablePolling: true,
  })

  // Filter articles based on showCompleted preference
  const filteredArticles = articles
    .filter(article => showCompleted || article.status !== 'completed')
    .slice(0, maxItems)

  const handleCancel = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/cancel`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to cancel article')
      }
      // Real-time hook will automatically update the list
    } catch (err) {
      console.error('Failed to cancel article:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'queued':
        return 'secondary'
      case 'generating':
        return 'default'
      case 'completed':
        return 'outline'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return `${Math.floor(diffMins / 60)}h ago`
  }

  const getConnectionIndicator = () => {
    if (isPollingMode) {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Polling</span>
        </div>
      )
    }
    
    if (isConnected) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Wifi className="h-3 w-3" />
          <span className="text-xs">Live</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-1 text-red-600">
        <WifiOff className="h-3 w-3" />
        <span className="text-xs">Offline</span>
      </div>
    )
  }

  if (filteredArticles.length === 0) {
    return null // Don't show queue status if no articles
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Article Generation Queue
            <Badge variant="outline" className="text-xs">
              {filteredArticles.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {getConnectionIndicator()}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={connectionStatus === 'reconnecting'}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-red-600">
            {error.message || 'An error occurred'}
            {isPollingMode && ' (Using polling fallback)'}
          </div>
        )}
        
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Last updated: {formatTimeAgo(lastUpdated)}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const isExpanded = expandedArticle === article.id
            
            return (
              <div
                key={article.id}
                className="border rounded-md p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(article.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {article.title || article.keyword}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {article.keyword}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(article.status)}>
                      {article.status}
                    </Badge>
                    
                    {article.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => console.log('View article:', article.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {(article.status === 'queued' || article.status === 'generating') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCancel(article.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    >
                      {isExpanded ? '−' : '+'}
                    </Button>
                  </div>
                </div>
                
                {/* Progress for generating articles */}
                {article.status === 'generating' && article.progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{article.progress.current_stage}</span>
                      <span className="text-muted-foreground">
                        {article.progress.progress_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={article.progress.progress_percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Section {article.progress.current_section} of {article.progress.total_sections}
                      </span>
                      <span>{article.progress.word_count} words</span>
                    </div>
                  </div>
                )}
                
                {/* Error display */}
                {article.status === 'failed' && article.progress?.error_message && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {article.progress.error_message}
                  </div>
                )}
                
                {/* Expanded details */}
                {isExpanded && (
                  <div className="pt-3 border-t space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-muted-foreground">Created:</span>
                        <div>{formatTimeAgo(article.created_at)}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Updated:</span>
                        <div>{formatTimeAgo(article.updated_at)}</div>
                      </div>
                    </div>
                    
                    {article.progress && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium text-muted-foreground">Progress:</span>
                          <div>{article.progress.progress_percentage.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Sections:</span>
                          <div>{article.progress.current_section} / {article.progress.total_sections}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Words:</span>
                          <div>{article.progress.word_count}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Status:</span>
                          <div>{article.progress.current_stage}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          
          {filteredArticles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {showCompleted ? 'No articles found' : 'No active articles in queue'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

