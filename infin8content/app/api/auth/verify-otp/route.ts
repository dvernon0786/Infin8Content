// OTP verification API route
import { createClient } from '@/lib/supabase/server'
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
    const { email, code } = verifyOTPSchema.parse(body)

    // Verify OTP code
    const { valid, userId } = await verifyOTPCode(email, code)

    if (!valid || !userId) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please try again.' },
        { status: 400 }
      )
    }

    // Get the auth_user_id from users table
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('id', userId)
      .single()

    if (userError || !user || !user.auth_user_id) {
      return NextResponse.json(
        { error: 'User not found. Please try registering again.' },
        { status: 404 }
      )
    }

    // Note: We don't update Supabase Auth email_confirmed_at here
    // Instead, we rely on the otp_verified flag in the users table
    // Middleware checks otp_verified instead of email_confirmed_at

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully. You can now access your account.',
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

