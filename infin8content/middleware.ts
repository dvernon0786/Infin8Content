// Root-level Next.js middleware — MUST live here (not in /app/).
// Its sole responsibility: refresh the Supabase session so that all Server
// Components in the same request see a valid, non-expired access token.
// Heavy auth/payment/onboarding logic stays in the dashboard layout and
// individual page server components where it has full DB access.

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match every path except Next.js internals and static assets.
     * This ensures Supabase tokens are refreshed for all page navigations.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
