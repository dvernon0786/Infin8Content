// Middleware Supabase client (auth checks)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // Return error response if env vars are missing
    return NextResponse.json(
      {
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Missing required Supabase environment variables',
          actionableSteps: [
            'Set NEXT_PUBLIC_SUPABASE_URL in your .env.local file',
            'Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file',
          ],
          retryable: false,
        },
      },
      { status: 500 }
    )
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}

