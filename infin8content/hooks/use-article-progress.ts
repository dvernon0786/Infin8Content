/**
 * React hook for real-time article progress tracking
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { articleProgressRealtime } from '@/lib/supabase/realtime';
import type { ArticleProgress } from '@/types/article';

interface UseArticleProgressOptions {
  articleId: string;
  onProgressUpdate?: (progress: ArticleProgress) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface UseArticleProgressReturn {
  progress: ArticleProgress | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  error: Error | null;
  reconnect: () => void;
}

export function useArticleProgress({
  articleId,
  onProgressUpdate,
  onError,
  onConnectionChange,
}: UseArticleProgressOptions): UseArticleProgressReturn {
  const [progress, setProgress] = useState<ArticleProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProgressUpdate = useCallback((newProgress: ArticleProgress) => {
    setProgress(newProgress);
    setError(null);
    onProgressUpdate?.(newProgress);
  }, [onProgressUpdate]);

  const handleError = useCallback((err: Error) => {
    setError(err);
    onError?.(err);
  }, [onError]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'reconnecting');
    onConnectionChange?.(connected);
    
    if (!connected) {
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Set status to disconnected after a short delay (to show reconnecting state first)
      reconnectTimeoutRef.current = setTimeout(() => {
        setConnectionStatus('disconnected');
      }, 3000);
    } else {
      // Clear reconnect timeout if connection is restored
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [onConnectionChange]);

  const reconnect = useCallback(() => {
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Force reconnection by unsubscribing and resubscribing
    articleProgressRealtime.unsubscribe();
    articleProgressRealtime.subscribeToArticleProgress(
      articleId,
      handleProgressUpdate,
      handleError,
      handleConnectionChange
    );
  }, [articleId, handleProgressUpdate, handleError, handleConnectionChange]);

  useEffect(() => {
    // Only subscribe if we have a valid article ID
    if (!articleId) {
      return;
    }

    // Subscribe to progress updates
    articleProgressRealtime.subscribeToArticleProgress(
      articleId,
      handleProgressUpdate,
      handleError,
      handleConnectionChange
    );

    // Cleanup on unmount
    return () => {
      articleProgressRealtime.unsubscribe();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [articleId, handleProgressUpdate, handleError, handleConnectionChange]);

  return {
    progress,
    isConnected,
    connectionStatus,
    error,
    reconnect,
  };
}
