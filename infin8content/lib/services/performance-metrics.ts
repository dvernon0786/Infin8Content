/**
 * Performance Metrics Service
 * Story 32.2: Efficiency & Performance Metrics
 * Task 1.1: Set up performance monitoring service
 * 
 * Provides centralized performance tracking and metrics collection
 * for efficiency monitoring and dashboard analytics.
 */

import { createClient } from '@/lib/supabase/client'

export type MetricType = 'article_time' | 'dashboard_load' | 'comment_latency' | 'progress_update'

export interface PerformanceMetric {
  metric_type: MetricType
  metric_value: number
  target_value?: number
  user_id?: string
  article_id?: string
  session_id?: string
  metadata?: Record<string, any>
}

export interface MetricQueryOptions {
  metric_type?: MetricType
  date_from?: string
  date_to?: string
  user_id?: string
  article_id?: string
  limit?: number
}

export interface EfficiencySummary {
  timeToFirstArticle: {
    average: number
    target: number
    achievementRate: number
    trend: 'improving' | 'declining' | 'stable'
  }
  reviewCycleReduction: {
    average: number
    target: number
    achievementRate: number
    trend: 'improving' | 'declining' | 'stable'
  }
  dashboardPerformance: {
    averageLoadTime: number
    target: number
    achievementRate: number
    trend: 'improving' | 'declining' | 'stable'
  }
}

