// Login API route with OTP verification check and payment status redirect
import { createClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'
import { getPaymentAccessStatus } from '@/lib/utils/payment-status'

type Organization = Database['public']['Tables']['organizations']['Row']

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// API Response Types
export interface LoginSuccessResponse {
  success: true
  user: {
    id: string
    email: string
    role: string
  }
  redirectTo: '/dashboard' | '/payment' | '/create-organization'
}

export interface LoginErrorResponse {
  error: string
  redirectTo?: string
}

export async function POST(request: Request) {
  try {
    // Validate Supabase environment variables
    validateSupabaseEnv()
    
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabase = await createClient()
    
    // Sign in user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log failed login attempt for security monitoring
      console.warn('Failed login attempt:', { email, error: error.message })
      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!data.user) {
      // Log failed login attempt for security monitoring
      console.warn('Failed login attempt: No user returned', { email })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify user has completed OTP verification
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { data: userRecord, error: userError } = await (supabase as any)
      .from('users')
      .select('id, email, role, org_id, otp_verified')
      .eq('auth_user_id', data.user.id)
      .single()

    if (userError || !userRecord) {
      console.error('Failed to load user record:', userError)
      return NextResponse.json(
        { error: 'Unable to load user information. Please try again.' },
        { status: 500 }
      )
    }

    // Check OTP verification status
    if (!userRecord.otp_verified) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          redirectTo: `/verify-email?email=${encodeURIComponent(email)}`,
        },
        { status: 403 }
      )
    }

    // Determine redirect destination based on organization and payment status
    let redirectTo = '/dashboard'

    if (!userRecord.org_id) {
      // No organization - redirect to organization creation (Story 1.6)
      redirectTo = '/create-organization'
    } else {
      // Organization exists - check payment status (Story 1.7, enhanced in Story 1.8)
      // TODO: Remove type assertion after regenerating types from Supabase Dashboard
      const { data: org, error: orgError } = await (supabase as any)
        .from('organizations')
        .select('*')
        .eq('id', userRecord.org_id)
        .single()

      if (orgError || !org) {
        // Organization ID exists but organization not found (orphaned user record)
        // Log error for debugging
        console.error('Failed to load organization for user:', {
          userId: userRecord.id,
          orgId: userRecord.org_id,
          error: orgError,
        })
        redirectTo = '/create-organization'
      } else {
        // Get payment access status using utility function (handles grace period logic)
        const accessStatus = getPaymentAccessStatus(org)
        
        if (accessStatus === 'active') {
          // Payment confirmed - redirect to dashboard
          redirectTo = '/dashboard'
        } else if (accessStatus === 'grace_period') {
          // Grace period active - allow access to dashboard (future: show banner)
          redirectTo = '/dashboard'
        } else if (accessStatus === 'suspended') {
          // Account suspended - redirect to suspension page
          redirectTo = '/suspended'
        } else {
          // Payment pending or canceled - redirect to payment page
          redirectTo = '/payment'
        }
      }
    }

    // Session is automatically stored in cookies by Supabase SSR
    // No manual cookie handling needed

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
      },
      redirectTo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

