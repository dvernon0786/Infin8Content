// Environment variable validation
export function validateSupabaseEnv() {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missing: string[] = []
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
        'Please set these in your .env.local file.'
    )
  }
}


