// OTP verification API route
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyOTPCode } from '@/lib/services/otp'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = verifyOTPSchema.parse(body)
    const email = parsed.email.toLowerCase().trim()
    const code = parsed.code

    // Verify OTP code — authUserId is returned from the same service-role
    // UPDATE query inside verifyOTPCode(), eliminating the secondary anon-client
    // lookup that was blocked by RLS and caused 404s.
    const { valid, userId, authUserId } = await verifyOTPCode(email, code)

    if (!valid || !userId || !authUserId) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please try again.' },
        { status: 400 }
      )
    }

    // Sync email_confirmed status with Supabase Auth (non-blocking)
    try {
      const supabaseAdmin = createServiceRoleClient()
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        email_confirm: true,
      })
    } catch (syncError) {
      console.error('Failed to sync OTP status with Supabase Auth:', syncError)
      // Non-blocking: middleware checks otp_verified in users table
    }

    // Note: Middleware checks otp_verified in the 'users' table
    // verifyOTPCode() already set that to true atomically.
    //
    // IMPORTANT: Do NOT redirect directly to /create-organization here.
    // No Supabase session cookies exist yet at this point in the flow.
    // Redirect to /login so the user authenticates and session cookies are
    // properly established before hitting any protected route.
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Please log in to continue.',
      redirectTo: '/login?verified=true',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

