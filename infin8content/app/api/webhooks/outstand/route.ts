/**
 * app/api/webhooks/outstand/route.ts
 *
 * Receives Outstand webhook events:
 *   - post.published  → flip social_status to "published" + store platform post IDs
 *   - post.error      → flip social_status to "failed" + store error details
 *
 * Configure in the Outstand dashboard:
 *   Endpoint URL  : https://yourdomain.com/api/webhooks/outstand
 *   Signing secret: set as OUTSTAND_WEBHOOK_SECRET in .env.local
 *   Events        : post.published, post.error
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/services/outstand/client'

// Raw body reading via req.text() requires the Node.js runtime
export const runtime = 'nodejs'

interface OutstandWebhookBase {
  event: 'post.published' | 'post.error' | 'test'
  timestamp: string
  data: {
    postId: string
    orgId: string
    socialAccounts: Array<{
      network: string
      username: string
      platformPostId?: string
      error?: string
    }>
  }
}

export async function POST(req: NextRequest) {
  // ── 1. Read raw body for signature verification ───────────────────────────
  const rawBody = await req.text()
  const signature = req.headers.get('x-outstand-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let payload: OutstandWebhookBase
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Ignore test pings from the Outstand dashboard
  if (payload.event === 'test') {
    return NextResponse.json({ received: true })
  }

  const { postId, socialAccounts } = payload.data
  // Use service-role client: webhook runs outside user session context
  const supabase = createServiceRoleClient()

  // ── 3. Look up the publish_reference row by outstand_post_id ─────────────
  const { data: ref, error: refErr } = await supabase
    .from('publish_references')
    .select('article_id, organization_id')
    .eq('outstand_post_id', postId)
    .maybeSingle()

  if (refErr || !ref) {
    // Unknown post — return 200 so Outstand doesn't retry endlessly
    console.warn(`[outstand-webhook] Unknown outstand_post_id: ${postId}`)
    return NextResponse.json({ received: true })
  }

  const { article_id, organization_id } = ref as {
    article_id: string
    organization_id: string
  }

  // ── 4. Handle post.published ──────────────────────────────────────────────
  if (payload.event === 'post.published') {
    await supabase
      .from('publish_references')
      .update({
        social_status: 'published',
        published_at: payload.timestamp,
      })
      .eq('outstand_post_id', postId)

    // Upsert per-account platform post ID stubs (metrics filled later by analytics sync)
    const rows = socialAccounts
      .filter((a) => a.platformPostId)
      .map((a) => ({
        article_id,
        organization_id,
        outstand_post_id: postId,
        network: a.network,
        username: a.username,
        platform_post_id: a.platformPostId,
        fetched_at: payload.timestamp,
      }))

    if (rows.length > 0) {
      await supabase
        .from('article_social_analytics')
        .upsert(rows, { onConflict: 'article_id,outstand_post_id,network' })
    }

    await supabase.from('activities').insert({
      organization_id,
      article_id,
      activity_type: 'article_social_published',
      metadata: {
        outstand_post_id: postId,
        networks: socialAccounts.map((a) => a.network),
      },
    })
  }

  // ── 5. Handle post.error ──────────────────────────────────────────────────
  if (payload.event === 'post.error') {
    const errorSummary = socialAccounts
      .filter((a) => a.error)
      .map((a) => `${a.network}: ${a.error}`)
      .join(' | ')

    await supabase
      .from('publish_references')
      .update({
        social_status: 'failed',
        social_error: errorSummary,
      })
      .eq('outstand_post_id', postId)

    await supabase.from('audit_logs').insert({
      org_id: organization_id,
      action: 'article.social_publish_failed',
      details: {
        article_id,
        outstand_post_id: postId,
        errors: socialAccounts
          .filter((a) => a.error)
          .map((a) => ({ network: a.network, error: a.error })),
      },
    })
  }

  return NextResponse.json({ received: true })
}
