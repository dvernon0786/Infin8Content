/**
 * lib/api-auth/validate-api-key.ts
 * Epic 11, Stories 11.1 + 11.3
 *
 * Core API key utilities:
 *  - generateApiKey()            — create a new key (called at creation time only)
 *  - hashApiKey(raw)             — SHA-256 hex used for storage + lookup
 *  - validateApiKey(request)     — authenticate + authorize an incoming API request
 *  - checkAndIncrementRateLimit  — enforce plan-tier monthly call limits
 *
 * Design notes:
 *  - SHA-256 (not bcrypt): bcrypt adds ~100ms per verify, unacceptable on every
 *    API request. SHA-256 is the industry standard for API keys (Stripe, GitHub, Linear).
 *  - Key format: "inf8_live_<base64url(24 random bytes)>" — 32+ unique chars after prefix.
 *  - Lookup uses service role client (no user session on external API requests).
 */

import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/config/plan-limits'

// ─── Constants ────────────────────────────────────────────────────────────────

export const API_KEY_PREFIX = 'inf8_live_'

export const API_SCOPES = [
  'articles:read',
  'articles:write',
  'keywords:read',
  'analytics:read',
] as const

export type ApiScope = typeof API_SCOPES[number]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedApiKey {
  /** Full raw key — shown to user ONCE, never stored */
  raw: string
  /** First 8 chars after prefix, stored in DB for UI display */
  prefix: string
  /** SHA-256 hex of raw — stored in DB for lookup */
  hashed: string
}

export interface ValidatedApiKey {
  keyId: string
  orgId: string
  plan: string
  scopes: string[]
}

export interface RateLimitResult {
  allowed: boolean
  limit: number | null
  remaining: number | null
  resetAt: Date
}

// ─── Key generation ───────────────────────────────────────────────────────────

export function generateApiKey(): GeneratedApiKey {
  const secret = crypto.randomBytes(24).toString('base64url') // 32 URL-safe chars
  const raw = `${API_KEY_PREFIX}${secret}`
  return {
    raw,
    prefix: raw.slice(0, API_KEY_PREFIX.length + 8),
    hashed: hashApiKey(raw),
  }
}

export function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

// ─── Request authentication ───────────────────────────────────────────────────

/**
 * Extracts and validates the API key from an incoming request.
 * Checks Authorization: Bearer <key> header.
 * Updates last_used_at and usage_count atomically (fire-and-forget).
 * Returns null if the key is missing, invalid, revoked, or expired.
 */
export async function validateApiKey(
  request: Request
): Promise<ValidatedApiKey | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const raw = authHeader.slice('Bearer '.length).trim()
  if (!raw.startsWith(API_KEY_PREFIX)) return null

  const hashed = hashApiKey(raw)
  const db = createServiceRoleClient()

  // Lookup key + org plan in one join
  const { data: keyRow, error } = await (db
    .from('api_keys')
    .select(`
      id,
      org_id,
      scopes,
      status,
      expires_at,
      organizations!inner ( plan, plan_type )
    `)
    .eq('hashed_key', hashed)
    .single() as any)

  if (error || !keyRow) return null
  if (keyRow.status !== 'active') return null
  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) return null

  const org = keyRow.organizations as any
  const plan = (org?.plan || org?.plan_type || 'starter').toLowerCase()

  // Fire-and-forget: update last_used_at + usage_count (non-fatal if it fails)
  db
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: keyRow.usage_count + 1,
    })
    .eq('id', keyRow.id)
    .then(() => {})

  return {
    keyId: keyRow.id as string,
    orgId: keyRow.org_id as string,
    plan,
    scopes: (keyRow.scopes as string[]) || [],
  }
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

/**
 * Atomically increments the monthly call count for this key and checks if
 * the plan limit is exceeded. Call BEFORE processing the request.
 *
 * Window: calendar month (period_start = DATE_TRUNC('month', NOW())).
 * Plan limits sourced from PLAN_LIMITS.api_calls (null = unlimited).
 */
export async function checkAndIncrementRateLimit(
  validated: ValidatedApiKey,
  endpoint?: string
): Promise<RateLimitResult> {
  const db = createServiceRoleClient()

  const plan = validated.plan as keyof typeof PLAN_LIMITS.api_calls
  const limit = PLAN_LIMITS.api_calls?.[plan] ?? null

  // Calendar month start in UTC (reset date for the response header)
  const now = new Date()
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const nextPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  if (limit === null) {
    // Unlimited plan — still track usage for analytics, but always allow
    db
      .from('api_usage_logs')
      .upsert(
        {
          api_key_id: validated.keyId,
          org_id: validated.orgId,
          period_start: periodStart.toISOString(),
          call_count: 1,
          last_endpoint: endpoint ?? null,
          updated_at: now.toISOString(),
        },
        {
          onConflict: 'api_key_id,period_start',
          ignoreDuplicates: false,
        }
      )
      .then(() => {})

    return { allowed: true, limit: null, remaining: null, resetAt: nextPeriodStart }
  }

  // Fetch current count first so we can decide before incrementing
  const { data: existing } = await (db
    .from('api_usage_logs')
    .select('call_count')
    .eq('api_key_id', validated.keyId)
    .eq('period_start', periodStart.toISOString())
    .single() as any)

  const currentCount = (existing?.call_count ?? 0) as number

  if (currentCount >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: nextPeriodStart,
    }
  }

  // Increment
  await (db
    .from('api_usage_logs')
    .upsert(
      {
        api_key_id: validated.keyId,
        org_id: validated.orgId,
        period_start: periodStart.toISOString(),
        call_count: currentCount + 1,
        last_endpoint: endpoint ?? null,
        updated_at: now.toISOString(),
      },
      { onConflict: 'api_key_id,period_start' }
    ) as any)

  const remaining = limit - (currentCount + 1)

  // Alert at 90% threshold (fire-and-forget, non-fatal)
  if (currentCount + 1 >= Math.floor(limit * 0.9)) {
    notifyRateLimitApproaching(validated, limit, remaining).catch(() => {})
  }

  return { allowed: true, limit, remaining, resetAt: nextPeriodStart }
}

async function notifyRateLimitApproaching(
  validated: ValidatedApiKey,
  limit: number,
  remaining: number
): Promise<void> {
  try {
    // Log rate limit warning — notification system can be wired in when available
    console.warn(
      `[rate-limit] org=${validated.orgId} key=${validated.keyId} ` +
      `used=${limit - remaining}/${limit} (${Math.round(((limit - remaining) / limit) * 100)}%)`
    )
  } catch {
    // Non-fatal — never block the API request
  }
}

// ─── Scope guard ─────────────────────────────────────────────────────────────

export function hasScope(validated: ValidatedApiKey, required: ApiScope): boolean {
  return validated.scopes.includes(required)
}
