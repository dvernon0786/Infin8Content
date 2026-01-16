/**
 * Performance Metrics Service Tests
 * Story 32.2: Efficiency & Performance Metrics
 * Task 1.1: Set up performance monitoring service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performanceMetricsService } from '@/lib/services/performance-metrics'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client')
const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  single: vi.fn(),
  then: vi.fn(),
  catch: vi.fn(),
}

describe('PerformanceMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(mockSupabase)
  })

  describe('trackMetric', () => {
    it('should track a performance metric with valid data', async () => {
      const mockInsert = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
      }
      vi.mocked(mockSupabase.from).mockReturnValue(mockInsert as any)

      const result = await performanceMetricsService.trackMetric({
        metric_type: 'article_time',
        metric_value: 12.5,
        user_id: 'user-123',
        article_id: 'article-123',
        session_id: 'session-123',
        target_value: 15.0,
        metadata: { source: 'article_generation' }
      })

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('performance_metrics')
      expect(mockInsert.insert).toHaveBeenCalledWith({
        metric_type: 'article_time',
        metric_value: 12.5,
        user_id: 'user-123',
        article_id: 'article-123',
        session_id: 'session-123',
        target_value: 15.0,
        metadata: { source: 'article_generation' }
      })
    })

    it('should reject invalid metric types', async () => {
      await expect(performanceMetricsService.trackMetric({
        metric_type: 'invalid_type' as any,
        metric_value: 12.5
      })).rejects.toThrow('Invalid metric type')
    })

    it('should reject negative metric values', async () => {
      await expect(performanceMetricsService.trackMetric({
        metric_type: 'article_time',
        metric_value: -5
      })).rejects.toThrow('Metric value must be positive')
    })

    it('should handle database errors gracefully', async () => {
      const mockInsert = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      }
      vi.mocked(mockSupabase.from).mockReturnValue(mockInsert as any)

      const result = await performanceMetricsService.trackMetric({
        metric_type: 'article_time',
        metric_value: 12.5
      })

      expect(result).toBe(false)
    })
  })

  describe('getMetrics', () => {
    it('should retrieve metrics for a specific time range', async () => {
      const mockData = [
        { id: '1', metric_type: 'article_time', metric_value: 12.5, created_at: '2024-01-16T10:00:00Z' },
        { id: '2', metric_type: 'dashboard_load', metric_value: 1.8, created_at: '2024-01-16T11:00:00Z' }
      ]

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
      }
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery as any)
      })

      const result = await performanceMetricsService.getMetrics({
        metric_type: 'article_time',
        date_from: '2024-01-16T00:00:00Z',
        date_to: '2024-01-16T23:59:59Z',
        limit: 100
      })

      expect(result).toEqual(mockData)
      expect(mockQuery.eq).toHaveBeenCalledWith('metric_type', 'article_time')
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-16T00:00:00Z')
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-16T23:59:59Z')
    })

    it('should return empty array when no metrics found', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery as any)
      })

      const result = await performanceMetricsService.getMetrics({
        metric_type: 'article_time'
      })

      expect(result).toEqual([])
    })
  })

  describe('getEfficiencySummary', () => {
    it('should calculate efficiency summary with real data', async () => {
      const mockData = [
        { metric_value: 12.5, created_at: '2024-01-16T10:00:00Z', metric_type: 'article_time' },
        { metric_value: 14.2, created_at: '2024-01-16T11:00:00Z', metric_type: 'article_time' },
        { metric_value: 11.8, created_at: '2024-01-16T12:00:00Z', metric_type: 'article_time' },
        { metric_value: 1.5, created_at: '2024-01-16T10:00:00Z', metric_type: 'dashboard_load' },
        { metric_value: 2.1, created_at: '2024-01-16T11:00:00Z', metric_type: 'dashboard_load' },
        { metric_value: 0.8, created_at: '2024-01-16T10:00:00Z', metric_type: 'comment_latency' },
        { metric_value: 1.2, created_at: '2024-01-16T11:00:00Z', metric_type: 'comment_latency' },
        // Previous period data
        { metric_value: 15.0, created_at: '2024-01-09T10:00:00Z', metric_type: 'article_time' },
        { metric_value: 16.5, created_at: '2024-01-09T11:00:00Z', metric_type: 'article_time' },
        { metric_value: 2.8, created_at: '2024-01-09T10:00:00Z', metric_type: 'dashboard_load' },
        { metric_value: 1.5, created_at: '2024-01-09T10:00:00Z', metric_type: 'comment_latency' }
      ]

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockData, error: null })
        } as any)
      })

      const result = await performanceMetricsService.getEfficiencySummary()

      expect(result.timeToFirstArticle).toBeDefined()
      expect(result.timeToFirstArticle.average).toBeCloseTo(12.83, 2)
      expect(result.timeToFirstArticle.target).toBe(15)
      expect(result.reviewCycleReduction).toBeDefined()
      expect(result.dashboardPerformance).toBeDefined()
      expect(result.dashboardPerformance.averageLoadTime).toBeCloseTo(1.8, 2)
    })

    it('should handle empty data gracefully', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        } as any)
      })

      const result = await performanceMetricsService.getEfficiencySummary()

      expect(result.timeToFirstArticle.average).toBe(0)
      expect(result.timeToFirstArticle.achievementRate).toBe(0)
      expect(result.timeToFirstArticle.trend).toBe('stable')
    })
  })

  describe('batch processing', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should process batch when size limit is reached', async () => {
      const mockInsert = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
      }
      vi.mocked(mockSupabase.from).mockReturnValue(mockInsert as any)

      // Add 100 metrics to trigger batch processing
      for (let i = 0; i < 100; i++) {
        await performanceMetricsService.trackMetric({
          metric_type: 'article_time',
          metric_value: 12.5
        })
      }

      expect(mockInsert.insert).toHaveBeenCalled()
    })

    it('should process batch after timeout', async () => {
      const mockInsert = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
      }
      vi.mocked(mockSupabase.from).mockReturnValue(mockInsert as any)

      await performanceMetricsService.trackMetric({
        metric_type: 'article_time',
        metric_value: 12.5
      })

      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(5000)

      expect(mockInsert.insert).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle validation errors properly', async () => {
      const result = await performanceMetricsService.trackMetric({
        metric_type: 'article_time',
        metric_value: -5 // Invalid negative value
      })

      expect(result).toBe(false)
    })

    it('should handle database errors in getMetrics', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
        } as any)
      })

      const result = await performanceMetricsService.getMetrics({
        metric_type: 'article_time'
      })

      expect(result).toEqual([])
    })
  })
})
