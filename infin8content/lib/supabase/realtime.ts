/**
 * Supabase realtime subscription handlers for article progress
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { createClient } from './client';
import { progressLogger } from '@/lib/utils/logger';
import type { ArticleProgress, ProgressUpdate } from '@/types/article';

export class ArticleProgressRealtime {
  private supabase;
  private subscription: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Subscribe to progress updates for a specific article
   */
  subscribeToArticleProgress(
    articleId: string,
    onProgressUpdate: (progress: ArticleProgress) => void,
    onError?: (error: Error) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    // Clean up existing subscription
    this.unsubscribe();

    const channelName = `article_progress_${articleId}`;
    
    this.subscription = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_progress',
          filter: `article_id=eq.${articleId}`,
        },
        (payload: any) => {
          progressLogger.log('Progress update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const progress = payload.new as ArticleProgress;
            onProgressUpdate(progress);
          }
        }
      )
      .subscribe((status: any) => {
        progressLogger.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          onConnectionChange?.(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.isConnected = false;
          onConnectionChange?.(false);
          this.handleReconnection(articleId, onProgressUpdate, onError, onConnectionChange);
        }
      });

    return this.subscription;
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  private handleReconnection(
    articleId: string,
    onProgressUpdate: (progress: ArticleProgress) => void,
    onError?: (error: Error) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const error = new Error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      onError?.(error);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    progressLogger.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      try {
        this.subscribeToArticleProgress(articleId, onProgressUpdate, onError, onConnectionChange);
      } catch (error) {
        progressLogger.error('Reconnection failed:', error);
        this.handleReconnection(articleId, onProgressUpdate, onError, onConnectionChange);
      }
    }, delay);
  }

  /**
   * Unsubscribe from progress updates
   */
  unsubscribe() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if currently connected
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnected) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }
}

/**
 * Singleton instance for article progress realtime
 */
export const articleProgressRealtime = new ArticleProgressRealtime();

/**
 * Hook for subscribing to article progress in React components
 */
export function useArticleProgressRealtime() {
  return {
    subscribe: articleProgressRealtime.subscribeToArticleProgress.bind(articleProgressRealtime),
    unsubscribe: articleProgressRealtime.unsubscribe.bind(articleProgressRealtime),
    isConnected: articleProgressRealtime.isConnectionActive.bind(articleProgressRealtime),
    getStatus: articleProgressRealtime.getConnectionStatus.bind(articleProgressRealtime),
  };
}
