/**
 * React hook for activity feed real-time updates
 * Story 23.2: Advanced Activity Feed
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { activityRealtime } from '@/lib/supabase/activity-realtime';
import type { ActivityEvent, ActivityWithUser, UseActivityFeedOptions, UseActivityFeedReturn, ActivityType } from '@/types/activity';

export function useActivityFeed({
  orgId,
  limit = 50,
  activityTypes,
  userId,
  dateRange,
  onActivityUpdate,
  onError,
  onConnectionChange,
}: UseActivityFeedOptions): UseActivityFeedReturn {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [isPollingMode, setIsPollingMode] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const currentOffsetRef = useRef<number>(0);
  
  // Performance monitoring
  const performanceMetricsRef = useRef({
    updateCount: 0,
    totalLatency: 0,
    averageLatency: 0,
    lastUpdateTimestamp: 0,
  });

  // Fetch activities from API
  const fetchActivities = useCallback(async (reset = false) => {
    if (!orgId) {
      console.warn('⚠️ No orgId available, skipping fetch');
      return null;
    }
    
    try {
      console.log('📡 Fetching activities for orgId:', orgId);
      
      const offset = reset ? 0 : currentOffsetRef.current;
      
      const result = await activityRealtime.fetchActivities(orgId, {
        limit,
        offset,
        activityTypes,
        userId,
        dateRange,
      });

      if (reset) {
        setActivities(result.activities);
        currentOffsetRef.current = result.activities.length;
      } else {
        setActivities(prev => [...prev, ...result.activities]);
        currentOffsetRef.current += result.activities.length;
      }
      
      setHasMore(result.hasMore);
      setLastUpdated(new Date().toISOString());
      setError(null);
      
      return result;
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
  }, [orgId, limit, activityTypes, userId, dateRange, onError]);

  // Load more activities
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      await fetchActivities(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, fetchActivities]);

  // Handle activity updates from real-time subscription
  const handleActivityUpdate = useCallback((event: ActivityEvent) => {
    onActivityUpdate?.(event);
    
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
      console.warn(`High latency detected: ${latency}ms for activity ${event.activity.id}`);
    }
    
    // Add new activity to the beginning of the list
    setActivities(prevActivities => {
      const updatedActivities = [event.activity, ...prevActivities];
      // Keep only the most recent activities based on limit
      return updatedActivities.slice(0, limit * 2); // Allow some buffer
    });
    
    setLastUpdated(event.timestamp);
  }, [onActivityUpdate, limit]);

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'reconnecting');
    onConnectionChange?.(connected);
    
    if (!connected && !isPollingMode) {
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
  }, [isPollingMode, onConnectionChange]);

  // Polling functions
  const startPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      console.log('📡 Polling already running, skipping');
      return;
    }
    
    console.log('🚀 Starting polling for activity feed');
    
    pollingTimeoutRef.current = setInterval(async () => {
      try {
        console.log('📡 Polling fetch triggered...');
        await fetchActivities(true); // Always refresh on polling
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // Poll every 30 seconds for activities
  }, [fetchActivities]);

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
    
    // Start polling on connection errors
    if (!isPollingMode) {
      setIsPollingMode(true);
      startPolling();
    }
  }, [isPollingMode, onError, startPolling]);

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchActivities(true);
  }, [fetchActivities]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Force reconnection by unsubscribing and resubscribing
    activityRealtime.unsubscribe();
    activityRealtime.subscribeToActivities(
      orgId,
      handleActivityUpdate,
      handleError,
      handleConnectionChange,
      activityTypes
    );
  }, [orgId, handleActivityUpdate, handleError, handleConnectionChange, activityTypes]);

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

    console.log('🔧 Initializing activity feed hook for orgId:', orgId);
    isInitializedRef.current = true;

    // Start polling immediately as a reliable fallback
    setIsPollingMode(true);
    startPolling();

    // Also try real-time subscription
    activityRealtime.subscribeToActivities(
      orgId,
      handleActivityUpdate,
      handleError,
      handleConnectionChange,
      activityTypes
    );

    // Initial fetch
    fetchActivities(true).catch(() => {
      // Error is handled in fetchActivities function
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up activity feed hook for orgId:', orgId);
      isInitializedRef.current = false;
      activityRealtime.unsubscribe();
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [orgId]); // Only depend on orgId, not on functions that change every render

  return {
    activities,
    isConnected,
    connectionStatus,
    isPollingMode,
    error,
    lastUpdated,
    refresh,
    reconnect,
    loadMore,
    hasMore,
    isLoading,
  };
}
