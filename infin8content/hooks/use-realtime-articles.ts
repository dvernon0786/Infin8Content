'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardArticle, DashboardUpdateEvent } from '@/lib/types/dashboard.types'
import type { Database } from '@/lib/supabase/database.types'

type ArticlesRow = Database['public']['Tables']['articles']['Row']

interface UseRealtimeArticlesOptions {
  orgId: string
  onDashboardUpdate?: (event: DashboardUpdateEvent) => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

export function useRealtimeArticles({
  orgId,
  onDashboardUpdate,
  onError,
  onConnectionChange
}: UseRealtimeArticlesOptions) {
  const supabase = useMemo(() => createClient(), [])

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
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          keyword,
          title,
          status,
          created_at,
          updated_at,
          scheduled_at,
          publish_at
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      const articlesData: DashboardArticle[] = (data ?? []).map(
        (row: any) => ({
          id: row.id,
          keyword: row.keyword,
          title: row.title || row.keyword || '',
          status: row.status,
          created_at: row.created_at ?? '',
          updated_at: row.updated_at ?? '',
          scheduled_at: row.scheduled_at ?? null,
          publish_at: row.publish_at ?? null,
        })
      )

      if (error) {
        setError(error)
        if (errorRef.current) errorRef.current(error)
        return
      }

      setArticles(articlesData || [])
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
            const oldStatus = payload.old?.status
            const newStatus = payload.new?.status

            let eventType: DashboardUpdateEvent['type'] | null = null

            if (newStatus === 'completed' && oldStatus !== 'completed') {
              eventType = 'article_completed'
            } else if (newStatus !== oldStatus) {
              eventType = 'article_status_changed'
            }

            if (eventType) {
              dashboardUpdateRef.current({
                type: eventType,
                articleId: payload.new.id,
                status: newStatus,
                timestamp: payload.new.updated_at,
                orgId: payload.new.org_id
              })
            }
          }

          // Always re-fetch full truth using ref
          fetchArticlesRef.current()
        }
      )
      .subscribe((status: string) => {
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
