// Resend OTP code API route
import { createClient } from '@/lib/supabase/server'
import { generateOTP, storeOTPCode } from '@/lib/services/otp'
import { sendOTPEmail } from '@/lib/services/brevo'
import { checkOTPResendRateLimit } from '@/lib/utils/rate-limit'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = resendOTPSchema.parse(body)

    const supabase = await createClient()
    
    // Find user by email
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('id, otp_verified')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Don't reveal if email exists - return generic message
      return NextResponse.json(
        { message: 'If an account exists with this email, a verification code has been sent.' },
        { status: 200 }
      )
    }

    // Don't resend if already verified
    if (user.otp_verified) {
      return NextResponse.json(
        { message: 'Email is already verified.' },
        { status: 200 }
      )
    }

    // Check rate limit before generating OTP
    const rateLimit = await checkOTPResendRateLimit(email)
    if (!rateLimit.allowed) {
      const secondsUntilReset = Math.ceil(
        (rateLimit.resetAt.getTime() - Date.now()) / 1000
      )
      return NextResponse.json(
        {
          error: `Too many resend attempts. Please try again in ${Math.ceil(secondsUntilReset / 60)} minute(s).`,
          rateLimit: {
            remaining: rateLimit.remaining,
            resetAt: rateLimit.resetAt.toISOString(),
          },
        },
        { status: 429 }
      )
    }

    // Generate and send new OTP code
    try {
      const otpCode = generateOTP()
      await storeOTPCode(user.id, email, otpCode)
      await sendOTPEmail({
        to: email,
        otpCode,
      })
    } catch (otpError) {
      console.error('Failed to resend OTP email:', otpError)
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Verification code has been sent to your email.',
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

