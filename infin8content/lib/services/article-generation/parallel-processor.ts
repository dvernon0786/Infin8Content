/**
 * Parallel Processing Service for Article Generation
 * Story 20.3: Parallel Section Processing
 * 
 * Provides concurrency management, error isolation, and performance optimization
 * for parallel section processing during article generation.
 */

import { performanceMonitor } from './performance-monitor'

/**
 * Configuration for parallel processing batches
 */
export interface ParallelBatchConfig {
  maxConcurrent: number
  timeout: number
  retryAttempts: number
  retryDelay: number
}

/**
 * Result of processing a parallel batch
 */
export interface ParallelBatchResult<T> {
  successful: T[]
  failed: Array<{
    item: T
    error: string
    retryable: boolean
  }>
  batchDuration: number
  concurrencyUsed: number
}

/**
 * Section processing task with metadata
 */
export interface SectionTask {
  id: string
  type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  sectionIndex: number
  parentIndex?: number // For H3 subsections
  priority: number
  data: any
}

/**
 * Concurrency manager for controlling API rate limits
 */
export class ConcurrencyManager {
  private activeRequests = 0
  private maxConcurrent: number
  private queue: Array<{
    resolve: (value: any) => void
    reject: (reason: any) => void
    task: () => Promise<any>
  }> = []

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * Execute a task with concurrency control
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, task })
      this.processQueue()
    })
  }

  /**
   * Process the queue when slots are available
   */
  private async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.activeRequests++
    const { resolve, reject, task } = this.queue.shift()!

    try {
      const result = await task()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.activeRequests--
      this.processQueue() // Process next item in queue
    }
  }

  /**
   * Get current concurrency statistics
   */
  getStats() {
    return {
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      queueLength: this.queue.length
    }
  }
}

/**
 * Parallel processor for section generation
 */
export class ParallelSectionProcessor {
  private concurrencyManager: ConcurrencyManager
  private batchConfig: ParallelBatchConfig
  private articleId: string = ''

  constructor(config: Partial<ParallelBatchConfig> = {}) {
    this.batchConfig = {
      maxConcurrent: 4, // Per-article limit
      timeout: 300000, // 5 minutes
      retryAttempts: 1, // Reduced from 3 for performance optimization (Story 20.4)
      retryDelay: 500, // Reduced from 1000ms for faster retry (Story 20.4)
      ...config
    }

    // Global concurrency limit across all articles
    this.concurrencyManager = new ConcurrencyManager(5)
  }

  /**
   * Set the article ID for tracking
   */
  setArticleId(articleId: string): void {
    this.articleId = articleId
  }

  /**
   * Process sections in parallel batches with error isolation
   */
  async processBatch<T>(
    tasks: Array<{ id: string; task: () => Promise<T> }>,
    batchType: string
  ): Promise<ParallelBatchResult<T>> {
    const startTime = Date.now()
    const batchId = `${batchType}-${Date.now()}`

    console.log(`[ParallelProcessor] Starting batch ${batchId} with ${tasks.length} tasks`)

    // Track batch metrics
    performanceMonitor.trackBatchStart(this.articleId, batchId, batchType, tasks.length)

    try {
      // Process tasks with concurrency control
      const promises = tasks.map(({ id, task }) => 
        this.processTaskWithRetry(id, task, batchId)
      )

      const results = await Promise.allSettled(promises)
      
      const successful: T[] = []
      const failed: Array<{ item: T; error: string; retryable: boolean }> = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value)
        } else {
          const error = result.reason as Error
          failed.push({
            item: null as any, // Will be populated by caller
            error: error.message,
            retryable: this.isRetryableError(error)
          })
        }
      })

      const batchDuration = Date.now() - startTime
      const concurrencyUsed = this.concurrencyManager.getStats().activeRequests

      // Track batch completion metrics
      performanceMonitor.trackBatchComplete(this.articleId, batchId, {
        successful: successful.length,
        failed: failed.length,
        duration: batchDuration,
        concurrencyUsed
      })

      console.log(`[ParallelProcessor] Batch ${batchId} completed in ${batchDuration}ms - ${successful.length} successful, ${failed.length} failed`)

      return {
        successful,
        failed,
        batchDuration,
        concurrencyUsed
      }
    } catch (error) {
      const batchDuration = Date.now() - startTime
      
      // Track batch failure
      performanceMonitor.trackBatchComplete(this.articleId, batchId, {
        successful: 0,
        failed: tasks.length,
        duration: batchDuration,
        concurrencyUsed: 0,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  /**
   * Process a single task with retry logic
   */
  private async processTaskWithRetry<T>(
    taskId: string,
    task: () => Promise<T>,
    batchId: string
  ): Promise<T> {
    let lastError: Error | null = null
    const maxAttempts = Math.max(1, this.batchConfig.retryAttempts) // Ensure at least 1 attempt

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Execute with concurrency control
        const result = await this.concurrencyManager.execute(task)
        
        if (attempt > 1) {
          console.log(`[ParallelProcessor] Task ${taskId} succeeded on attempt ${attempt}`)
        }
        
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        console.warn(`[ParallelProcessor] Task ${taskId} failed on attempt ${attempt}: ${lastError.message}`)
        
        // Track retry attempt
        performanceMonitor.trackRetry(this.articleId, taskId, batchId, attempt, lastError.message)
        
      if (attempt < maxAttempts) {
        // Fixed delay for Story 20.4 performance optimization - no exponential backoff
        const delay = this.batchConfig.retryDelay + Math.random() * 100
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      }
    }

    // All retries exhausted
    throw lastError || new Error(`Task ${taskId} failed after ${maxAttempts} attempts`)
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /rate limit/i,
      /temporary/i,
      /503/i,
      /502/i,
      /500/i
    ]

    return retryablePatterns.some(pattern => pattern.test(error.message))
  }

  /**
   * Get current system statistics
   */
  getSystemStats() {
    return {
      concurrency: this.concurrencyManager.getStats(),
      batchConfig: this.batchConfig
    }
  }
}

/**
 * Global instance for parallel processing
 */
export const parallelProcessor = new ParallelSectionProcessor()

/**
 * Helper function to create section tasks for parallel processing
 */
export function createSectionTasks(
  sections: any[],
  type: 'h2' | 'h3' | 'final',
  parentIndex?: number
): SectionTask[] {
  return sections.map((section, index) => ({
    id: `${type}-${parentIndex ? `${parentIndex}-` : ''}${index}`,
    type: type === 'final' ? (section.type || 'conclusion') : type,
    sectionIndex: parentIndex ? parseFloat(`${parentIndex}.${index + 1}`) : index + 1,
    parentIndex: type === 'h3' ? parentIndex : undefined,
    priority: getSectionPriority(type),
    data: section
  }))
}

/**
 * Get processing priority for section type
 */
function getSectionPriority(type: string): number {
  const priorities = {
    introduction: 1,
    h2: 2,
    h3: 3,
    conclusion: 4,
    faq: 4,
    final: 4 // For batched final sections
  }
  return priorities[type as keyof typeof priorities] || 5
}