class PerformanceMetricsService {
  private supabase = createClient()
  private batchQueue: PerformanceMetric[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 100
  private readonly BATCH_TIMEOUT = 5000 // 5 seconds

  /**
   * Track a performance metric
   */
  async trackMetric(metric: PerformanceMetric): Promise<boolean> {
    try {
      // Validate metric data
      this.validateMetric(metric)

      // Add to batch queue for async processing
      this.batchQueue.push(metric)

      // Process batch if size limit reached
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.processBatch()
      } else if (!this.batchTimer) {
        // Set timer to process batch after timeout
        this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT)
      }

      return true
    } catch (error) {
      console.error('[PerformanceMetricsService] Failed to track metric:', error)
      return false
    }
  }

  /**
   * Get metrics with optional filtering
   */
  async getMetrics(options: MetricQueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase
        .from('performance_metrics')
        .select('*')

      // Apply filters
      if (options.metric_type) {
        query = query.eq('metric_type', options.metric_type)
      }
      if (options.user_id) {
        query = query.eq('user_id', options.user_id)
      }
      if (options.article_id) {
        query = query.eq('article_id', options.article_id)
      }
      if (options.date_from) {
        query = query.gte('created_at', options.date_from)
      }
      if (options.date_to) {
        query = query.lte('created_at', options.date_to)
      }

      // Order by creation date (newest first) and limit
      query = query.order('created_at', { ascending: false })
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('[PerformanceMetricsService] Failed to get metrics:', error)
      return []
    }
  }

  /**
   * Get efficiency summary for dashboard (optimized with single query)
   */
  async getEfficiencySummary(): Promise<EfficiencySummary> {
    try {
      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      // Single optimized query to get all needed metrics
      const allMetrics = await this.getMetrics({
        date_from: previousWeek.toISOString(),
        limit: 5000 // Get enough data for both periods
      })

      // Filter metrics by time period and type
      const recentMetrics = allMetrics.filter(m => 
        new Date(m.created_at) >= lastWeek
      )
      const previousPeriodMetrics = allMetrics.filter(m => 
        new Date(m.created_at) >= previousWeek && new Date(m.created_at) < lastWeek
      )

      // Calculate current period averages
      const currentArticleMetrics = recentMetrics.filter(m => m.metric_type === 'article_time')
      const currentDashboardMetrics = recentMetrics.filter(m => m.metric_type === 'dashboard_load')
      const currentCommentMetrics = recentMetrics.filter(m => m.metric_type === 'comment_latency')

      // Calculate previous period averages
      const previousArticleMetrics = previousPeriodMetrics.filter(m => m.metric_type === 'article_time')
      const previousDashboardMetrics = previousPeriodMetrics.filter(m => m.metric_type === 'dashboard_load')
      const previousCommentMetrics = previousPeriodMetrics.filter(m => m.metric_type === 'comment_latency')

      // Calculate averages and trends
      const currentArticleAvg = this.calculateAverage(currentArticleMetrics)
      const previousArticleAvg = this.calculateAverage(previousArticleMetrics)
      const articleTrend = this.calculateTrend(currentArticleAvg, previousArticleAvg)

      const currentDashboardAvg = this.calculateAverage(currentDashboardMetrics)
      const previousDashboardAvg = this.calculateAverage(previousDashboardMetrics)
      const dashboardTrend = this.calculateTrend(currentDashboardAvg, previousDashboardAvg)

      // Calculate review cycle reduction based on actual comment latency
      const currentReviewCycle = currentArticleAvg + this.calculateAverage(currentCommentMetrics)
      const previousReviewCycle = previousArticleAvg + this.calculateAverage(previousCommentMetrics)
      const reviewCycleReductionRate = previousReviewCycle > 0 ? 
        ((previousReviewCycle - currentReviewCycle) / previousReviewCycle) * 100 : 0

      return {
        timeToFirstArticle: {
          average: currentArticleAvg,
          target: 15, // 15 minutes target
          achievementRate: currentArticleAvg > 0 ? 15 / currentArticleAvg : 0,
          trend: articleTrend
        },
        reviewCycleReduction: {
          average: Math.max(0, reviewCycleReductionRate), // Ensure non-negative
          target: 60, // 60% reduction target
          achievementRate: Math.max(0, reviewCycleReductionRate) / 60,
          trend: reviewCycleReductionRate > 5 ? 'improving' : 
                 reviewCycleReductionRate < -5 ? 'declining' : 'stable'
        },
        dashboardPerformance: {
          averageLoadTime: currentDashboardAvg,
          target: 2, // 2 seconds target
          achievementRate: currentDashboardAvg > 0 ? 2 / currentDashboardAvg : 0,
          trend: dashboardTrend
        }
      }
    } catch (error) {
      console.error('[PerformanceMetricsService] Failed to get efficiency summary:', error)
      return this.getDefaultEfficiencySummary()
    }
  }

  /**
   * Process batch of metrics for database insertion
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const batch = [...this.batchQueue]
    this.batchQueue = []

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    try {
      const { error } = await this.supabase
        .from('performance_metrics')
        .insert(batch.map(metric => ({
          ...metric,
          created_at: new Date().toISOString()
        })))

      if (error) {
        throw error
      }

      console.log(`[PerformanceMetricsService] Processed batch of ${batch.length} metrics`)
    } catch (error) {
      console.error('[PerformanceMetricsService] Failed to process batch:', error)
      // Re-queue failed metrics for retry (with limit to prevent memory issues)
      if (this.batchQueue.length < this.BATCH_SIZE * 2) {
        this.batchQueue.unshift(...batch.slice(0, 10)) // Retry first 10 metrics
      }
    }
  }

  /**
   * Validate metric data
   */
  private validateMetric(metric: PerformanceMetric): void {
    const validTypes: MetricType[] = ['article_time', 'dashboard_load', 'comment_latency', 'progress_update']
    
    if (!validTypes.includes(metric.metric_type)) {
      throw new Error(`Invalid metric type: ${metric.metric_type}`)
    }

    if (typeof metric.metric_value !== 'number' || metric.metric_value < 0) {
      throw new Error('Metric value must be a positive number')
    }

    if (metric.metric_value > 999999999.999) {
      throw new Error('Metric value too large (max 999,999,999.999)')
    }

    if (metric.target_value && (typeof metric.target_value !== 'number' || metric.target_value < 0)) {
      throw new Error('Target value must be a positive number')
    }

    // Validate UUID formats for optional fields
    if (metric.user_id && !this.isValidUUID(metric.user_id)) {
      throw new Error('Invalid user_id format')
    }

    if (metric.article_id && !this.isValidUUID(metric.article_id)) {
      throw new Error('Invalid article_id format')
    }

    // Validate metadata size
    if (metric.metadata && JSON.stringify(metric.metadata).length > 1024) {
      throw new Error('Metadata too large (max 1KB)')
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Calculate average from metrics array
   */
  private calculateAverage(metrics: any[]): number {
    if (metrics.length === 0) return 0
    const sum = metrics.reduce((acc, metric) => acc + (metric.metric_value || 0), 0)
    return sum / metrics.length
  }

  /**
   * Calculate trend based on current vs previous values
   */
  private calculateTrend(current: number, previous: number): 'improving' | 'declining' | 'stable' {
    if (previous === 0) return 'stable'
    
    const change = (current - previous) / previous
    const threshold = 0.05 // 5% threshold for considering it a trend

    if (Math.abs(change) < threshold) return 'stable'
    return change > 0 ? 'declining' : 'improving' // Lower values are better for performance metrics
  }

  /**
   * Get default efficiency summary when data is unavailable
   */
  private getDefaultEfficiencySummary(): EfficiencySummary {
    return {
      timeToFirstArticle: {
        average: 0,
        target: 15,
        achievementRate: 0,
        trend: 'stable'
      },
      reviewCycleReduction: {
        average: 0,
        target: 60,
        achievementRate: 0,
        trend: 'stable'
      },
      dashboardPerformance: {
        averageLoadTime: 0,
        target: 2,
        achievementRate: 0,
        trend: 'stable'
      }
    }
  }

  /**
   * Cleanup method to process any remaining batch
   */
  async cleanup(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    await this.processBatch()
  }
}

// Export singleton instance
export const performanceMetricsService = new PerformanceMetricsService()

/**
 * Performance tracking decorator for functions
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricType: MetricType,
  getContext?: (...args: Parameters<T>) => Partial<PerformanceMetric>
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now()
    
    try {
      const result = await fn(...args)
      const duration = Date.now() - startTime
      
      // Track performance metric
      const context = getContext ? getContext(...args) : {}
      await performanceMetricsService.trackMetric({
        metric_type: metricType,
        metric_value: duration / 1000, // Convert to seconds
        ...context
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Track failed performance
      const context = getContext ? getContext(...args) : {}
      await performanceMetricsService.trackMetric({
        metric_type: metricType,
        metric_value: duration / 1000,
        metadata: { ...context.metadata, error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      throw error
    }
  }) as T
}
