// Rate limiting utility for OTP resend requests
import { createClient } from '@/lib/supabase/server'

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 3 // Maximum 3 resends per 10 minutes

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
    .from('otp_codes')
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
  const resetAt = recentCodes && recentCodes.length > 0 && recentCodes[0].created_at
    ? new Date(new Date(recentCodes[0].created_at).getTime() + RATE_LIMIT_WINDOW_MS)
    : new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)

  return {
    allowed,
    remaining,
    resetAt,
  }
}

