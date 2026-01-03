// Email verification callback route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/verify-email?verified=true'

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session (Supabase Auth email verification flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', requestUrl.origin))
    }

    // Redirect to verification success page
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/verify-email', requestUrl.origin))
}

