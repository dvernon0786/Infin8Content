'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardArticle, DashboardUpdateEvent } from '@/lib/supabase/realtime'

interface UseRealtimeArticlesOptions {
  orgId: string
  onDashboardUpdate?: (event: DashboardUpdateEvent) => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
  pollingInterval?: number
  enablePolling?: boolean
}

export function useRealtimeArticles({
  orgId,
  onDashboardUpdate,
  onError,
  onConnectionChange
}: UseRealtimeArticlesOptions) {
  const supabase = createClient()

  const [articles, setArticles] = useState<DashboardArticle[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const channelRef = useRef<any>(null)

  /* ---------------------------------------- */
  /* Initial Fetch (Single Source of Truth)  */
  /* ---------------------------------------- */

  const fetchArticles = useCallback(async () => {
    if (!orgId) return

    const { data, error } = await (supabase
      .from('articles')
      .select(`
        id,
        keyword,
        title,
        status,
        created_at,
        updated_at,
        generation_started_at,
        generation_completed_at,
        error_details,
        scheduled_at
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }) as any)

    if (error) {
      setError(error)
      if (onError) onError(error)
      return
    }

    setArticles(data || [])
    setLastUpdated(new Date().toISOString())
  }, [orgId, supabase, onError])

  /* ---------------------------------------- */
  /* Realtime Subscription                   */
  /* ---------------------------------------- */

  useEffect(() => {
    if (!orgId) return

    fetchArticles()

    const channel = supabase
      .channel(`articles-org-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
          filter: `org_id=eq.${orgId}`
        },
        (payload: any) => {
          // Trigger optional callback
          if (onDashboardUpdate) {
            onDashboardUpdate({
              type: payload.eventType === 'INSERT' ? 'new_article' : 'status_change',
              articleId: payload.new?.id,
              status: payload.new?.status
            } as any)
          }

          // Always re-fetch full truth from DB
          fetchArticles()
        }
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        setIsConnected(connected)
        if (onConnectionChange) onConnectionChange(connected)
      })

    channelRef.current = channel

    const interval = setInterval(() => {
      fetchArticles()
    }, 60000)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      clearInterval(interval)
    }
  }, [orgId, fetchArticles, supabase, onDashboardUpdate, onConnectionChange])

  return {
    articles,
    isConnected,
    connectionStatus: (isConnected ? 'connected' : 'reconnecting') as 'connected' | 'reconnecting' | 'disconnected', // Stub for backwards compatibility
    isPollingMode: false, // Stub for backwards compatibility
    error,
    lastUpdated,
    refresh: fetchArticles,
    reconnect: fetchArticles, // Stub for backwards compatibility
  }
}
