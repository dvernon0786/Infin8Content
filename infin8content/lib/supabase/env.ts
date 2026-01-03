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

// Validate Brevo API key
export function validateBrevoEnv() {
  const brevoApiKey = process.env.BREVO_API_KEY
  if (!brevoApiKey) {
    throw new Error(
      'Missing required environment variable: BREVO_API_KEY\n' +
        'This is required for OTP email delivery. Please set it in your .env.local file.'
    )
  }
  return brevoApiKey
}

// Validate app URL for email verification redirects
export function validateAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_APP_URL\n' +
        'This is required for email verification redirects. Please set it in your .env.local file.\n' +
        'Example: NEXT_PUBLIC_APP_URL=http://localhost:3000 (development) or https://yourdomain.com (production)'
    )
  }
  return appUrl
}


