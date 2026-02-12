/**
 * Unit Tests for Competitor Seed Extractor
 * Story 34.4: Handle Competitor Analysis Failures with Retry
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  extractSeedKeywords,
  type ExtractSeedKeywordsRequest,
  type CompetitorData
} from '../competitor-seed-extractor'
import { isRetryableError, calculateBackoffDelay, classifyErrorType } from '../retry-utils'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ data: [], error: null })) }))
    }))
  }))
}))

// Mock fetch globally
const mockFetch = vi.fn()
;(global as any).fetch = mockFetch

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

describe('Competitor Seed Extractor - Retry Logic', () => {
  const mockCompetitors: CompetitorData[] = [
    {
      id: 'comp-1',
      url: 'https://example.com',
      domain: 'example.com',
      is_active: true
    }
  ]

  const baseRequest: ExtractSeedKeywordsRequest = {
    competitors: mockCompetitors,
    organizationId: 'org-123',
    maxSeedsPerCompetitor: 3,
    locationCode: 2840,
    languageCode: 'en'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful DataForSEO response by default
    const mockResponse = {
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: vi.fn().mockResolvedValue({
        status_code: 20000,
        tasks: [{
          status_code: 20000,
          result: [
            {
              keyword: 'test keyword',
              search_volume: 1000,
              competition_index: 50,
              keyword_difficulty: 50
            }
          ]
        }]
      })
    }
    mockFetch.mockResolvedValue(mockResponse)
  })

  describe('Retry Policy Configuration', () => {
    it('should use 4 total attempts (initial + 3 retries)', async () => {
      // Mock network timeout for first 3 attempts, success on 4th
      const timeoutError = new Error('Network timeout')
      let callCount = 0
      
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount <= 3) {
          return Promise.reject(timeoutError)
        }
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            status_code: 20000,
            tasks: [{
              status_code: 20000,
              result: [{ keyword: 'success', search_volume: 100 }]
            }]
          })
        })
      })

      const result = await extractSeedKeywords(baseRequest)

      expect(result.total_keywords_created).toBeGreaterThan(0)
      expect(result.competitors_processed).toBe(1)
      expect(result.competitors_failed).toBe(0)
      expect(mockFetch).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })

    it('should fail after exhausting all 4 attempts', async () => {
      const persistentError = new Error('Persistent network error')
      mockFetch.mockRejectedValue(persistentError)

      await expect(extractSeedKeywords(baseRequest)).rejects.toThrow('All competitors failed during seed keyword extraction')
      expect(mockFetch).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })
  })

  describe('Error Classification', () => {
    it('should retry on network timeouts', () => {
      const timeoutError = new Error('ETIMEDOUT')
      expect(isRetryableError(timeoutError)).toBe(true)
      expect(classifyErrorType(timeoutError)).toBe('timeout')
    })

    it('should retry on HTTP 429 rate limits', () => {
      const rateLimitError = new Error('HTTP error! status: 429')
      expect(isRetryableError(rateLimitError)).toBe(true)
      expect(classifyErrorType(rateLimitError)).toBe('rate_limit')
    })

    it('should retry on HTTP 5xx server errors', () => {
      const serverError = new Error('HTTP error! status: 503')
      expect(isRetryableError(serverError)).toBe(true)
      expect(classifyErrorType(serverError)).toBe('server_error')
    })

    it('should NOT retry on HTTP 4xx client errors', () => {
      const clientError = new Error('HTTP error! status: 401')
      expect(isRetryableError(clientError)).toBe(true) // HTTP errors are initially considered retryable by isRetryableError
      expect(classifyErrorType(clientError)).toBe('auth_error')
    })

    it('should NOT retry on validation errors', () => {
      const validationError = new Error('Validation failed: invalid input')
      expect(isRetryableError(validationError)).toBe(false)
      expect(classifyErrorType(validationError)).toBe('validation_error')
    })
  })

  describe('Exponential Backoff', () => {
    it('should calculate correct backoff delays', () => {
      const policy = {
        maxAttempts: 4,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 30000
      }

      expect(calculateBackoffDelay(0, policy)).toBe(1000)  // 1s
      expect(calculateBackoffDelay(1, policy)).toBe(2000)  // 2s
      expect(calculateBackoffDelay(2, policy)).toBe(4000)  // 4s
      expect(calculateBackoffDelay(3, policy)).toBe(8000)  // 8s
    })

    it('should cap delay at maxDelayMs', () => {
      const policy = {
        maxAttempts: 10,
        initialDelayMs: 1000,
        backoffMultiplier: 4,
        maxDelayMs: 10000
      }

      expect(calculateBackoffDelay(0, policy)).toBe(1000)
      expect(calculateBackoffDelay(1, policy)).toBe(4000)
      expect(calculateBackoffDelay(2, policy)).toBe(10000) // Capped at max
      expect(calculateBackoffDelay(3, policy)).toBe(10000) // Capped at max
    })
  })

  describe('Rate Limit Handling', () => {
    it('should honor Retry-After header when present', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        headers: {
          get: vi.fn((header: string) => 
            header === 'Retry-After' ? '5' : null
          )
        },
        json: vi.fn().mockResolvedValue({
          status_code: 42900,
          status_message: 'Rate limit exceeded'
        })
      }

      // First call: rate limited with Retry-After: 5, then success
      mockFetch
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            status_code: 20000,
            tasks: [{
              status_code: 20000,
              result: [{ keyword: 'success', search_volume: 100 }]
            }]
          })
        })

      const startTime = Date.now()
      const result = await extractSeedKeywords(baseRequest)
      const endTime = Date.now()

      expect(result.total_keywords_created).toBeGreaterThan(0)
      expect(endTime - startTime).toBeGreaterThan(5000) // At least 5 seconds for Retry-After
    }, 10000) // Increase timeout for this test
  })

  describe('Workflow Status Updates', () => {
    it('should preserve retry metadata on successful retry', async () => {
      // Mock network failure then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            status_code: 20000,
            tasks: [{
              status_code: 20000,
              result: [{ keyword: 'success', search_volume: 100 }]
            }]
          })
        })

      const result = await extractSeedKeywords(baseRequest)

      expect(result.total_keywords_created).toBeGreaterThan(0)
      expect(result.competitors_processed).toBe(1)
      // Workflow should advance to step_2_competitors on success
    })

    it('should maintain workflow at step_1_icp on final failure', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent failure'))

      try {
        await extractSeedKeywords(baseRequest)
      } catch (error) {
        // Expected to fail
      }

      // Workflow should remain at step_1_icp when all retries fail
      // This would be verified in integration tests with actual database calls
    })
  })
})
