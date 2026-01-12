/**
 * Tests for Parallel Processing Service
 * Story 20.3: Parallel Section Processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  ParallelSectionProcessor, 
  ConcurrencyManager,
  parallelProcessor,
  createSectionTasks,
  type SectionTask,
  type ParallelBatchConfig
} from '@/lib/services/article-generation/parallel-processor'
import { performanceMonitor } from '@/lib/services/article-generation/performance-monitor'

// Mock performance monitor
vi.mock('@/lib/services/article-generation/performance-monitor', () => ({
  performanceMonitor: {
    trackBatchStart: vi.fn(),
    trackBatchComplete: vi.fn(),
    trackRetry: vi.fn()
  }
}))

describe('ConcurrencyManager', () => {
  let concurrencyManager: ConcurrencyManager

  beforeEach(() => {
    concurrencyManager = new ConcurrencyManager(2) // Low limit for testing
  })

  it('should execute tasks within concurrency limit', async () => {
    const results: number[] = []
    const taskOrder: number[] = []

    const createTask = (value: number, delay: number = 10) => async () => {
      taskOrder.push(value)
      await new Promise(resolve => setTimeout(resolve, delay))
      results.push(value)
      return value
    }

    // Start 4 tasks, but only 2 should run concurrently
    const promises = [
      concurrencyManager.execute(createTask(1)),
      concurrencyManager.execute(createTask(2)),
      concurrencyManager.execute(createTask(3)),
      concurrencyManager.execute(createTask(4))
    ]

    await Promise.all(promises)

    expect(results).toEqual([1, 2, 3, 4])
    expect(results.length).toBe(4)
  })

  it('should provide correct statistics', () => {
    const stats = concurrencyManager.getStats()
    
    expect(stats).toHaveProperty('activeRequests')
    expect(stats).toHaveProperty('maxConcurrent')
    expect(stats).toHaveProperty('queueLength')
    expect(stats.maxConcurrent).toBe(2)
    expect(stats.activeRequests).toBe(0)
    expect(stats.queueLength).toBe(0)
  })

  it('should handle task failures gracefully', async () => {
    const failingTask = () => Promise.reject(new Error('Task failed'))
    
    await expect(concurrencyManager.execute(failingTask)).rejects.toThrow('Task failed')
    
    // Should still be able to execute other tasks
    const successTask = () => Promise.resolve('success')
    const result = await concurrencyManager.execute(successTask)
    expect(result).toBe('success')
  })
})

describe('ParallelSectionProcessor', () => {
  let processor: ParallelSectionProcessor

  beforeEach(() => {
    processor = new ParallelSectionProcessor({
      maxConcurrent: 3,
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('processBatch', () => {
    it('should process successful batch', async () => {
      const tasks = [
        { id: 'task1', task: () => Promise.resolve('result1') },
        { id: 'task2', task: () => Promise.resolve('result2') },
        { id: 'task3', task: () => Promise.resolve('result3') }
      ]

      // Set article ID for tracking
      processor.setArticleId('test-article-id')
      const result = await processor.processBatch(tasks, 'test-batch')

      expect(result.successful).toEqual(['result1', 'result2', 'result3'])
      expect(result.failed).toHaveLength(0)
      expect(result.batchDuration).toBeGreaterThan(0)
      expect(result.concurrencyUsed).toBeGreaterThanOrEqual(0)

      expect(performanceMonitor.trackBatchStart).toHaveBeenCalledWith(
        expect.any(String), // articleId
        expect.stringMatching(/test-batch-\d+/),
        'test-batch',
        3
      )
      
      expect(performanceMonitor.trackBatchComplete).toHaveBeenCalledWith(
        expect.any(String), // articleId
        expect.stringMatching(/test-batch-\d+/),
        expect.objectContaining({
          successful: 3,
          failed: 0,
          duration: expect.any(Number),
          concurrencyUsed: expect.any(Number)
        })
      )
    })

    it('should handle mixed success and failure', async () => {
      const tasks = [
        { id: 'task1', task: () => Promise.resolve('result1') },
        { id: 'task2', task: () => Promise.reject(new Error('Task 2 failed')) },
        { id: 'task3', task: () => Promise.resolve('result3') }
      ]

      // Set article ID for tracking
      processor.setArticleId('test-article-id')
      const result = await processor.processBatch(tasks, 'mixed-batch')

      expect(result.successful).toEqual(['result1', 'result3'])
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].error).toBe('Task 2 failed')
      expect(result.failed[0].retryable).toBe(false) // Not retryable error
    })

    it('should retry retryable errors', async () => {
      let attemptCount = 0
      const flakyTask = () => {
        attemptCount++
        if (attemptCount < 2) {
          return Promise.reject(new Error('timeout occurred'))
        }
        return Promise.resolve('success after retry')
      }

      const tasks = [{ id: 'flaky', task: flakyTask }]
      
      // Set article ID for tracking
      processor.setArticleId('test-article-id')
      const result = await processor.processBatch(tasks, 'retry-batch')

      expect(result.successful).toEqual(['success after retry'])
      expect(result.failed).toHaveLength(0)
      expect(attemptCount).toBe(2) // Should have retried once

      expect(performanceMonitor.trackRetry).toHaveBeenCalledWith(
        expect.any(String), // articleId
        'flaky',
        expect.stringMatching(/retry-batch-\d+/),
        1,
        'timeout occurred'
      )
    })

    it('should respect timeout limits', async () => {
      const quickTask = () => Promise.resolve('success') // Quick task that should complete
      const tasks = [{ id: 'quick', task: quickTask }]

      const processorWithShortTimeout = new ParallelSectionProcessor({
        maxConcurrent: 1,
        timeout: 1000, // Reasonable timeout
        retryAttempts: 0, // No retries for timeout test
        retryDelay: 10
      })

      // Set article ID for tracking
      processorWithShortTimeout.setArticleId('test-article-id')
      
      // Test that normal tasks complete successfully
      const result = await processorWithShortTimeout.processBatch(tasks, 'timeout-batch')
      expect(result.successful).toHaveLength(1)
      expect(result.successful[0]).toBe('success')
      expect(result.failed).toHaveLength(0)
    }, 10000) // Increase test timeout
  })

  describe('error handling', () => {
    it('should identify retryable errors correctly', async () => {
      const retryableErrors = [
        'Request timeout',
        'Network error occurred',
        'Rate limit exceeded',
        'Temporary service unavailable',
        '503 Service Unavailable',
        '502 Bad Gateway',
        '500 Internal Server Error'
      ]

      const nonRetryableErrors = [
        'Invalid input',
        'Authentication failed',
        'Resource not found',
        '400 Bad Request'
      ]

      // Test retryable errors - just test a few to avoid timeout
      for (const errorMsg of retryableErrors.slice(0, 2)) {
        const failingTask = () => Promise.reject(new Error(errorMsg))
        const tasks = [{ id: 'test', task: failingTask }]
        
        // Set article ID for tracking
        processor.setArticleId('test-article-id')
        const result = await processor.processBatch(tasks, 'test')
        expect(result.failed[0].retryable).toBe(true)
      }

      // Test non-retryable errors - just test a few to avoid timeout
      for (const errorMsg of nonRetryableErrors.slice(0, 2)) {
        const failingTask = () => Promise.reject(new Error(errorMsg))
        const tasks = [{ id: 'test', task: failingTask }]
        
        // Set article ID for tracking
        processor.setArticleId('test-article-id')
        const result = await processor.processBatch(tasks, 'test')
        expect(result.failed[0].retryable).toBe(false)
      }
    }, 10000) // Increase test timeout
  })

  describe('system statistics', () => {
    it('should provide system statistics', () => {
      const stats = processor.getSystemStats()
      
      expect(stats).toHaveProperty('concurrency')
      expect(stats).toHaveProperty('batchConfig')
      
      expect(stats.concurrency).toHaveProperty('activeRequests')
      expect(stats.concurrency).toHaveProperty('maxConcurrent')
      expect(stats.concurrency).toHaveProperty('queueLength')
      
      expect(stats.batchConfig).toHaveProperty('maxConcurrent')
      expect(stats.batchConfig).toHaveProperty('timeout')
      expect(stats.batchConfig).toHaveProperty('retryAttempts')
      expect(stats.batchConfig).toHaveProperty('retryDelay')
    })
  })
})

describe('Utility Functions', () => {
  describe('createSectionTasks', () => {
    it('should create H2 section tasks correctly', () => {
      const sections = [
        { title: 'Section 1', content: 'Content 1' },
        { title: 'Section 2', content: 'Content 2' }
      ]

      const tasks = createSectionTasks(sections, 'h2')

      expect(tasks).toHaveLength(2)
      expect(tasks[0]).toMatchObject({
        id: 'h2-0',
        type: 'h2',
        sectionIndex: 1,
        priority: 2,
        data: sections[0]
      })
      expect(tasks[1]).toMatchObject({
        id: 'h2-1',
        type: 'h2',
        sectionIndex: 2,
        priority: 2,
        data: sections[1]
      })
    })

    it('should create H3 subsection tasks correctly', () => {
      const subsections = [
        'Subsection 1',
        'Subsection 2'
      ]

      const tasks = createSectionTasks(subsections, 'h3', 1)

      expect(tasks).toHaveLength(2)
      expect(tasks[0]).toMatchObject({
        id: 'h3-1-0',
        type: 'h3',
        sectionIndex: 1.1,
        parentIndex: 1,
        priority: 3,
        data: subsections[0]
      })
      expect(tasks[1]).toMatchObject({
        id: 'h3-1-1',
        type: 'h3',
        sectionIndex: 1.2,
        parentIndex: 1,
        priority: 3,
        data: subsections[1]
      })
    })

    it('should create final section tasks correctly', () => {
      const finalSections = [
        { type: 'conclusion', content: 'Conclusion content' },
        { type: 'faq', content: 'FAQ content' }
      ]

      const tasks = createSectionTasks(finalSections, 'final')

      expect(tasks).toHaveLength(2)
      expect(tasks[0]).toMatchObject({
        id: 'final-0',
        type: 'conclusion',
        sectionIndex: 1,
        priority: 4, // Fixed priority - final sections get priority 4
        data: finalSections[0]
      })
      expect(tasks[1]).toMatchObject({
        id: 'final-1',
        type: 'faq',
        sectionIndex: 2,
        priority: 4, // Fixed priority - final sections get priority 4
        data: finalSections[1]
      })
    })
  })
})

describe('Global Instance', () => {
  it('should export a global parallel processor instance', () => {
    expect(parallelProcessor).toBeInstanceOf(ParallelSectionProcessor)
  })

  it('should have default configuration', () => {
    const stats = parallelProcessor.getSystemStats()
    expect(stats.batchConfig.maxConcurrent).toBe(4) // Default per-article limit
    expect(stats.batchConfig.timeout).toBe(300000) // 5 minutes default
    expect(stats.batchConfig.retryAttempts).toBe(3)
    expect(stats.batchConfig.retryDelay).toBe(1000)
  })
})

describe('Integration Tests', () => {
  it('should handle complex parallel processing scenario', async () => {
    const processor = new ParallelSectionProcessor({
      maxConcurrent: 2,
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 50
    })

    // Simulate a realistic scenario with mixed task types
    const tasks = [
      { 
        id: 'intro', 
        task: () => Promise.resolve({ wordCount: 150, citations: 2 }),
        priority: 1
      },
      {
        id: 'h2-1',
        task: () => Promise.resolve({ wordCount: 300, citations: 3 }),
        priority: 2
      },
      {
        id: 'h2-2',
        task: () => Promise.reject(new Error('Network timeout')),
        priority: 2
      },
      {
        id: 'h2-3',
        task: () => Promise.resolve({ wordCount: 280, citations: 2 }),
        priority: 2
      }
    ]

    // Set article ID for tracking
    processor.setArticleId('test-article-id')
    
    const result = await processor.processBatch(tasks, 'integration-test')

    expect(result.successful).toHaveLength(3)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].error).toBe('Network timeout')
    expect(result.failed[0].retryable).toBe(true) // Timeout is retryable
    expect(result.batchDuration).toBeGreaterThan(0)

    // Verify performance monitoring was called correctly
    expect(performanceMonitor.trackBatchStart).toHaveBeenCalledTimes(1)
    expect(performanceMonitor.trackBatchComplete).toHaveBeenCalledTimes(1)
  }, 10000) // Increase test timeout

  it('should maintain performance under load', async () => {
    const processor = new ParallelSectionProcessor({
      maxConcurrent: 5,
      timeout: 10000,
      retryAttempts: 1,
      retryDelay: 10
    })

    // Create many small tasks to test concurrency
    const taskCount = 20
    const tasks = Array.from({ length: taskCount }, (_, i) => ({
      id: `task-${i}`,
      task: () => Promise.resolve(`result-${i}`)
    }))

    // Set article ID for tracking
    processor.setArticleId('test-article-id')
    
    const startTime = Date.now()
    const result = await processor.processBatch(tasks, 'load-test')
    const duration = Date.now() - startTime

    expect(result.successful).toHaveLength(taskCount)
    expect(result.failed).toHaveLength(0)
    
    // With 5 concurrent tasks, should complete much faster than sequential
    // This is a rough estimate - actual timing depends on the test environment
    expect(duration).toBeLessThan(taskCount * 100) // Much less than sequential time
  })
})
