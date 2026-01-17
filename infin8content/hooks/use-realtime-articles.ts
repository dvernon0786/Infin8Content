/**
 * React hook for real-time dashboard article updates
 * Story 15.1: Real-time Article Status Display
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
  pollingInterval = 120000, // 2 minutes default (articles take >2 mins to complete)
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
  const isInitializedRef = useRef<boolean>(false);
  
  // Performance monitoring
  const performanceMetricsRef = useRef({
    updateCount: 0,
    totalLatency: 0,
    averageLatency: 0,
    lastUpdateTimestamp: 0,
  });

  // Fetch articles from API
  const fetchArticles = useCallback(async (since?: string) => {
    if (!orgId) {
      console.warn('⚠️ No orgId available, skipping fetch');
      return null;
    }
    
    try {
      console.log('📡 Fetching articles for orgId:', orgId);
      const params = new URLSearchParams({
        orgId,
        limit: '50',
      });
      
      if (since) {
        params.append('since', since);
      }

      console.log('📡 Fetching articles from:', `/api/articles/queue?${params}`);
      
      const response = await fetch(`/api/articles/queue?${params}`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ API Response error:', response.status, response.statusText);
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setArticles(prevArticles => {
        console.log('🔄 fetchArticles called with data:', data.articles.length, 'articles');
        console.log('📊 Current state has:', prevArticles.length, 'articles');
        
        // Create a map of existing articles for quick lookup
        const existingMap = new Map(prevArticles.map(a => [a.id, a]));
        
        // Update existing articles and add new ones
        const updatedArticles = data.articles.map((fetchedArticle: DashboardArticle) => {
          const existing = existingMap.get(fetchedArticle.id);
          if (existing) {
            console.log('🔄 Updating existing article:', fetchedArticle.id, 'from', existing.status, 'to', fetchedArticle.status);
            // Update existing article with new data
            return {
              ...existing,
              ...fetchedArticle,
              // Preserve progress if it exists in the existing article but not in fetched data
              progress: fetchedArticle.progress || existing.progress
            };
          }
          console.log('➕ Adding new article:', fetchedArticle.id);
          // Return new article as-is
          return fetchedArticle;
        });
        
        // Add any existing articles that weren't in the fetch response (for articles that might be filtered out)
        const fetchedIds = new Set(data.articles.map((a: DashboardArticle) => a.id));
        const remainingArticles = prevArticles.filter(a => !fetchedIds.has(a.id));
        
        // Combine and sort by updated_at desc, keep only 50 most recent
        const result = [...updatedArticles, ...remainingArticles]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 50);
          
        console.log('✅ Final result has:', result.length, 'articles');
        return result;
      });
      
      setLastUpdated(new Date().toISOString());
      setError(null);
      
      return data;
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
  }, [orgId]); // Only depend on orgId, not on functions that change every render

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
