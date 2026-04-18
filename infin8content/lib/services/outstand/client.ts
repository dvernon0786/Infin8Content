/**
 * lib/services/outstand/client.ts
 *
 * Thin, typed wrapper around the Outstand REST API.
 * All methods throw on non-2xx so callers can catch cleanly.
 */

const BASE = 'https://api.outstand.so/v1'

function headers() {
  const key = process.env.OUTSTAND_API_KEY
  if (!key) throw new Error('OUTSTAND_API_KEY is not set')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const json = await res.json()

  if (!res.ok || json.success === false) {
    const msg = json.error ?? json.message ?? `Outstand API error ${res.status}`
    throw new Error(msg)
  }

  return json as T
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OutstandSocialAccount {
  id: string
  nickname: string
  network: string
  username: string
}

export interface OutstandPost {
  id: string
  orgId: string
  publishedAt: string | null
  scheduledAt: string | null
  isDraft: boolean
  createdAt: string
  socialAccounts: OutstandSocialAccount[]
}

export interface OutstandAnalyticsPerAccount {
  social_account: OutstandSocialAccount
  platform_post_id: string
  published_at: string
  metrics: {
    likes: number
    comments: number
    shares: number
    views: number
    impressions: number
    reach: number
    engagement_rate: number
    platform_specific?: Record<string, unknown>
  }
}

export interface OutstandPostAnalytics {
  post: { id: string; publishedAt: string; createdAt: string }
  metrics_by_account: OutstandAnalyticsPerAccount[]
  aggregated_metrics: {
    total_likes: number
    total_comments: number
    total_shares: number
    total_views: number
    total_impressions: number
    total_reach: number
    average_engagement_rate: number
  }
}

export interface CreatePostPayload {
  content: string
  /** Outstand social account IDs to publish to */
  accounts: string[]
  /** ISO-8601 — omit to publish immediately */
  scheduledAt?: string
}

// ── API methods ───────────────────────────────────────────────────────────────

/** List all connected social accounts for the authenticated Outstand org. */
export async function listSocialAccounts(): Promise<OutstandSocialAccount[]> {
  const res = await request<{ data: OutstandSocialAccount[] }>('GET', '/social-accounts')
  return res.data
}

/** Create (and immediately publish) a post to one or more social accounts. */
export async function createPost(payload: CreatePostPayload): Promise<OutstandPost> {
  const res = await request<{ success: boolean; post: OutstandPost }>('POST', '/posts/', payload)
  return res.post
}

/** Fetch aggregated + per-account analytics for an already-published post. */
export async function getPostAnalytics(outstandPostId: string): Promise<OutstandPostAnalytics> {
  return request<OutstandPostAnalytics>('GET', `/posts/${outstandPostId}/analytics`)
}

/**
 * Verify the HMAC-SHA256 signature on an inbound Outstand webhook.
 * Returns true only when the signature is valid.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.OUTSTAND_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const { createHmac, timingSafeEqual } = require('crypto') as typeof import('crypto')

  const expected =
    'sha256=' + createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}
