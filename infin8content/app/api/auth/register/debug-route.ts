// Debug Registration API route - for troubleshooting only
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
  console.log('🔍 DEBUG: Registration request received')
  
  try {
    // Validate Brevo API key before proceeding
    console.log('🔍 DEBUG: Validating Brevo environment')
    validateBrevoEnv()
    
    const body = await request.json()
    console.log('🔍 DEBUG: Request body:', { email: body.email, passwordLength: body.password?.length })
    
    const { email, password } = registerSchema.parse(body)
    console.log('🔍 DEBUG: Schema validation passed for:', email)

    const supabase = await createClient()
    console.log('🔍 DEBUG: Supabase client created')
    
    // Check if user already exists in auth system
    console.log('🔍 DEBUG: Checking if user exists in auth system')
    // Note: getUserByEmail doesn't exist, we'll rely on the signUp error to detect duplicates
    
    // Sign up user in Supabase Auth
    console.log('🔍 DEBUG: Attempting to sign up user in Supabase Auth')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          email_verified: false,
        },
      },
    })

    if (error) {
      console.log('🔍 DEBUG: Supabase auth error:', error)
      return NextResponse.json(
        { error: `Auth error: ${error.message}` },
        { status: 400 }
      )
    }

    console.log('🔍 DEBUG: Supabase auth success, user ID:', data.user?.id)

    // Create user record in users table
    if (data.user) {
      if (!data.user.email) {
        console.log('🔍 DEBUG: User created but email is missing')
        return NextResponse.json(
          { error: 'Account created but email is missing. Please contact support.' },
          { status: 500 }
        )
      }

      console.log('🔍 DEBUG: Creating user record in users table')
      const { data: userRecord, error: dbError } = await (supabase as any)
        .from('users')
        .insert({
          auth_user_id: data.user.id,
          email: data.user.email,
          role: 'owner',
          org_id: null,
          otp_verified: false,
        })
        .select()
        .single()

      if (dbError || !userRecord) {
        console.log('🔍 DEBUG: Database error creating user record:', dbError)
        return NextResponse.json(
          { error: `Database error: ${dbError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }

      console.log('🔍 DEBUG: User record created successfully:', userRecord.id)

      // Generate and send OTP code via Brevo
      try {
        console.log('🔍 DEBUG: Generating and sending OTP')
        const otpCode = generateOTP()
        await storeOTPCode(userRecord.id, data.user.email, otpCode)
        await sendOTPEmail({
          to: data.user.email,
          otpCode,
        })
        console.log('🔍 DEBUG: OTP sent successfully')
      } catch (otpError) {
        console.log('🔍 DEBUG: OTP send error:', otpError)
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

    console.log('🔍 DEBUG: Registration completed successfully')
    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: 'Account created. Please check your email for the verification code.',
    })
  } catch (error) {
    console.log('🔍 DEBUG: General error:', error)
    if (error instanceof z.ZodError) {
      console.log('🔍 DEBUG: Zod validation error:', error.issues)
      return NextResponse.json(
        { error: `Validation error: ${error.issues[0].message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
