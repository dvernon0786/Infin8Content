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

  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to article status changes
    const subscription = supabase
      .channel(`article-${articleId}`)
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
            setTimeout(() => {
              router.refresh()
            }, 1000) // Small delay to ensure database is updated
          }
        }
      )
      .subscribe((status) => {
        console.log('Article status subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to article status updates')
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [articleId, status, onStatusChange, router])

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
    </div>
  )
}
