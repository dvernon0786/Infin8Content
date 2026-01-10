/**
 * Real-time dashboard service for article status management
 * Story 15.1: Real-time Article Status Display
 */

import { createClient } from '@/lib/supabase/server';
import type { DashboardArticle, DashboardUpdateEvent } from '@/lib/supabase/realtime';
import type { ArticleProgress } from '@/types/article';

export interface RealtimeServiceConfig {
  orgId: string;
  pollingInterval?: number;
  maxRetries?: number;
  enableFallback?: boolean;
}

export interface ServiceStatus {
  isConnected: boolean;
  isPolling: boolean;
  lastUpdate: string | null;
  errorCount: number;
  lastError: string | null;
}

export class RealtimeDashboardService {
  private config: RealtimeServiceConfig;
  private status: ServiceStatus;
  private abortController: AbortController | null = null;

  constructor(config: RealtimeServiceConfig) {
    this.config = {
      pollingInterval: 5000, // 5 seconds
      maxRetries: 3,
      enableFallback: true,
      ...config,
    };
    
    this.status = {
      isConnected: false,
      isPolling: false,
      lastUpdate: null,
      errorCount: 0,
      lastError: null,
    };
  }

  /**
   * Get current service status
   */
  getStatus(): ServiceStatus {
    return { ...this.status };
  }

  /**
   * Fetch articles from the API with optional filtering
   */
  async fetchArticles(options: {
    since?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<{
    articles: DashboardArticle[];
    lastUpdated: string;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams({
        orgId: this.config.orgId,
        limit: (options.limit || 50).toString(),
      });
      
      if (options.since) {
        params.append('since', options.since);
      }
      
      if (options.status) {
        params.append('status', options.status);
      }

      const response = await fetch(`/api/articles/status?${params}`, {
        signal: this.abortController?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.updateStatus({
        lastUpdate: data.lastUpdated,
        errorCount: 0,
        lastError: null,
      });
      
      return data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Fetch queue status (active articles)
   */
  async fetchQueueStatus(options: {
    includeCompleted?: boolean;
    limit?: number;
  } = {}): Promise<{
    articles: DashboardArticle[];
    total: number;
  }> {
    try {
      const params = new URLSearchParams({
        orgId: this.config.orgId,
        limit: (options.limit || 20).toString(),
      });
      
      if (options.includeCompleted === false) {
        params.append('includeCompleted', 'false');
      }

      const response = await fetch(`/api/articles/queue?${params}`, {
        signal: this.abortController?.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch queue status: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.updateStatus({
        lastUpdate: new Date().toISOString(),
        errorCount: 0,
        lastError: null,
      });
      
      return {
        articles: data.articles.map((article: any) => ({
          id: article.id,
          keyword: article.keyword,
          title: article.title || '',
          status: article.status,
          created_at: article.created_at,
          updated_at: article.updated_at || article.created_at,
        })),
        total: data.total,
      };
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Get article progress details
   */
  async getArticleProgress(articleId: string): Promise<{
    article: DashboardArticle;
    progress: ArticleProgress | null;
  }> {
    try {
      const supabase = await createClient();
      
      // Get article details
      const { data: article, error: articleError } = await (supabase
        .from('articles' as any)
        .select('*')
        .eq('id', articleId)
        .eq('org_id', this.config.orgId)
        .single() as unknown as Promise<{ data: any; error: any }>);

      if (articleError) {
        throw new Error(`Failed to fetch article: ${articleError.message}`);
      }

      // Get progress details
      const { data: progress, error: progressError } = await (supabase
        .from('article_progress' as any)
        .select('*')
        .eq('article_id', articleId)
        .single() as unknown as Promise<{ data: any; error: any }>);

      if (progressError && progressError.code !== 'PGRST116') { // Not found is ok
        throw new Error(`Failed to fetch progress: ${progressError.message}`);
      }

      const dashboardArticle: DashboardArticle = {
        id: article.id,
        keyword: article.keyword,
        title: article.title || '',
        status: article.status,
        created_at: article.created_at,
        updated_at: article.updated_at,
        progress: progress || null,
      };

      this.updateStatus({
        lastUpdate: new Date().toISOString(),
        errorCount: 0,
        lastError: null,
      });

      return {
        article: dashboardArticle,
        progress: progress || null,
      };
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Update article status (internal use)
   */
  async updateArticleStatus(
    articleId: string, 
    status: string, 
    progress?: Partial<ArticleProgress>
  ): Promise<void> {
    try {
      const response = await fetch('/api/articles/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          status,
          progress,
        }),
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to update article status: ${response.statusText}`);
      }

      this.updateStatus({
        lastUpdate: new Date().toISOString(),
        errorCount: 0,
        lastError: null,
      });
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Start polling for updates
   */
  startPolling(callback: (articles: DashboardArticle[]) => void): NodeJS.Timeout {
    this.updateStatus({ isPolling: true });

    const pollInterval = setInterval(async () => {
      try {
        const { articles } = await this.fetchArticles();
        callback(articles);
      } catch (error) {
        console.error('Polling error:', error);
        // Don't throw here, let the error handling manage it
      }
    }, this.config.pollingInterval);

    return pollInterval;
  }

  /**
   * Stop polling
   */
  stopPolling(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    this.updateStatus({ isPolling: false });
  }

  /**
   * Cancel all ongoing requests
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Reset error count and status
   */
  reset(): void {
    this.updateStatus({
      errorCount: 0,
      lastError: null,
    });
  }

  /**
   * Create a new abort controller for requests
   */
  private createAbortController(): AbortController {
    this.cancel();
    this.abortController = new AbortController();
    return this.abortController;
  }

  /**
   * Update service status
   */
  private updateStatus(updates: Partial<ServiceStatus>): void {
    this.status = { ...this.status, ...updates };
  }

  /**
   * Handle errors with retry logic
   */
  private handleError(error: Error): void {
    this.updateStatus({
      errorCount: this.status.errorCount + 1,
      lastError: error.message,
    });

    // Log error for debugging
    console.error('RealtimeDashboardService error:', error);

    // If we've exceeded max retries, disable fallback if configured
    if (this.status.errorCount >= (this.config.maxRetries || 3) && this.config.enableFallback) {
      console.warn('Max retries exceeded, consider manual refresh');
    }
  }

  /**
   * Get connection health metrics
   */
  getHealthMetrics(): {
    isHealthy: boolean;
    uptime: number;
    averageResponseTime: number;
    successRate: number;
  } {
    // This would be enhanced with actual metrics tracking in a production implementation
    const isHealthy = this.status.errorCount < (this.config.maxRetries || 3);
    const uptime = this.status.lastUpdate 
      ? Date.now() - new Date(this.status.lastUpdate).getTime()
      : 0;
    
    return {
      isHealthy,
      uptime,
      averageResponseTime: 0, // Would be calculated from actual response times
      successRate: this.status.errorCount > 0 
        ? Math.max(0, 1 - this.status.errorCount / 10) // Simplified calculation
        : 1,
    };
  }
}

/**
 * Factory function to create a realtime dashboard service instance
 */
export function createRealtimeDashboardService(config: RealtimeServiceConfig): RealtimeDashboardService {
  return new RealtimeDashboardService(config);
}
