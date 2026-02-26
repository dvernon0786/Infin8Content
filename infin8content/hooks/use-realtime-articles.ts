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
  const fetchingRef = useRef(false)

  // 1. Ref Hardening: Wrap all external callbacks in refs to avoid subscription churn
  const dashboardUpdateRef = useRef(onDashboardUpdate)
  const connectionChangeRef = useRef(onConnectionChange)
  const errorRef = useRef(onError)

  useEffect(() => {
    dashboardUpdateRef.current = onDashboardUpdate
    connectionChangeRef.current = onConnectionChange
    errorRef.current = onError
  }, [onDashboardUpdate, onConnectionChange, onError])

  /* ---------------------------------------- */
  /* Initial Fetch (Single Source of Truth)  */
  /* ---------------------------------------- */

  const fetchArticles = useCallback(async () => {
    if (!orgId || fetchingRef.current) return
    fetchingRef.current = true

    try {
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
        if (errorRef.current) errorRef.current(error)
        return
      }

      setArticles(data || [])
      setLastUpdated(new Date().toISOString())
    } finally {
      fetchingRef.current = false
    }
  }, [orgId, supabase])

  // 2. Ref Hardening: Wrap the fetcher itself in a ref for use inside the subscription effect
  const fetchArticlesRef = useRef(fetchArticles)
  useEffect(() => {
    fetchArticlesRef.current = fetchArticles
  }, [fetchArticles])

  /* ---------------------------------------- */
  /* Realtime Subscription                   */
  /* ---------------------------------------- */

  useEffect(() => {
    if (!orgId) return

    // Initial load
    fetchArticlesRef.current()

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
          // Trigger optional callback using ref
          if (dashboardUpdateRef.current) {
            dashboardUpdateRef.current({
              type: payload.eventType === 'INSERT' ? 'new_article' : 'status_change',
              articleId: payload.new?.id,
              status: payload.new?.status
            } as any)
          }

          // Always re-fetch full truth using ref
          fetchArticlesRef.current()
        }
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        setIsConnected(connected)
        if (connectionChangeRef.current) {
          connectionChangeRef.current(connected)
        }
      })

    channelRef.current = channel

    const interval = setInterval(() => {
      fetchArticlesRef.current()
    }, 60000)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      clearInterval(interval)
    }
  }, [orgId, supabase]) // Only re-subscribe if orgId or supabase instance changes

  return {
    articles,
    isConnected,
    connectionStatus: (isConnected ? 'connected' : 'reconnecting') as 'connected' | 'reconnecting' | 'disconnected',
    isPollingMode: false,
    error,
    lastUpdated,
    refresh: fetchArticles,
    reconnect: fetchArticles,
  }
}
