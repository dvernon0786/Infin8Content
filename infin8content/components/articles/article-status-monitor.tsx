'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface ArticleStatusMonitorProps {
  articleId: string
  initialStatus: string
  onStatusChange?: (newStatus: string) => void
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  queued: 'secondary',
  generating: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
}

const statusIcons: Record<string, React.ReactNode> = {
  queued: <Clock className="h-4 w-4" />,
  generating: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
}

export function ArticleStatusMonitor({ 
  articleId, 
  initialStatus, 
  onStatusChange 
}: ArticleStatusMonitorProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const router = useRouter()

  console.log(`ArticleStatusMonitor initialized for article ${articleId} with status ${initialStatus}`)

  useEffect(() => {
    const supabase = createClient()
    let subscription: any = null
    let retryCount = 0
    const maxRetries = 3
    
    // Subscribe to article status changes with improved error handling
    const subscribeToStatus = () => {
      try {
        subscription = supabase
          .channel(`article-${articleId}`, {
            config: {
              broadcast: { self: true },
              presence: { key: articleId }
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'articles',
              filter: `id=eq.${articleId}`
            },
            (payload) => {
              const newStatus = payload.new.status as string
              console.log(`Article ${articleId} status changed: ${status} -> ${newStatus}`)
              
              setStatus(newStatus)
              onStatusChange?.(newStatus)
              
              // If article is completed, refresh the page to show content
              if (newStatus === 'completed') {
                console.log('Article completed, refreshing page...')
                // Force a hard refresh to ensure the page reloads completely
                setTimeout(() => {
                  window.location.reload()
                }, 1500) // Slightly longer delay to ensure database is updated
              }
            }
          )
          .subscribe((status) => {
            console.log('Article status subscription status:', status)
            if (status === 'SUBSCRIBED') {
              setIsSubscribed(true)
              retryCount = 0 // Reset retry count on successful subscription
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              console.error(`Subscription failed with status: ${status}`)
              setIsSubscribed(false)
              
              // Retry logic with exponential backoff
              if (retryCount < maxRetries) {
                retryCount++
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Max 5 second delay
                console.log(`Retrying subscription (${retryCount}/${maxRetries}) in ${delay}ms...`)
                setTimeout(subscribeToStatus, delay)
              } else {
                console.error('Max retry attempts reached, falling back to polling')
              }
            }
          })
      } catch (error) {
        console.error('Error creating subscription:', error)
        setIsSubscribed(false)
      }
    }

    // Start subscription
    subscribeToStatus()

    // Fallback: Check status periodically if WebSocket fails
    let intervalId: NodeJS.Timeout | null = null
    const checkStatusFallback = async () => {
      if (!isSubscribed && (status === 'queued' || status === 'generating')) {
        try {
          const { data, error } = await supabase
            .from('articles' as any)
            .select('status')
            .eq('id', articleId)
            .single()
          
          if (!error && data && (data as any).status !== status) {
            const newStatus = (data as any).status
            console.log(`Status fallback check found change: ${status} -> ${newStatus}`)
            setStatus(newStatus)
            onStatusChange?.(newStatus)
            
            if (newStatus === 'completed') {
              setTimeout(() => {
                window.location.reload()
              }, 1500)
            }
          }
        } catch (error) {
          console.error('Status fallback check failed:', error)
        }
      }
    }

    // Start fallback polling if not subscribed after 3 seconds
    const fallbackTimeout = setTimeout(() => {
      if (!isSubscribed) {
        console.log('WebSocket not subscribed, starting fallback polling')
        intervalId = setInterval(checkStatusFallback, 10000) // Check every 10 seconds
      }
    }, 3000)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
      if (intervalId) clearInterval(intervalId)
      clearTimeout(fallbackTimeout)
    }
  }, [articleId, status, onStatusChange, router]) // Remove isSubscribed from dependencies

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusColors[status] || 'secondary'} className="flex items-center gap-1">
        {statusIcons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
      {isSubscribed && (status === 'queued' || status === 'generating') && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Live updates active
        </span>
      )}
      {!isSubscribed && (status === 'queued' || status === 'generating') && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Polling for updates
        </span>
      )}
    </div>
  )
}
