/**
 * lib/services/google/oauth-client.ts
 *
 * Google OAuth2 client for Analytics and Search Console.
 * Handles auth URL generation, token exchange, and token refresh.
 *
 * Scopes:
 *   GA4:  https://www.googleapis.com/auth/analytics.readonly
 *   GSC:  https://www.googleapis.com/auth/webmasters.readonly
 */

export type GoogleService = 'analytics' | 'search_console'

const SCOPES: Record<GoogleService, string> = {
  analytics:      'https://www.googleapis.com/auth/analytics.readonly',
  search_console: 'https://www.googleapis.com/auth/webmasters.readonly',
}

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_at: number   // Unix ms
  scope: string
  token_type: string
}

export interface GoogleAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

function getConfig(): GoogleAuthConfig {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!clientId || !clientSecret) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables.'
    )
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/dashboard/google/oauth/callback`,
  }
}

/**
 * Build the Google OAuth consent URL.
 * State encodes the service type + org-scoped nonce for CSRF protection.
 */
export function buildAuthUrl(service: GoogleService, orgId: string): string {
  const { clientId, redirectUri } = getConfig()
  const state = Buffer.from(JSON.stringify({ service, orgId })).toString('base64url')

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope:        SCOPES[service],
    access_type:  'offline',   // request refresh_token
    prompt:       'consent',   // always show consent to get refresh_token
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Decode and validate the state parameter returned by Google.
 */
export function decodeState(state: string): { service: GoogleService; orgId: string } {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'))
    if (!decoded.service || !decoded.orgId) throw new Error('Invalid state')
    return decoded
  } catch {
    throw new Error('Invalid OAuth state parameter')
  }
}

/**
 * Exchange the auth code for access + refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = getConfig()

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token exchange failed: ${err.error_description || res.statusText}`)
  }

  const data = await res.json()
  return normalizeTokenResponse(data)
}

/**
 * Use a refresh_token to obtain a fresh access_token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = getConfig()

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'refresh_token',
    }).toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token refresh failed: ${err.error_description || res.statusText}`)
  }

  const data = await res.json()
  // Google does not return a new refresh_token on refresh — preserve the existing one
  return normalizeTokenResponse({ ...data, refresh_token: refreshToken })
}

/**
 * Check if a token is expired (with 60-second buffer).
 */
export function isTokenExpired(tokens: GoogleTokens): boolean {
  return Date.now() >= tokens.expires_at - 60_000
}

/**
 * Revoke a Google access token (used on disconnect).
 */
export async function revokeToken(accessToken: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
  })
  // Best-effort — ignore errors (token may already be expired)
}

// ─── Internal ────────────────────────────────────────────────────────────────

function normalizeTokenResponse(data: any): GoogleTokens {
  return {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + (data.expires_in ?? 3600) * 1000,
    scope:         data.scope ?? '',
    token_type:    data.token_type ?? 'Bearer',
  }
}
