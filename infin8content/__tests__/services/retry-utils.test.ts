/**
 * Retry Utilities Tests
 * Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isRetryableError,
  calculateBackoffDelay,
  sleep,
  classifyErrorType,
  extractHttpStatus,
  DEFAULT_RETRY_POLICY,
  type RetryPolicy
} from '@/lib/services/intent-engine/retry-utils'

describe('Retry Utilities', () => {
  describe('isRetryableError', () => {
    it('should classify timeout as retryable', () => {
      const error = new Error('Request timeout: exceeded 5000ms limit')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify network errors as retryable', () => {
      const error = new Error('ECONNREFUSED: Connection refused')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify DNS errors as retryable', () => {
      const error = new Error('ENOTFOUND: getaddrinfo ENOTFOUND api.example.com')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify 429 (rate limit) as retryable', () => {
      const error = new Error('HTTP 429 Too Many Requests')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify 5xx errors as retryable', () => {
      const error = new Error('HTTP 500 Internal Server Error')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify 502 as retryable', () => {
      const error = new Error('HTTP 502 Bad Gateway')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify 503 as retryable', () => {
      const error = new Error('HTTP 503 Service Unavailable')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify 400 (bad request) as non-retryable', () => {
      const error = new Error('HTTP 400 Bad Request')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify 401 (unauthorized) as non-retryable', () => {
      const error = new Error('HTTP 401 Unauthorized')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify 403 (forbidden) as non-retryable', () => {
      const error = new Error('HTTP 403 Forbidden')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify 422 (unprocessable entity) as non-retryable', () => {
      const error = new Error('HTTP 422 Unprocessable Entity')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify validation errors as non-retryable', () => {
      const error = new Error('Validation error: invalid input')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify schema errors as non-retryable', () => {
      const error = new Error('Schema validation failed')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify invalid format errors as non-retryable', () => {
      const error = new Error('Invalid URL format')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should default to retryable for unknown errors', () => {
      const error = new Error('Some unknown error')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should handle non-Error objects', () => {
      expect(isRetryableError('string error')).toBe(true)
      expect(isRetryableError(null)).toBe(true)
      expect(isRetryableError(undefined)).toBe(true)
    })
  })

  describe('calculateBackoffDelay', () => {
    it('should calculate correct exponential backoff for attempt 0', () => {
      const delay = calculateBackoffDelay(0, DEFAULT_RETRY_POLICY)
      expect(delay).toBe(1000) // 1000 * 2^0 = 1000
    })

    it('should calculate correct exponential backoff for attempt 1', () => {
      const delay = calculateBackoffDelay(1, DEFAULT_RETRY_POLICY)
      expect(delay).toBe(2000) // 1000 * 2^1 = 2000
    })

    it('should calculate correct exponential backoff for attempt 2', () => {
      const delay = calculateBackoffDelay(2, DEFAULT_RETRY_POLICY)
      expect(delay).toBe(4000) // 1000 * 2^2 = 4000
    })

    it('should respect max delay limit', () => {
      const policy: RetryPolicy = {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 5000
      }
      const delay = calculateBackoffDelay(3, policy)
      expect(delay).toBeLessThanOrEqual(5000)
    })

    it('should cap exponential growth at maxDelayMs', () => {
      const policy: RetryPolicy = {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 3000
      }
      const delay = calculateBackoffDelay(5, policy)
      expect(delay).toBe(3000)
    })

    it('should use custom policy values', () => {
      const customPolicy: RetryPolicy = {
        maxAttempts: 3,
        initialDelayMs: 500,
        backoffMultiplier: 3,
        maxDelayMs: 10000
      }
      const delay = calculateBackoffDelay(1, customPolicy)
      expect(delay).toBe(1500) // 500 * 3^1 = 1500
    })

    it('should use default policy when not provided', () => {
      const delay = calculateBackoffDelay(0)
      expect(delay).toBe(DEFAULT_RETRY_POLICY.initialDelayMs)
    })
  })

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const startTime = Date.now()
      await sleep(100)
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeGreaterThanOrEqual(95) // Allow 5ms tolerance
      expect(elapsed).toBeLessThan(150) // Tighter upper bound
    })

    it('should resolve after timeout', async () => {
      const promise = sleep(50)
      expect(promise).toBeInstanceOf(Promise)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('classifyErrorType', () => {
    it('should classify timeout errors', () => {
      const error = new Error('Request timeout: exceeded 5000ms')
      expect(classifyErrorType(error)).toBe('timeout')
    })

    it('should classify rate limit errors', () => {
      const error = new Error('HTTP 429 Too Many Requests')
      expect(classifyErrorType(error)).toBe('rate_limit')
    })

    it('should classify server errors', () => {
      const error = new Error('HTTP 500 Internal Server Error')
      expect(classifyErrorType(error)).toBe('server_error')
    })

    it('should classify client errors', () => {
      const error = new Error('HTTP 400 Bad Request')
      expect(classifyErrorType(error)).toBe('client_error')
    })

    it('should classify validation errors', () => {
      const error = new Error('Validation error: invalid input')
      expect(classifyErrorType(error)).toBe('validation_error')
    })

    it('should classify schema errors', () => {
      const error = new Error('Schema validation failed')
      expect(classifyErrorType(error)).toBe('validation_error')
    })

    it('should classify auth errors', () => {
      const error = new Error('Authentication failed')
      expect(classifyErrorType(error)).toBe('auth_error')
    })

    it('should classify network errors', () => {
      const error = new Error('ECONNREFUSED: Connection refused')
      expect(classifyErrorType(error)).toBe('network_error')
    })

    it('should return unknown_error for unclassified errors', () => {
      const error = new Error('Some random error')
      expect(classifyErrorType(error)).toBe('unknown_error')
    })

    it('should handle non-Error objects', () => {
      expect(classifyErrorType('string error')).toBe('unknown_error')
      expect(classifyErrorType(null)).toBe('unknown_error')
      expect(classifyErrorType(undefined)).toBe('unknown_error')
    })
  })

  describe('extractHttpStatus', () => {
    it('should extract HTTP 429 status', () => {
      const error = new Error('HTTP 429 Too Many Requests')
      expect(extractHttpStatus(error)).toBe(429)
    })

    it('should extract HTTP 500 status', () => {
      const error = new Error('HTTP 500 Internal Server Error')
      expect(extractHttpStatus(error)).toBe(500)
    })

    it('should extract HTTP 400 status', () => {
      const error = new Error('HTTP 400 Bad Request')
      expect(extractHttpStatus(error)).toBe(400)
    })

    it('should return null for non-HTTP errors', () => {
      const error = new Error('Timeout error')
      expect(extractHttpStatus(error)).toBeNull()
    })

    it('should return null for non-Error objects', () => {
      expect(extractHttpStatus('string error')).toBeNull()
      expect(extractHttpStatus(null)).toBeNull()
      expect(extractHttpStatus(undefined)).toBeNull()
    })

    it('should extract status from error with multiple numbers', () => {
      const error = new Error('Request 123 failed with HTTP 503 Service Unavailable')
      expect(extractHttpStatus(error)).toBe(503) // Extracts HTTP status, not first number
    })
  })

  describe('DEFAULT_RETRY_POLICY', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RETRY_POLICY.maxAttempts).toBe(3)
      expect(DEFAULT_RETRY_POLICY.initialDelayMs).toBe(1000)
      expect(DEFAULT_RETRY_POLICY.backoffMultiplier).toBe(2)
      expect(DEFAULT_RETRY_POLICY.maxDelayMs).toBe(30000)
    })
  })
})
