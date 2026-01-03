// Registration API route
import { createClient } from '@/lib/supabase/server'
import { validateAppUrl } from '@/lib/supabase/env'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    // Validate app URL before proceeding
    const appUrl = validateAppUrl()
    
    const body = await request.json()
    const { email, password } = registerSchema.parse(body)

    const supabase = await createClient()
    
    // Sign up user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
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
    // CRITICAL: Migration must make org_id nullable before this code runs
    if (data.user) {
      // Validate that email exists (should always exist for email/password signup)
      if (!data.user.email) {
        console.error('User created but email is missing:', data.user.id)
        return NextResponse.json(
          { error: 'Account created but email verification failed. Please contact support.' },
          { status: 500 }
        )
      }

      const { error: dbError } = await supabase
        .from('users')
        .insert({
          auth_user_id: data.user.id,
          email: data.user.email,
          role: 'owner', // Default role, will be updated in Story 1.6
          org_id: null, // Will be set in Story 1.6 when organization is created (MUST be nullable)
        })

      if (dbError) {
        // Log detailed error for debugging
        console.error('Failed to create user record:', {
          error: dbError,
          userId: data.user.id,
          email: data.user.email,
          message: 'User created in auth.users but failed to create record in users table. Manual cleanup may be required.',
        })
        
        // Return error - user exists in auth.users but not in users table
        // This is a data consistency issue that needs to be resolved
        // Note: Admin cleanup would require service role key client (not implemented in this story)
        return NextResponse.json(
          { error: 'Account creation failed. Please try again or contact support.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    // Handle environment validation errors
    if (error instanceof Error && error.message.includes('NEXT_PUBLIC_APP_URL')) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

