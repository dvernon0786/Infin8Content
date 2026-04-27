/**
 * lib/services/google/credential-manager.ts
 *
 * Secure storage and retrieval of Google OAuth tokens via cms_connections table.
 * Tokens are encrypted at rest using AES-256-GCM (same as other CMS integrations).
 *
 * Storage location: cms_connections table
 * Schema:
 *   org_id: organization id
 *   platform: 'google_analytics' | 'google_search_console'
 *   credentials: {
 *     access_token: "...encrypted...",
 *     refresh_token: "...encrypted...",
 *     expires_at: ISO timestamp,
 *     scope: "...",
 *     email: "user@gmail.com",
 *     property_id: "properties/123456789",  // analytics only
 *     site_url: "https://example.com",     // search_console only
 *   }
 */

import { encrypt, decrypt } from '@/lib/security/encryption'
import { createClient } from '@/lib/supabase/server'
import {
  GoogleTokens,
  GoogleService,
  refreshAccessToken,
  isTokenExpired,
  revokeToken,
} from './oauth-client'

export interface AnalyticsMeta {
  email: string
  property_id: string
  property_name?: string
  connected_at: string
  last_synced_at?: string
}

export interface SearchConsoleMeta {
  email: string
  site_url: string
  connected_at: string
  last_synced_at?: string
}

export type GoogleIntegrationMeta = AnalyticsMeta | SearchConsoleMeta


// ─── Type Mapping ────────────────────────────────────────────────────────────

const SERVICE_TO_PLATFORM: Record<GoogleService, 'google_analytics' | 'google_search_console'> = {
  analytics: 'google_analytics',
  search_console: 'google_search_console',
}

const PLATFORM_TO_SERVICE: Record<'google_analytics' | 'google_search_console', GoogleService> = {
  google_analytics: 'analytics',
  google_search_console: 'search_console',
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Save Google OAuth tokens to cms_connections.
 */
export async function saveGoogleTokens(
  orgId: string,
  service: GoogleService,
  tokens: GoogleTokens,
  meta: GoogleIntegrationMeta
): Promise<void> {
  const supabase = await createClient()
  const platform = SERVICE_TO_PLATFORM[service]

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('cms_connections')
    .select('id')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .maybeSingle() as any

  const credentials = {
    access_token: encrypt(tokens.access_token),
    refresh_token: encrypt(tokens.refresh_token),
    expires_at: new Date(tokens.expires_at).toISOString(),
    scope: tokens.scope,
    ...meta,
  }

  if (existing) {
    // Update existing connection
    const { error } = await supabase
      .from('cms_connections')
      .update({
        credentials,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) throw new Error(`Failed to update Google tokens: ${error.message}`)
  } else {
    // Create new connection
    const { error } = await supabase
      .from('cms_connections')
      .insert({
        org_id: orgId,
        platform,
        name: service === 'analytics' ? 'Google Analytics' : 'Google Search Console',
        credentials,
        status: 'active',
      })

    if (error) throw new Error(`Failed to save Google tokens: ${error.message}`)
  }
}

/**
 * Retrieve valid (auto-refreshed) tokens for a service.
 */
export async function getValidTokens(
  orgId: string,
  service: GoogleService
): Promise<GoogleTokens | null> {
  const supabase = await createClient()
  const platform = SERVICE_TO_PLATFORM[service]

  const { data: connection } = await supabase
    .from('cms_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .eq('status', 'active')
    .single() as any

  if (!connection?.credentials) return null

  try {
    const accessToken = decrypt(connection.credentials.access_token)
    const refreshToken = decrypt(connection.credentials.refresh_token)
    const expiresAtIso = connection.credentials.expires_at
    const expiresAtMs = typeof expiresAtIso === 'string'
      ? new Date(expiresAtIso).getTime()
      : expiresAtIso

    const tokens: GoogleTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAtMs,
      scope: connection.credentials.scope,
      token_type: 'Bearer',
    }

    // Auto-refresh if expired
    if (isTokenExpired(tokens)) {
      const refreshed = await refreshAccessToken(refreshToken)
      await saveGoogleTokens(orgId, service, refreshed, {
        ...extractMeta(connection.credentials, service),
      })
      return refreshed
    }

    return tokens
  } catch (err) {
    console.error(`Failed to get valid tokens for ${service}:`, err)
    return null
  }
}

/**
 * Retrieve metadata only (no tokens).
 */
export async function getIntegrationMeta(
  orgId: string,
  service: GoogleService
): Promise<GoogleIntegrationMeta | null> {
  const supabase = await createClient()
  const platform = SERVICE_TO_PLATFORM[service]

  const { data: connection } = await supabase
    .from('cms_connections')
    .select('credentials')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .eq('status', 'active')
    .single() as any

  if (!connection?.credentials) return null

  return extractMeta(connection.credentials, service)
}

/**
 * Get all connected Google service metas.
 */
export async function getAllGoogleIntegrations(orgId: string): Promise<{
  analytics?: AnalyticsMeta
  search_console?: SearchConsoleMeta
}> {
  const supabase = await createClient()

  const { data: connections } = await supabase
    .from('cms_connections')
    .select('platform, credentials')
    .eq('org_id', orgId)
    .in('platform', ['google_analytics', 'google_search_console'])
    .eq('status', 'active') as any

  const result: Record<string, GoogleIntegrationMeta> = {}

  for (const conn of connections || []) {
    const service = PLATFORM_TO_SERVICE[conn.platform as keyof typeof PLATFORM_TO_SERVICE]
    result[service] = extractMeta(conn.credentials, service)
  }

  return result
}

/**
 * Disconnect a Google service — revoke token and remove connection.
 */
export async function disconnectGoogleService(
  orgId: string,
  service: GoogleService
): Promise<void> {
  const supabase = await createClient()
  const platform = SERVICE_TO_PLATFORM[service]

  const { data: connection } = await supabase
    .from('cms_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .single() as any

  if (connection?.credentials) {
    try {
      const accessToken = decrypt(connection.credentials.access_token)
      await revokeToken(accessToken)
    } catch {
      // Best-effort revocation — proceed with removal regardless
    }
  }

  await supabase
    .from('cms_connections')
    .delete()
    .eq('org_id', orgId)
    .eq('platform', platform)
}

/**
 * Update last_synced_at timestamp.
 */
export async function touchLastSynced(orgId: string, service: GoogleService): Promise<void> {
  const supabase = await createClient()
  const platform = SERVICE_TO_PLATFORM[service]

  const { data: connection } = await supabase
    .from('cms_connections')
    .select('credentials')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .single() as any

  if (connection?.credentials) {
    const meta = extractMeta(connection.credentials, service)
    const updated = {
      ...connection.credentials,
      ...meta,
      last_synced_at: new Date().toISOString(),
    }

    await supabase
      .from('cms_connections')
      .update({ credentials: updated })
      .eq('org_id', orgId)
      .eq('platform', platform)
  }
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Extract metadata from stored credentials.
 */
function extractMeta(credentials: Record<string, any>, service: GoogleService): GoogleIntegrationMeta {
  if (service === 'analytics') {
    return {
      email: credentials.email,
      property_id: credentials.property_id,
      property_name: credentials.property_name,
      connected_at: credentials.connected_at || new Date().toISOString(),
      last_synced_at: credentials.last_synced_at,
    }
  } else {
    return {
      email: credentials.email,
      site_url: credentials.site_url,
      connected_at: credentials.connected_at || new Date().toISOString(),
      last_synced_at: credentials.last_synced_at,
    }
  }
}
