/**
 * Retry Utility Tests
 * 
 * Unit tests for retryWithBackoff function
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { retryWithBackoff, RetryableError } from './retry'

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return result immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    
    const result = await retryWithBackoff(fn)
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET', message: 'Network error' })
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn)
    
    // Fast-forward through retry delay
    await vi.advanceTimersByTimeAsync(1000)
    
    const result = await promise
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable errors (400)', async () => {
    const error = new Error('Bad request')
    ;(error as any).statusCode = 400
    
    const fn = vi.fn().mockRejectedValue(error)
    
    await expect(retryWithBackoff(fn)).rejects.toThrow('Bad request')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should not retry on non-retryable errors (404)', async () => {
    const error = new Error('Not found')
    ;(error as any).statusCode = 404
    
    const fn = vi.fn().mockRejectedValue(error)
    
    await expect(retryWithBackoff(fn)).rejects.toThrow('Not found')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on 5xx errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ statusCode: 500, message: 'Server error' })
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn)
    
    await vi.advanceTimersByTimeAsync(1000)
    
    const result = await promise
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn)
    
    // First retry after 1s
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)
    
    // Second retry after 2s (total 3s)
    await vi.advanceTimersByTimeAsync(2000)
    expect(fn).toHaveBeenCalledTimes(3)
    
    const result = await promise
    expect(result).toBe('success')
  })

  it('should respect max retries', async () => {
    const fn = vi.fn().mockRejectedValue({ code: 'ECONNRESET' })
    
    const promise = retryWithBackoff(fn, { maxRetries: 2 })
    
    // Fast-forward through all retries
    await vi.advanceTimersByTimeAsync(10000)
    
    // Ensure the promise rejection is properly awaited and caught
    await expect(promise).rejects.toBeDefined()
    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should respect max delay cap', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn, { maxDelay: 4000 })
    
    // Delays should be: 1s, 2s, 4s, 4s (capped), 4s (capped)
    await vi.advanceTimersByTimeAsync(15000)
    
    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(5)
  })

  it('should retry on network errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ code: 'ETIMEDOUT' })
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn)
    
    await vi.advanceTimersByTimeAsync(1000)
    
    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should retry on Stripe rate limit errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ type: 'StripeRateLimitError' })
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn)
    
    await vi.advanceTimersByTimeAsync(1000)
    
    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should respect retryable flag on error', async () => {
    const error = new Error('Custom error') as RetryableError
    error.retryable = false
    
    const fn = vi.fn().mockRejectedValue(error)
    
    await expect(retryWithBackoff(fn)).rejects.toThrow('Custom error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry when retryable flag is true', async () => {
    const error = new Error('Retryable error') as RetryableError
    error.retryable = true
    
    const fn = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success')
    
    const promise = retryWithBackoff(fn)
    
    await vi.advanceTimersByTimeAsync(1000)
    
    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

