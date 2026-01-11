/**
 * React hook for real-time dashboard article updates
 * Story 15.1: Real-time Article Status Display
 */

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
  pollingInterval = 5000, // 5 seconds default
  enablePolling = true,
}: UseRealtimeArticlesOptions): UseRealtimeArticlesReturn {
  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isPollingMode, setIsPollingMode] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollRef = useRef<string | null>(null);
  
  // Performance monitoring
  const performanceMetricsRef = useRef({
    updateCount: 0,
    totalLatency: 0,
    averageLatency: 0,
    lastUpdateTimestamp: 0,
  });

  // Fetch articles from API
  const fetchArticles = useCallback(async (since?: string) => {
    try {
      const params = new URLSearchParams({
        orgId,
        limit: '50',
      });
      
      if (since) {
        params.append('since', since);
      }

      const response = await fetch(`/api/articles/queue?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }

      const data = await response.json();
      
      setArticles(prevArticles => {
        // Merge new articles with existing ones, avoiding duplicates
        const existingIds = new Set(prevArticles.map(a => a.id));
        const newArticles = data.articles.filter((a: DashboardArticle) => !existingIds.has(a.id));
        return [...newArticles, ...prevArticles].slice(0, 50); // Keep only 50 most recent
      });
      
      setLastUpdated(new Date().toISOString());
      setError(null);
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [orgId, onError]);

  // Handle dashboard updates from real-time subscription
  const handleDashboardUpdate = useCallback((event: DashboardUpdateEvent) => {
    onDashboardUpdate?.(event);
    
    // Track performance metrics
    const now = Date.now();
    const eventTime = new Date(event.timestamp).getTime();
    const latency = now - eventTime;
    
    const metrics = performanceMetricsRef.current;
    metrics.updateCount++;
    metrics.totalLatency += latency;
    metrics.averageLatency = metrics.totalLatency / metrics.updateCount;
    metrics.lastUpdateTimestamp = now;
    
    // Log performance warnings
    if (latency > 2000) { // > 2 seconds
      console.warn(`High latency detected: ${latency}ms for article ${event.articleId}`);
    }
    
    // Update local articles state based on the event
    setArticles(prevArticles => {
      const updatedArticles = [...prevArticles];
      const articleIndex = updatedArticles.findIndex(a => a.id === event.articleId);
      
      if (articleIndex >= 0) {
        // Update existing article
        updatedArticles[articleIndex] = {
          ...updatedArticles[articleIndex],
          status: event.status,
          updated_at: event.timestamp,
          ...event.metadata,
        };
      } else {
        // Add new article if it's not in the list
        if (event.metadata && typeof event.metadata === 'object') {
          const metadata = event.metadata as Record<string, unknown>;
          const newArticle: DashboardArticle = {
            id: event.articleId,
            keyword: (metadata.keyword as string) || '',
            title: (metadata.title as string) || '',
            status: event.status,
            created_at: event.timestamp,
            updated_at: event.timestamp,
          };
          updatedArticles.unshift(newArticle);
        }
      }
      
      // Sort by updated_at desc and keep only 50 most recent
      return updatedArticles
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 50);
    });
    
    setLastUpdated(event.timestamp);
  }, [onDashboardUpdate]);

  // Polling functions
  const startPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
    }
    
    pollingTimeoutRef.current = setInterval(async () => {
      try {
        await fetchArticles(lastPollRef.current || undefined);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, pollingInterval);
  }, [fetchArticles, pollingInterval]);

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
  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
    
    // Start polling on connection errors if enabled
    if (enablePolling && !isPollingMode) {
      setIsPollingMode(true);
      startPolling();
    }
  }, [enablePolling, isPollingMode, onError]);

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchArticles();
  }, [fetchArticles]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Force reconnection by unsubscribing and resubscribing
    articleProgressRealtime.unsubscribeFromDashboard();
    articleProgressRealtime.subscribeToDashboardUpdates(
      orgId,
      handleDashboardUpdate,
      handleError,
      handleConnectionChange
    );
  }, [orgId, handleDashboardUpdate, handleError, handleConnectionChange]);

  // Initialize real-time subscription
  useEffect(() => {
    if (!orgId) {
      return;
    }

    // Subscribe to dashboard updates
    articleProgressRealtime.subscribeToDashboardUpdates(
      orgId,
      handleDashboardUpdate,
      handleError,
      handleConnectionChange
    );

    // Initial fetch
    fetchArticles().catch(() => {
      // Error is handled in fetchArticles function
    });

    // Cleanup on unmount
    return () => {
      articleProgressRealtime.unsubscribeFromDashboard();
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [orgId, handleDashboardUpdate, handleError, handleConnectionChange, fetchArticles, stopPolling]);

  // Update polling reference when articles change
  useEffect(() => {
    if (lastUpdated) {
      lastPollRef.current = lastUpdated;
    }
  }, [lastUpdated]);

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
