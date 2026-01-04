/**
 * Retry utility with exponential backoff for Stripe webhook processing
 * 
 * Implements retry strategy for transient failures:
 * - Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 retries)
 * - Max retries: 5 attempts
 * - Retry conditions: Network failures, temporary database errors, Stripe API rate limits
 * - No retry: Permanent errors (invalid event, organization not found, validation errors)
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
}

export interface RetryableError extends Error {
  retryable?: boolean
  statusCode?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 16000, // 16 seconds
  backoffMultiplier: 2,
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true
  }

  // Stripe API rate limits
  if (error.type === 'StripeRateLimitError') {
    return true
  }

  // Temporary database errors (PostgreSQL error codes)
  if (error.code === '57P01' || error.code === '57P02' || error.code === '57P03') {
    return true // Connection errors
  }

  // Supabase temporary errors
  if (error.message?.includes('connection') || error.message?.includes('timeout')) {
    return true
  }

  // Check if error explicitly marks itself as retryable
  if ((error as RetryableError).retryable === true) {
    return true
  }

  // Check if error explicitly marks itself as non-retryable
  if ((error as RetryableError).retryable === false) {
    return false
  }

  // Permanent errors (don't retry)
  if (error.statusCode === 400 || error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) {
    return false
  }

  // Default: retry on 5xx errors, don't retry on 4xx errors
  if (error.statusCode) {
    return error.statusCode >= 500
  }

  // Unknown errors: don't retry by default
  return false
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry options
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any
  let delay = opts.initialDelay

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        console.log(`Error is not retryable, stopping after ${attempt} attempts:`, {
          error: error.message,
          statusCode: error.statusCode,
          code: error.code,
        })
        throw error
      }

      // Don't retry if we've reached max retries
      if (attempt >= opts.maxRetries) {
        console.error(`Max retries (${opts.maxRetries}) reached, giving up:`, {
          error: error.message,
          statusCode: error.statusCode,
          code: error.code,
          attempts: attempt + 1,
        })
        throw error
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms:`, {
        error: error.message,
        statusCode: error.statusCode,
        code: error.code,
      })

      // Wait before retrying
      await sleep(delay)

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

