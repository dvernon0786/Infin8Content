// Rate limiting utility for OTP resend requests and feature flag operations
import { createClient } from '@/lib/supabase/server'

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 3 // Maximum 3 resends per 10 minutes
const FEATURE_FLAG_RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const FEATURE_FLAG_MAX_ATTEMPTS = 10 // Maximum 10 flag toggles per minute per organization

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Check if rate limit is exceeded for OTP resend
 * Tracks attempts per email address in a 10-minute window
 */
export async function checkOTPResendRateLimit(
  email: string
): Promise<RateLimitResult> {
  const supabase = await createClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS)

  // Count recent OTP codes sent to this email in the last 10 minutes
  const { data: recentCodes, error } = await supabase
    .from('otp_codes' as any)
    .select('created_at')
    .eq('email', email)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    // If query fails, allow the request (fail open for availability)
    // Log error for monitoring
    console.error('Rate limit check failed:', error)
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS,
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS),
    }
  }

  const attemptCount = recentCodes?.length || 0
  const allowed = attemptCount < MAX_ATTEMPTS
  const remaining = Math.max(0, MAX_ATTEMPTS - attemptCount)
  const resetAt = recentCodes && recentCodes.length > 0 && (recentCodes as any)[0].created_at
    ? new Date(new Date((recentCodes as any)[0].created_at).getTime() + RATE_LIMIT_WINDOW_MS)
    : new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)

  return {
    allowed,
    remaining,
    resetAt,
  }
}

/**
 * Check if rate limit is exceeded for feature flag operations
 * Tracks attempts per organization in a 1-minute window
 * Prevents abuse of feature flag toggle endpoint
 */
export async function checkFeatureFlagRateLimit(
  organizationId: string
): Promise<RateLimitResult> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const windowStart = new Date(now.getTime() - FEATURE_FLAG_RATE_LIMIT_WINDOW_MS)

    // Count recent feature flag changes for this organization in the last minute
    const { data: recentChanges, error } = await supabase
      .from('audit_logs')
      .select('created_at')
      .eq('organization_id', organizationId)
      .eq('action', 'FEATURE_FLAG_TOGGLED')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      // If query fails, allow the request (fail open for availability)
      console.error('Feature flag rate limit check failed:', error)
      return {
        allowed: true,
        remaining: FEATURE_FLAG_MAX_ATTEMPTS,
        resetAt: new Date(now.getTime() + FEATURE_FLAG_RATE_LIMIT_WINDOW_MS),
      }
    }

    const attemptCount = recentChanges?.length || 0
    const allowed = attemptCount < FEATURE_FLAG_MAX_ATTEMPTS
    const remaining = Math.max(0, FEATURE_FLAG_MAX_ATTEMPTS - attemptCount)
    const resetAt = recentChanges && recentChanges.length > 0 && (recentChanges as any)[0].created_at
      ? new Date(new Date((recentChanges as any)[0].created_at).getTime() + FEATURE_FLAG_RATE_LIMIT_WINDOW_MS)
      : new Date(now.getTime() + FEATURE_FLAG_RATE_LIMIT_WINDOW_MS)

    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    // If any error occurs, allow the request (fail open for availability)
    console.error('Feature flag rate limit check error:', error)
    return {
      allowed: true,
      remaining: FEATURE_FLAG_MAX_ATTEMPTS,
      resetAt: new Date(Date.now() + FEATURE_FLAG_RATE_LIMIT_WINDOW_MS),
    }
  }
}
