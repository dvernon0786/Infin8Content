// Client-side Supabase client (browser)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  // Validate environment variables before creating client
  // Note: Only public env vars are needed for client-side (service role key is server-only)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createBrowserClient<Database>(url, anonKey)
}

