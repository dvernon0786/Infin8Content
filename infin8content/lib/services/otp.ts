// OTP generation and verification utilities
import { createClient } from '@/lib/supabase/server'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP code in database
 */
export async function storeOTPCode(
  userId: string,
  email: string,
  code: string
): Promise<void> {
  const supabase = await createClient()
  
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)
  
  const { error } = await supabase
    .from('otp_codes')
    .insert({
      user_id: userId,
      email,
      code,
      expires_at: expiresAt.toISOString(),
    })
  
  if (error) {
    console.error('Failed to store OTP code:', error)
    throw new Error('Failed to generate verification code')
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTPCode(
  email: string,
  code: string
): Promise<{ valid: boolean; userId?: string }> {
  const supabase = await createClient()
  
  // Find valid, unexpired OTP code
  const { data, error } = await supabase
    .from('otp_codes')
    .select('id, user_id, expires_at, verified_at')
    .eq('email', email)
    .eq('code', code)
    .is('verified_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    return { valid: false }
  }
  
  // Mark OTP as verified
  const { error: updateError } = await supabase
    .from('otp_codes')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', data.id)
  
  if (updateError) {
    console.error('Failed to mark OTP as verified:', updateError)
    return { valid: false }
  }
  
  // Mark user as OTP verified
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ otp_verified: true })
    .eq('id', data.user_id)
  
  if (userUpdateError) {
    console.error('Failed to update user OTP verification status:', userUpdateError)
    // OTP is valid, but user update failed - still return valid
  }
  
  return { valid: true, userId: data.user_id }
}

/**
 * Clean up expired OTP codes (can be called periodically)
 */
export async function cleanupExpiredOTPCodes(): Promise<void> {
  const supabase = await createClient()
  
  // Delete expired OTP codes directly instead of using RPC
  const { error } = await supabase
    .from('otp_codes')
    .delete()
    .lt('expires_at', new Date().toISOString())
  
  if (error) {
    console.error('Failed to cleanup expired OTP codes:', error)
  }
}

