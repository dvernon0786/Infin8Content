/**
 * lib/services/google/credential-manager.ts
 *
 * Secure storage and retrieval of Google OAuth tokens.
 * Tokens are encrypted at rest using the same AES-256-GCM pattern
 * as CMS credentials (lib/security/encryption.ts).
 *
 * Storage location: organizations.blog_config.google_integrations
 * Shape:
 *   {
 *     analytics:      { ...encryptedTokenBlob, connected_at, email, property_id }
 *     search_console: { ...encryptedTokenBlob, connected_at, email, site_url }
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
  property_id: string    // GA4 property id, e.g. "properties/123456789"
  property_name?: string
  connected_at: string
  last_synced_at?: string
}

export interface SearchConsoleMeta {
  email: string
  site_url: string       // verified property URL in GSC
  connected_at: string
  last_synced_at?: string
}

export type GoogleIntegrationMeta = AnalyticsMeta | SearchConsoleMeta

interface StoredIntegration {
  encrypted_tokens: string         // encrypt(JSON.stringify(tokens))
  meta: GoogleIntegrationMeta
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Persist tokens for a Google service under the org's blog_config.
 */
export async function saveGoogleTokens(
  orgId: string,
  service: GoogleService,
  tokens: GoogleTokens,
  meta: GoogleIntegrationMeta
): Promise<void> {
  const supabase = await createClient()

  // Fetch current config
  const { data: org } = await supabase
    .from('organizations')
    .select('blog_config')
    .eq('id', orgId)
    .single() as any

  const blogConfig = org?.blog_config || {}
  const googleIntegrations = blogConfig.google_integrations || {}

  const stored: StoredIntegration = {
    encrypted_tokens: encrypt(JSON.stringify(tokens)),
    meta,
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      blog_config: {
        ...blogConfig,
        google_integrations: {
          ...googleIntegrations,
          [service]: stored,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  if (error) throw new Error(`Failed to save Google tokens: ${error.message}`)
}

/**
 * Retrieve valid (auto-refreshed) tokens for a service.
 * Returns null if the service is not connected.
 */
export async function getValidTokens(
  orgId: string,
  service: GoogleService
): Promise<GoogleTokens | null> {
  const stored = await loadStoredIntegration(orgId, service)
  if (!stored) return null

  let tokens: GoogleTokens = JSON.parse(decrypt(stored.encrypted_tokens))

  if (isTokenExpired(tokens)) {
    tokens = await refreshAccessToken(tokens.refresh_token)
    // Persist refreshed tokens
    await saveGoogleTokens(orgId, service, tokens, stored.meta)
  }

  return tokens
}

/**
 * Retrieve display metadata only (no tokens).
 */
export async function getIntegrationMeta(
  orgId: string,
  service: GoogleService
): Promise<GoogleIntegrationMeta | null> {
  const stored = await loadStoredIntegration(orgId, service)
  return stored?.meta ?? null
}

/**
 * Get all connected Google service metas for the org.
 */
export async function getAllGoogleIntegrations(orgId: string): Promise<{
  analytics?: AnalyticsMeta
  search_console?: SearchConsoleMeta
}> {
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('blog_config')
    .eq('id', orgId)
    .single() as any

  const googleIntegrations = org?.blog_config?.google_integrations || {}
  const result: Record<string, GoogleIntegrationMeta> = {}

  for (const [svc, stored] of Object.entries(googleIntegrations) as [string, StoredIntegration][]) {
    if (stored?.meta) result[svc] = stored.meta
  }

  return result
}

/**
 * Disconnect a Google service — revoke the access token and remove stored data.
 */
export async function disconnectGoogleService(
  orgId: string,
  service: GoogleService
): Promise<void> {
  const stored = await loadStoredIntegration(orgId, service)

  if (stored) {
    try {
      const tokens: GoogleTokens = JSON.parse(decrypt(stored.encrypted_tokens))
      await revokeToken(tokens.access_token)
    } catch {
      // Best-effort revocation — proceed with removal regardless
    }
  }

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('blog_config')
    .eq('id', orgId)
    .single() as any

  const blogConfig = org?.blog_config || {}
  const googleIntegrations = { ...(blogConfig.google_integrations || {}) }
  delete googleIntegrations[service]

  await supabase
    .from('organizations')
    .update({
      blog_config: { ...blogConfig, google_integrations: googleIntegrations },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
}

/**
 * Update the last_synced_at timestamp for a service.
 */
export async function touchLastSynced(orgId: string, service: GoogleService): Promise<void> {
  const stored = await loadStoredIntegration(orgId, service)
  if (!stored) return

  await saveGoogleTokens(orgId, service, JSON.parse(decrypt(stored.encrypted_tokens)), {
    ...stored.meta,
    last_synced_at: new Date().toISOString(),
  })
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function loadStoredIntegration(
  orgId: string,
  service: GoogleService
): Promise<StoredIntegration | null> {
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('blog_config')
    .eq('id', orgId)
    .single() as any

  const stored = org?.blog_config?.google_integrations?.[service]
  return stored ?? null
}
