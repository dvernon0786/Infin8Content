// Forgot password API route
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = forgotPasswordSchema.parse(body)
    const email = parsed.email.toLowerCase().trim()

    const supabase = await createClient()

    // Determine origin for the redirect URL
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://infin8content.com'
    const redirectTo = `${origin}/auth/callback?next=/update-password`

    // Always return success to prevent email enumeration
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
