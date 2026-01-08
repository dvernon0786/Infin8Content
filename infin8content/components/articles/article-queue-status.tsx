'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

interface QueuedArticle {
  id: string
  keyword: string
  status: 'queued' | 'generating'
  created_at: string
  position?: number
}

interface ArticleQueueStatusProps {
  organizationId: string
}

export function ArticleQueueStatus({ organizationId }: ArticleQueueStatusProps) {
  const [articles, setArticles] = useState<QueuedArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchQueueStatus = async () => {
      try {
        const response = await fetch(`/api/articles/queue?orgId=${organizationId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch queue status')
        }
        const data = await response.json()
        
        // Only update state if component is still mounted
        if (isMounted) {
          setArticles(data.articles || [])
          setError(null)
        }
      } catch (err) {
        console.error('Failed to fetch queue status:', err)
        // Only update state if component is still mounted
        if (isMounted) {
          setError('Failed to load queue status')
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchQueueStatus()
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchQueueStatus, 5000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [organizationId])

  const handleCancel = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/cancel`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to cancel article')
      }
      // Refresh queue status
      fetchQueueStatus()
    } catch (err) {
      console.error('Failed to cancel article:', err)
      setError('Failed to cancel article')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading queue status...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (articles.length === 0) {
    return null // Don't show queue status if no articles
  }

  const generatingArticle = articles.find(a => a.status === 'generating')
  const queuedArticles = articles.filter(a => a.status === 'queued')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Article Generation Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Currently Generating */}
          {generatingArticle && (
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">{generatingArticle.keyword}</p>
                  <p className="text-xs text-muted-foreground">Currently generating...</p>
                </div>
              </div>
              <Badge variant="default">Generating</Badge>
            </div>
          )}

          {/* Queued Articles */}
          {queuedArticles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Queued Articles</p>
              {queuedArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{article.keyword}</p>
                      <p className="text-xs text-muted-foreground">
                        Position {index + 1} in queue
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Queued</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancel(article.id)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {articles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No articles in queue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

