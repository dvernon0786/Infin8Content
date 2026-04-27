// Feature Flag Utility Functions
// Story 33-4: Enable Intent Engine Feature Flag

import { createClient } from '@supabase/supabase-js'
import { FeatureFlag, FeatureFlagKey } from '@/lib/types/feature-flag'

// Structured logging helper
function logFeatureFlagEvent(level: 'info' | 'warn' | 'error', message: string, context: Record<string, any> = {}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...context
  }

  if (level === 'error') {
    console.error(JSON.stringify(logEntry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry))
  } else {
    console.log(JSON.stringify(logEntry))
  }
}

// Module-level Supabase client (reuse to avoid re-creating per-call)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple in-memory cache for recent feature flag lookups to reduce
// round-trips when many flags are queried during server render.
const FEATURE_FLAG_CACHE_TTL_MS = Number(process.env.FEATURE_FLAG_CACHE_TTL_MS) || 60_000
type CacheEntry = { enabled: boolean; expiresAt: number }
const featureFlagCache = new Map<string, CacheEntry>()

// Check if feature flag is enabled for organization
export async function isFeatureFlagEnabled(
  organizationId: string,
  flagKey: string
): Promise<boolean> {
  const cacheKey = `${organizationId}:${flagKey}`
  const now = Date.now()
  const cached = featureFlagCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.enabled
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .select('enabled')
      .eq('organization_id', organizationId)
      .eq('flag_key', flagKey)
      .single()

    if (error) {
      // If flag doesn't exist, previous behavior was to default to enabled
      // (fail-open). Preserve that behavior but lower the log level to
      // `info` so it doesn't spam warnings for every org without flags.
      if (error.code === 'PGRST116') {
        logFeatureFlagEvent('info', 'Feature flag not found, defaulting to enabled', {
          flagKey,
          organizationId,
          errorCode: error.code
        })
        const enabled = true
        featureFlagCache.set(cacheKey, { enabled, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
        return enabled
      }

      // Log error for monitoring but default to disabled
      logFeatureFlagEvent('error', 'Error checking feature flag', {
        flagKey,
        organizationId,
        error: error.message
      })
      const enabled = false
      featureFlagCache.set(cacheKey, { enabled, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
      return enabled
    }

    const enabled = !!data?.enabled
    featureFlagCache.set(cacheKey, { enabled, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
    return enabled
  } catch (error) {
    logFeatureFlagEvent('error', 'Database error checking feature flag', {
      flagKey,
      organizationId,
      error: error instanceof Error ? error.message : String(error)
    })
    const enabled = false // Fail-safe: default to disabled
    featureFlagCache.set(cacheKey, { enabled, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
    return enabled
  }
}

// Batch-fetch multiple flags for an organization in a single query.
export async function getFeatureFlagsForOrg(
  organizationId: string,
  keys: string[]
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {}
  const now = Date.now()

  // First, satisfy any keys present in the per-key cache
  const missingKeys: string[] = []
  for (const k of keys) {
    const cacheKey = `${organizationId}:${k}`
    const cached = featureFlagCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      result[k] = cached.enabled
    } else {
      missingKeys.push(k)
    }
  }

  if (missingKeys.length === 0) return result

  try {
    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .select('flag_key, enabled')
      .eq('organization_id', organizationId)
      .in('flag_key', missingKeys)

    if (error) {
      // If table access fails, log and default missing flags to enabled (preserve prior behavior)
      if (error.code === 'PGRST116') {
        logFeatureFlagEvent('info', 'Feature flags missing for org (batch)', {
          organizationId,
          keys: missingKeys,
          errorCode: error.code
        })
        for (const k of missingKeys) {
          result[k] = true
          featureFlagCache.set(`${organizationId}:${k}`, { enabled: true, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
        }
        return result
      }

      logFeatureFlagEvent('error', 'Error batch-checking feature flags', { organizationId, keys, error: error.message })
      for (const k of missingKeys) {
        result[k] = false
        featureFlagCache.set(`${organizationId}:${k}`, { enabled: false, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
      }
      return result
    }

    // Map returned rows to result, defaulting any still-missing keys to enabled
    const rows = data ?? []
    const found = new Set<string>()
    for (const row of rows as any[]) {
      const k = row.flag_key
      const enabled = !!row.enabled
      result[k] = enabled
      featureFlagCache.set(`${organizationId}:${k}`, { enabled, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
      found.add(k)
    }

    for (const k of missingKeys) {
      if (!found.has(k)) {
        // Preserve previous behavior for missing rows: default to enabled
        result[k] = true
        featureFlagCache.set(`${organizationId}:${k}`, { enabled: true, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
      }
    }

    return result
  } catch (err) {
    logFeatureFlagEvent('error', 'Database error batch-checking feature flags', { organizationId, keys, error: err instanceof Error ? err.message : String(err) })
    for (const k of missingKeys) {
      result[k] = false
      featureFlagCache.set(`${organizationId}:${k}`, { enabled: false, expiresAt: now + FEATURE_FLAG_CACHE_TTL_MS })
    }
    return result
  }
}

// Get feature flag state with metadata
export async function getFeatureFlag(
  organizationId: string,
  flagKey: string
): Promise<FeatureFlag | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('flag_key', flagKey)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logFeatureFlagEvent('info', 'Feature flag not found', {
          flagKey,
          organizationId
        })
        return null // Flag doesn't exist
      }
      throw error
    }

    return data
  } catch (error) {
    logFeatureFlagEvent('error', 'Error getting feature flag', {
      flagKey,
      organizationId,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// Toggle feature flag (admin only)
export async function toggleFeatureFlag(
  organizationId: string,
  flagKey: string,
  enabled: boolean,
  userId: string
): Promise<FeatureFlag> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert the feature flag
    const { data, error } = await supabase
      .from('feature_flags')
      .upsert({
        organization_id: organizationId,
        flag_key: flagKey,
        enabled: enabled,
        updated_by: userId
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      const errorMsg = 'Failed to create/update feature flag'
      logFeatureFlagEvent('error', errorMsg, {
        flagKey,
        organizationId,
        userId
      })
      throw new Error(errorMsg)
    }

    return data
  } catch (error) {
    logFeatureFlagEvent('error', 'Error toggling feature flag', {
      flagKey,
      organizationId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}
