// OTP generation and verification utilities
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10

/**
 * Generate a cryptographically secure random 6-digit OTP code
 */
export function generateOTP(): string {
  // Use crypto.getRandomValues() for cryptographically secure random number
  const array = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    // Generate 6-digit code (100000-999999)
    const code = 100000 + (array[0] % 900000)
    return code.toString()
  }
  // Fallback for environments without crypto (should not happen in Node.js/Browser)
  // This is less secure but provides backward compatibility
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash an OTP code for secure storage
 */
export function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Store OTP code in database
 */
export async function storeOTPCode(
  userId: string,
  email: string,
  code: string
): Promise<void> {
  // Use service role client to bypass RLS for OTP storage
  const supabase = createServiceRoleClient()

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)

  // Invalidate previous OTPs for this email to prevent multiple valid codes
  await supabase
    .from('otp_codes' as any)
    .update({ expires_at: new Date().toISOString() })
    .eq('email', email)
    .is('verified_at', null)

  const { error } = await supabase
    .from('otp_codes' as any)
    .insert({
      user_id: userId,
      email,
      code: hashOTP(code), // Store hashed code
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    console.error('Failed to store OTP code:', error)
    throw new Error('Failed to generate verification code')
  }
}

/**
 * Verify OTP code with atomic updates to prevent race conditions
 */
export async function verifyOTPCode(
  email: string,
  code: string
): Promise<{ valid: boolean; userId?: string }> {
  // Use service role client to bypass RLS since user is unauthenticated
  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  // First, find the OTP code to get its ID (for potential rollback)
  const { data: otpData, error: findError } = await supabase
    .from('otp_codes' as any)
    .select('id, user_id, expires_at, verified_at')
    .ilike('email', email)
    .eq('code', hashOTP(code)) // Search for hashed code
    .is('verified_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError || !otpData) {
    // OTP is invalid, expired, or already verified
    return { valid: false }
  }

  // Use atomic update to mark OTP as verified
  // This prevents race conditions where multiple requests verify the same OTP
  const { data: updatedOTP, error: updateError } = await supabase
    .from('otp_codes' as any)
    .update({ verified_at: now })
    .eq('id', (otpData as any).id)
    .is('verified_at', null) // Only update if not already verified (atomic check)
    .select('user_id')
    .maybeSingle()

  if (updateError || !updatedOTP) {
    // Another request verified this OTP first (race condition handled)
    return { valid: false }
  }

  // Mark user as OTP verified
  // If this fails, rollback the OTP verification
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ otp_verified: true } as any)
    .eq('id', (updatedOTP as any).user_id)

  if (userUpdateError) {
    console.error('Failed to update user OTP verification status:', userUpdateError)
    // Rollback: Mark OTP as unverified since user update failed
    await supabase
      .from('otp_codes' as any)
      .update({ verified_at: null })
      .eq('id', (otpData as any).id)

    return { valid: false }
  }

  return { valid: true, userId: (updatedOTP as any).user_id }
}

/**
 * Clean up expired OTP codes (can be called periodically)
 */
export async function cleanupExpiredOTPCodes(): Promise<void> {
  const supabase = createServiceRoleClient()

  // Delete expired OTP codes directly instead of using RPC
  const { error } = await supabase
    .from('otp_codes' as any)
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Failed to cleanup expired OTP codes:', error)
  }
}

