/**
 * Supabase realtime subscription handlers for article progress and dashboard updates
 * Story 4a.6: Real-Time Progress Tracking and Updates
 * Story 15.1: Real-time Article Status Display
 */

import { createClient } from './client';
import { progressLogger } from '@/lib/utils/logger';
import type { ArticleProgress, ProgressUpdate } from '@/types/article';

export interface DashboardArticle {
  id: string;
  keyword: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  progress?: ArticleProgress;
}

export interface DashboardUpdateEvent {
  type: 'article_completed' | 'article_status_changed' | 'article_progress_updated';
  articleId: string;
  status: string;
  timestamp: string;
  orgId: string;
  metadata?: Record<string, unknown>;
}

export class ArticleProgressRealtime {
  private supabase;
  private subscription: any = null;
  private dashboardSubscription: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;
  private isDashboardConnected = false;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Subscribe to dashboard-level article updates for an organization
   */
  subscribeToDashboardUpdates(
    orgId: string,
    onDashboardUpdate: (event: DashboardUpdateEvent) => void,
    onError?: (error: Error) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    // Clean up existing dashboard subscription
    if (this.dashboardSubscription) {
      this.supabase.removeChannel(this.dashboardSubscription);
      this.dashboardSubscription = null;
    }

    const channelName = `dashboard_updates_${orgId}`;
    
    this.dashboardSubscription = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
          filter: `org_id=eq.${orgId}`,
        },
        (payload: any) => {
          progressLogger.log('Dashboard article update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const article = payload.new;
            const oldArticle = payload.old || {};
            
            // Determine the type of update
            let eventType: DashboardUpdateEvent['type'] = 'article_status_changed';
            
            if (article.status === 'completed' && oldArticle.status !== 'completed') {
              eventType = 'article_completed';
            } else if (article.status !== oldArticle.status) {
              eventType = 'article_status_changed';
            }
            
            const event: DashboardUpdateEvent = {
              type: eventType,
              articleId: article.id,
              status: article.status,
              timestamp: article.updated_at,
              orgId: article.org_id,
              metadata: {
                keyword: article.keyword,
                title: article.title,
                oldStatus: oldArticle.status,
                newStatus: article.status,
              }
            };
            
            onDashboardUpdate(event);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_progress',
          filter: `org_id=eq.${orgId}`,
        },
        (payload: any) => {
          progressLogger.log('Dashboard progress update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const progress = payload.new;
            const oldProgress = payload.old || {};
            
            // Create dashboard update event for progress changes
            const event: DashboardUpdateEvent = {
              type: 'article_progress_updated',
              articleId: progress.article_id,
              status: progress.status,
              timestamp: progress.updated_at,
              orgId: progress.org_id,
              metadata: {
                progressPercentage: progress.progress_percentage,
                currentSection: progress.current_section,
                totalSections: progress.total_sections,
                currentStage: progress.current_stage,
                wordCount: progress.word_count,
                oldProgress: oldProgress.progress_percentage,
                newProgress: progress.progress_percentage,
              }
            };
            
            onDashboardUpdate(event);
          }
        }
      )
      .subscribe((status: any) => {
        progressLogger.log('Dashboard subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          this.isDashboardConnected = true;
          onConnectionChange?.(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.isDashboardConnected = false;
          onConnectionChange?.(false);
          this.handleDashboardReconnection(orgId, onDashboardUpdate, onError, onConnectionChange);
        }
      });

    return this.dashboardSubscription;
  }

  /**
   * Handle automatic reconnection for dashboard subscriptions with exponential backoff
   */
  private handleDashboardReconnection(
    orgId: string,
    onDashboardUpdate: (event: DashboardUpdateEvent) => void,
    onError?: (error: Error) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Gracefully handle max reconnection attempts in both dev and production
      progressLogger.log(`Max reconnection attempts reached, switching to polling fallback`);
      onConnectionChange?.(false);
      
      // Only show error in development, not production
      if (process.env.NODE_ENV === 'development') {
        const error = new Error(`Failed to reconnect dashboard after ${this.maxReconnectAttempts} attempts`);
        progressLogger.error('Dashboard reconnection failed:', error.message);
        onError?.(error);
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    progressLogger.log(`Attempting dashboard reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      try {
        // Reset connection state before retrying
        this.isDashboardConnected = false;
        this.subscribeToDashboardUpdates(orgId, onDashboardUpdate, onError, onConnectionChange);
      } catch (error) {
        progressLogger.error('Dashboard reconnection failed:', error);
        this.handleDashboardReconnection(orgId, onDashboardUpdate, onError, onConnectionChange);
      }
    }, delay);
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
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
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
   * Unsubscribe from all progress updates
   */
  unsubscribe() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.isConnected = false;
    }
    
    if (this.dashboardSubscription) {
      this.supabase.removeChannel(this.dashboardSubscription);
      this.dashboardSubscription = null;
      this.isDashboardConnected = false;
    }
  }

  /**
   * Unsubscribe from dashboard updates only
   */
  unsubscribeFromDashboard() {
    if (this.dashboardSubscription) {
      this.supabase.removeChannel(this.dashboardSubscription);
      this.dashboardSubscription = null;
      this.isDashboardConnected = false;
    }
  }

  /**
   * Check if currently connected to article progress
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Check if currently connected to dashboard updates
   */
  isDashboardConnectionActive(): boolean {
    return this.isDashboardConnected;
  }

  /**
   * Get current connection status for article progress
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isConnected) return 'connected';
    if (this.reconnectAttempts > 0) return 'reconnecting';
    return 'disconnected';
  }

  /**
   * Get current connection status for dashboard
   */
  getDashboardConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isDashboardConnected) return 'connected';
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
    subscribeToDashboard: articleProgressRealtime.subscribeToDashboardUpdates.bind(articleProgressRealtime),
    unsubscribe: articleProgressRealtime.unsubscribe.bind(articleProgressRealtime),
    unsubscribeFromDashboard: articleProgressRealtime.unsubscribeFromDashboard.bind(articleProgressRealtime),
    isConnected: articleProgressRealtime.isConnectionActive.bind(articleProgressRealtime),
    isDashboardConnected: articleProgressRealtime.isDashboardConnectionActive.bind(articleProgressRealtime),
    getStatus: articleProgressRealtime.getConnectionStatus.bind(articleProgressRealtime),
    getDashboardStatus: articleProgressRealtime.getDashboardConnectionStatus.bind(articleProgressRealtime),
  };
}
