/**
 * Retry Utilities for Intent Engine
 * Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
 * 
 * Pure helper functions for retry logic, error classification, and backoff calculation
 */

export interface RetryPolicy {
  maxAttempts: number        // 3 (initial + 2 retries)
  initialDelayMs: number     // 1000
  backoffMultiplier: number  // 2
  maxDelayMs: number         // 30000
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000
}

/**
 * Classify error as retryable or non-retryable
 * 
 * Retryable errors:
 * - Network timeouts
 * - HTTP 429 (rate limit)
 * - HTTP 5xx (server errors)
 * 
 * Non-retryable errors:
 * - HTTP 400/422 (invalid input)
 * - HTTP 401/403 (auth)
 * - Validation/schema errors
 */
export function isRetryableError(error: unknown): boolean {
  // Network timeout
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('timeout') || message.includes('econnrefused') || message.includes('enotfound')) {
      return true
    }
  }

  // HTTP error status codes
  if (error instanceof Error && error.message.includes('HTTP')) {
    const statusMatch = error.message.match(/HTTP\s+(\d{3})/)
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10)
      // 429 (rate limit) and 5xx (server errors) are retryable
      if (status === 429 || (status >= 500 && status < 600)) {
        return true
      }
      // 4xx (client errors) are not retryable
      if (status >= 400 && status < 500) {
        return false
      }
    }
  }

  // Validation errors are not retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('validation') || message.includes('schema') || message.includes('invalid')) {
      return false
    }
  }

  // Default: treat as retryable for transient failures
  return true
}

/**
 * Calculate exponential backoff delay
 * 
 * Formula: min(initialDelayMs * (backoffMultiplier ** attemptNumber), maxDelayMs)
 * 
 * @param attemptNumber - 0-indexed attempt number (0 for first retry)
 * @param policy - Retry policy with timing parameters
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attemptNumber: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  const exponentialDelay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attemptNumber)
  return Math.min(exponentialDelay, policy.maxDelayMs)
}

/**
 * Sleep for specified duration
 * 
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Classify error type for analytics
 */
export function classifyErrorType(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Check for specific status codes first
    if (message.includes('401') || message.includes('403')) return 'auth_error'
    if (message.includes('429')) return 'rate_limit'
    if (message.includes('5xx') || message.match(/\b5\d{2}\b/)) return 'server_error'
    if (message.includes('4xx') || message.match(/\b4\d{2}\b/)) return 'client_error'
    
    // Then check for general error types
    if (message.includes('timeout') || message.includes('etimedout')) return 'timeout'
    if (message.includes('validation') || message.includes('schema')) return 'validation_error'
    if (message.includes('auth')) return 'auth_error'
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) return 'network_error'
  }
  
  return 'unknown_error'
}

/**
 * Extract HTTP status code from error message
 */
export function extractHttpStatus(error: unknown): number | null {
  if (error instanceof Error) {
    const match = error.message.match(/HTTP\s+(\d{3})/)
    if (match) {
      return parseInt(match[1], 10)
    }
  }
  return null
}
