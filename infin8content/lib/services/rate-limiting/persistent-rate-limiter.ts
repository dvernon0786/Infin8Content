/**
 * Persistent Rate Limiter
 * Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
 * 
 * Provides database-backed rate limiting for distributed systems.
 * Tracks API usage per organization with configurable limits.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyPrefix: string // Prefix for rate limit key (e.g., 'icp_generation')
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 3600000, // 1 hour
  maxRequests: 10,
  keyPrefix: 'rate_limit'
}

/**
 * Check rate limit for an organization
 * 
 * Uses database to track rate limits across distributed servers.
 * Each request increments a counter in the database for the current window.
 * 
 * @param organizationId - Organization ID to rate limit
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
  organizationId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const supabase = createServiceRoleClient()
  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `${config.keyPrefix}:${organizationId}`

  try {
    // Get current rate limit record
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('key', key)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for first request
      throw fetchError
    }

    const windowStart = now - config.windowMs

    // If no existing record or window has expired, create new record
    if (!existing || (existing as any).window_start < windowStart) {
      const { error: insertError } = await supabase
        .from('rate_limits')
        .upsert(
          {
            organization_id: organizationId,
            key: key,
            window_start: now,
            request_count: 1,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'organization_id,key' }
        )

      if (insertError) {
        throw insertError
      }

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs
      }
    }

    // Window is still active - check if limit exceeded
    const existingData = existing as any
    if (existingData.request_count >= config.maxRequests) {
      const resetAt = existingData.window_start + config.windowMs
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000)
      }
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existingData.request_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('key', key)

    if (updateError) {
      throw updateError
    }

    const remaining = config.maxRequests - (existingData.request_count + 1)
    const resetAt = existingData.window_start + config.windowMs

    return {
      allowed: true,
      remaining,
      resetAt
    }
  } catch (error) {
    console.error('[RateLimiter] Error checking rate limit:', error)
    // On error, allow request to proceed (fail open)
    // In production, you might want to fail closed instead
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs
    }
  }
}

/**
 * Reset rate limit for an organization
 * 
 * Used for testing or administrative purposes.
 * 
 * @param organizationId - Organization ID to reset
 * @param keyPrefix - Rate limit key prefix
 */
export async function resetRateLimit(
  organizationId: string,
  keyPrefix: string = 'rate_limit'
): Promise<void> {
  const supabase = createServiceRoleClient()
  const key = `${keyPrefix}:${organizationId}`

  try {
    await supabase
      .from('rate_limits')
      .delete()
      .eq('organization_id', organizationId)
      .eq('key', key)
  } catch (error) {
    console.error('[RateLimiter] Error resetting rate limit:', error)
  }
}

/**
 * Get rate limit status for an organization
 * 
 * @param organizationId - Organization ID
 * @param keyPrefix - Rate limit key prefix
 * @returns Current rate limit status or null if no record exists
 */
export async function getRateLimitStatus(
  organizationId: string,
  keyPrefix: string = 'rate_limit'
): Promise<{ requestCount: number; windowStart: number } | null> {
  const supabase = createServiceRoleClient()
  const key = `${keyPrefix}:${organizationId}`

  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('organization_id', organizationId)
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) {
      return null
    }

    const typedData = data as any
    return {
      requestCount: typedData.request_count,
      windowStart: typedData.window_start
    }
  } catch (error) {
    console.error('[RateLimiter] Error getting rate limit status:', error)
    return null
  }
}
