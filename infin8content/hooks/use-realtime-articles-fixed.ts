/**
 * React hook for real-time dashboard article updates
 * Story 15.1: Real-time Article Status Display
 * FIXED VERSION - Uses reconciliation instead of patching
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { articleProgressRealtime, type DashboardUpdateEvent, type DashboardArticle } from '@/lib/supabase/realtime';
import type { ArticleProgress } from '@/types/article';

interface UseRealtimeArticlesOptions {
  orgId: string;
  onDashboardUpdate?: (event: DashboardUpdateEvent) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  pollingInterval?: number; // milliseconds
  enablePolling?: boolean;
}

interface UseRealtimeArticlesReturn {
  articles: DashboardArticle[];
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isPollingMode: boolean;
  error: Error | null;
  lastUpdated: string | null;
  refresh: () => void;
  reconnect: () => void;
}

export function useRealtimeArticles({
  orgId,
  onDashboardUpdate,
  onError,
  onConnectionChange,
  pollingInterval = 120000, // 2 minutes
  enablePolling = true,
}: UseRealtimeArticlesOptions): UseRealtimeArticlesReturn {
  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isPollingMode, setIsPollingMode] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Refs for cleanup and performance tracking
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastPollRef = useRef<string | null>(null);
  const performanceMetricsRef = useRef({
    updateCount: 0,
    totalLatency: 0,
    averageLatency: 0,
    lastUpdateTimestamp: 0,
  });

  // Fetch articles from API
  const fetchArticles = useCallback(async (since?: string) => {
    if (!orgId) {
      console.warn('🔥 fetchArticles called without orgId');
      return [];
    }

    try {
      console.log('📡 Fetching articles for orgId:', orgId);
      
      const url = since 
        ? `/api/articles/queue?orgId=${orgId}&limit=50&since=${since}`
        : `/api/articles/queue?orgId=${orgId}&limit=50`;
      
      console.log('📡 Fetching articles from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📡 Response status:', response.status);
      
      // Transform API response to DashboardArticle format
      const transformedArticles: DashboardArticle[] = data.map((article: any) => ({
        id: article.id,
        keyword: article.keyword,
        title: article.title,
        status: article.status,
        created_at: article.created_at,
        updated_at: article.updated_at,
        target_word_count: article.target_word_count,
        writing_style: article.writing_style,
        target_audience: article.target_audience,
        custom_instructions: article.custom_instructions,
        inngest_event_id: article.inngest_event_id,
        created_by: article.created_by,
        outline: article.outline,
        sections: article.sections,
        current_section_index: article.current_section_index,
        generation_started_at: article.generation_started_at,
        generation_completed_at: article.generation_completed_at,
        error_details: article.error_details,
        outline_generation_duration_ms: article.outline_generation_duration_ms,
      }));

      console.log('🔄 fetchArticles called with data:', transformedArticles.length, 'articles');
      console.log('📊 Current state has:', articles.length, 'articles');

      // Update state with new articles
      setArticles(prevArticles => {
        const newArticles = since ? [...prevArticles] : [];
        
        if (since) {
          // Incremental update for polling
          transformedArticles.forEach((newArticle: DashboardArticle) => {
            const existingIndex = newArticles.findIndex(a => a.id === newArticle.id);
            if (existingIndex >= 0) {
              newArticles[existingIndex] = newArticle;
              console.log('🔄 Updated article:', newArticle.id);
            } else {
              newArticles.unshift(newArticle);
              console.log('➕ Adding new article:', newArticle.id);
            }
          });
        } else {
          // Full replace for initial fetch
          transformedArticles.forEach((article: DashboardArticle) => {
            console.log('➕ Adding new article:', article.id);
          });
          return transformedArticles;
        }
        
        console.log('✅ Final result has:', newArticles.length, 'articles');
        return newArticles;
      });

      // Update last poll timestamp for incremental updates
      if (since) {
        lastPollRef.current = since;
      } else {
        setLastUpdated(new Date().toISOString());
      }

      setError(null);
      
      return transformedArticles;
    } catch (err) {
      const error = err as Error;
      console.error('🔥 Fetch error details:', {
        message: error.message,
        stack: error.stack,
        orgId,
        timestamp: new Date().toISOString()
      });
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [orgId, onError, articles.length]);

  // Handle dashboard updates from real-time subscription
  const handleDashboardUpdate = useCallback((event: DashboardUpdateEvent) => {
    console.log('🛰️ Realtime signal received → refetching articles', {
      type: event.type,
      articleId: event.articleId,
      status: event.status
    });
    
    // ⚠️ Do NOT patch articles state directly from realtime payloads.
    // Multiple tables emit events. Always reconcile with DB.
    fetchArticles();
    
    // Still emit event for other listeners
    onDashboardUpdate?.(event);
  }, [fetchArticles, onDashboardUpdate]);

  // Polling functions
  const startPolling = useCallback(() => {
    // Prevent starting polling if it's already running
    if (pollingTimeoutRef.current) {
      console.log('📡 Polling already running, skipping');
      return;
    }
    
    // Don't start polling if we have no articles (reduces unnecessary API calls)
    if (articles.length === 0 && !lastUpdated) {
      console.log('📡 No articles to poll, skipping');
      return;
    }
    
    console.log('🚀 Starting polling with interval:', pollingInterval);
    
    pollingTimeoutRef.current = setInterval(async () => {
      try {
        console.log('📡 Polling fetch triggered...');
        await fetchArticles(lastPollRef.current || undefined);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, pollingInterval);
  }, [fetchArticles, pollingInterval, articles.length, lastUpdated]);

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'reconnecting');
    onConnectionChange?.(connected);
    
    if (!connected && enablePolling && !isPollingMode) {
      // Start polling if real-time connection fails
      setIsPollingMode(true);
      startPolling();
    } else if (connected && isPollingMode) {
      // Stop polling when real-time connection is restored
      setIsPollingMode(false);
      stopPolling();
    }
    
    // Set to disconnected after a delay if not reconnected
    if (!connected) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        setConnectionStatus('disconnected');
      }, 3000);
    } else {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [enablePolling, isPollingMode, onConnectionChange, startPolling, stopPolling]);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.error('🔥 Realtime error:', error);
    setError(error);
    onError?.(error);
  }, [onError]);

  // Refresh function
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    return fetchArticles();
  }, [fetchArticles]);

  // Reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered');
    articleProgressRealtime.unsubscribeFromDashboard();
    setIsPollingMode(false);
    stopPolling();
    isInitializedRef.current = false;
    
    // Re-initialize will happen in useEffect
  }, [stopPolling]);

  // Initialize real-time subscription
  useEffect(() => {
    if (!orgId) {
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('🔧 Already initialized, skipping');
      return;
    }

    console.log('🔧 Initializing hook for orgId:', orgId);
    isInitializedRef.current = true;

    // Initial fetch first, then start polling if needed
    fetchArticles().then(() => {
      // Only start polling after initial fetch if we have articles
      if (enablePolling && !isPollingMode && articles.length > 0) {
        console.log('🚀 Starting polling after initial fetch');
        setIsPollingMode(true);
        startPolling();
      }
    }).catch(() => {
      // Error is handled in fetchArticles function
    });

    // Also try real-time subscription
    articleProgressRealtime.subscribeToDashboardUpdates(
      orgId,
      handleDashboardUpdate,
      handleError,
      handleConnectionChange
    );

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up hook for orgId:', orgId);
      isInitializedRef.current = false;
      articleProgressRealtime.unsubscribeFromDashboard();
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [orgId, handleDashboardUpdate, handleError, handleConnectionChange]);

  return {
    articles,
    isConnected,
    connectionStatus,
    isPollingMode,
    error,
    lastUpdated,
    refresh,
    reconnect,
  };
}
