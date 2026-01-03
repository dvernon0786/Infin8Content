// Registration API route with OTP verification via Brevo
import { createClient } from '@/lib/supabase/server'
import { validateBrevoEnv } from '@/lib/supabase/env'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { generateOTP, storeOTPCode } from '@/lib/services/otp'
import { sendOTPEmail } from '@/lib/services/brevo'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    // Validate Brevo API key before proceeding
    validateBrevoEnv()
    
    const body = await request.json()
    const { email, password } = registerSchema.parse(body)

    const supabase = await createClient()
    
    // Sign up user in Supabase Auth (disable email confirmation - we use OTP instead)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // No email verification link needed
        data: {
          email_verified: false, // Will be set to true after OTP verification
        },
      },
    })

    if (error) {
      // Use generic error message to prevent user enumeration
      // Don't reveal whether email exists or not
      return NextResponse.json(
        { error: 'Unable to create account. Please try again or contact support if the problem persists.' },
        { status: 400 }
      )
    }

    // Create user record in users table
    // Note: org_id will be set in Story 1.6 (organization creation)
    // org_id MUST be nullable in schema to allow registration before organization creation
    if (data.user) {
      // Validate that email exists (should always exist for email/password signup)
      if (!data.user.email) {
        console.error('User created but email is missing:', data.user.id)
        return NextResponse.json(
          { error: 'Account created but email is missing. Please contact support.' },
          { status: 500 }
        )
      }

      const { data: userRecord, error: dbError } = await supabase
        .from('users')
        .insert({
          auth_user_id: data.user.id,
          email: data.user.email,
          role: 'owner', // Default role, will be updated in Story 1.6
          org_id: null, // Will be set in Story 1.6 when organization is created (MUST be nullable)
          otp_verified: false, // Will be set to true after OTP verification
        })
        .select()
        .single()

      if (dbError || !userRecord) {
        // Log detailed error for debugging
        console.error('Failed to create user record:', {
          error: dbError,
          userId: data.user.id,
          email: data.user.email,
          message: 'User created in auth.users but failed to create record in users table. Manual cleanup may be required.',
        })
        
        // Return error - user exists in auth.users but not in users table
        return NextResponse.json(
          { error: 'Account creation failed. Please try again or contact support.' },
          { status: 500 }
        )
      }

      // Generate and send OTP code via Brevo
      try {
        const otpCode = generateOTP()
        await storeOTPCode(userRecord.id, data.user.email, otpCode)
        await sendOTPEmail({
          to: data.user.email,
          otpCode,
        })
      } catch (otpError) {
        console.error('Failed to send OTP email:', otpError)
        // User is created, but OTP send failed - return success but note OTP issue
        // User can request OTP resend later
        return NextResponse.json(
          { 
            success: true, 
            user: data.user,
            message: 'Account created, but verification email failed to send. Please try logging in to resend.',
          },
          { status: 201 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: 'Account created. Please check your email for the verification code.',
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

