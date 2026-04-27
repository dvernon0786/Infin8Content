/**
 * app/api/dashboard/google/oauth/callback/route.ts
 *
 * Handles the OAuth2 redirect from Google after the user grants consent.
 *
 * Flow:
 *   1. Google redirects to this URL with ?code=...&state=...
 *   2. We decode state to get { service, orgId }
 *   3. Exchange code for tokens
 *   4. Fetch user email via userinfo endpoint
 *   5. For analytics: list properties and store first one (user can change later)
 *   6. For search_console: list sites and store first verified site
 *   7. Save encrypted tokens to org's blog_config
 *   8. Redirect to /dashboard/settings/integrations?connected=<service>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import {
  exchangeCodeForTokens,
  decodeState,
  GoogleService,
} from '@/lib/services/google/oauth-client'
import {
  saveGoogleTokens,
  AnalyticsMeta,
  SearchConsoleMeta,
} from '@/lib/services/google/credential-manager'
import { listGA4Properties } from '@/lib/services/google/analytics-client'
import { listVerifiedSites } from '@/lib/services/google/search-console-client'

const REDIRECT_BASE = '/dashboard/settings/integrations'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // ── User cancelled or error from Google ──────────────────────────────────
  if (error || !code || !state) {
    const reason = error || 'missing_code'
    console.warn('[Google OAuth] Callback error:', reason)
    return redirectWithError(reason)
  }

  try {
    // ── Decode state (CSRF check) ─────────────────────────────────────────
    const { service, orgId } = decodeState(state)

    // ── Authenticate the requesting user ─────────────────────────────────
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return redirectWithError('unauthorized')
    }

    // Ensure the state org matches the authenticated user's org
    if (currentUser.org_id !== orgId) {
      console.error('[Google OAuth] Org mismatch — state orgId:', orgId, 'user orgId:', currentUser.org_id)
      return redirectWithError('org_mismatch')
    }

    // ── Exchange code for tokens ──────────────────────────────────────────
    const tokens = await exchangeCodeForTokens(code)

    // ── Fetch user email ──────────────────────────────────────────────────
    const email = await fetchUserEmail(tokens.access_token)

    // ── Service-specific metadata ─────────────────────────────────────────
    if (service === 'analytics') {
      await handleAnalyticsConnection(orgId, tokens, email)
    } else if (service === 'search_console') {
      await handleSearchConsoleConnection(orgId, tokens, email)
    } else {
      return redirectWithError('unknown_service')
    }

    console.log(`[Google OAuth] Successfully connected ${service} for org ${orgId}`)
    return NextResponse.redirect(
      new URL(`${REDIRECT_BASE}?connected=${service}`, request.url)
    )
  } catch (err: any) {
    console.error('[Google OAuth] Callback failed:', err?.message)
    return redirectWithError('server_error')
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleAnalyticsConnection(
  orgId: string,
  tokens: Awaited<ReturnType<typeof exchangeCodeForTokens>>,
  email: string
): Promise<void> {
  let propertyId   = ''
  let propertyName = ''

  try {
    const properties = await listGA4Properties(tokens.access_token)
    if (properties.length > 0) {
      propertyId   = properties[0].property_id
      propertyName = properties[0].display_name
    }
  } catch (err) {
    // Non-fatal — user can select property manually in settings
    console.warn('[Google OAuth] Failed to auto-detect GA4 property:', err)
  }

  const meta: AnalyticsMeta = {
    email,
    property_id:   propertyId,
    property_name: propertyName,
    connected_at:  new Date().toISOString(),
  }

  await saveGoogleTokens(orgId, 'analytics', tokens, meta)
}

async function handleSearchConsoleConnection(
  orgId: string,
  tokens: Awaited<ReturnType<typeof exchangeCodeForTokens>>,
  email: string
): Promise<void> {
  let siteUrl = ''

  try {
    const sites = await listVerifiedSites(tokens.access_token)
    // Prefer siteOwner > siteFullUser, fall back to first available
    const preferred = sites.find(s => s.permission_level === 'siteOwner') || sites[0]
    if (preferred) siteUrl = preferred.site_url
  } catch (err) {
    console.warn('[Google OAuth] Failed to auto-detect GSC site:', err)
  }

  const meta: SearchConsoleMeta = {
    email,
    site_url:    siteUrl,
    connected_at: new Date().toISOString(),
  }

  await saveGoogleTokens(orgId, 'search_console', tokens, meta)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchUserEmail(accessToken: string): Promise<string> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return ''
    const data = await res.json()
    return data.email || ''
  } catch {
    return ''
  }
}

function redirectWithError(reason: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return NextResponse.redirect(
    new URL(`${REDIRECT_BASE}?error=${reason}`, appUrl)
  )
}
