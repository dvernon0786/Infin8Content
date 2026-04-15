/**
 * lib/services/webhooks/webhook-dispatcher.ts
 * Epic 11, Story 11.5 — Outbound webhook delivery
 *
 * dispatchWebhookEvent(event, orgId) — finds all active endpoints subscribed
 * to the event type, signs the payload HMAC-SHA256, POSTs to each URL (10s timeout),
 * and writes delivery results to webhook_deliveries.
 *
 * Called from:
 *  - lib/inngest/functions/generate-article.ts  (on article completion)
 *  - lib/services/publishing/wordpress-publisher.ts (on publish)
 */

import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/security/encryption'

const DELIVERY_TIMEOUT_MS = 10_000

// ─── Event types ──────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'article.generated'
  | 'article.published'
  | 'article.failed'
  | 'keyword_research.completed'
  | 'usage_limit.approaching'

export interface WebhookPayload {
  event: WebhookEventType
  /** ISO timestamp */
  timestamp: string
  /** Unique event ID for idempotency on the receiver side */
  event_id: string
  data: Record<string, unknown>
}

// ─── HMAC signing ─────────────────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────

export async function dispatchWebhookEvent(
  eventType: WebhookEventType,
  orgId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = createServiceRoleClient()

  // Find all active endpoints subscribed to this event type
  const { data: endpoints, error } = await (db
    .from('webhook_endpoints')
    .select('id, url, secret_encrypted, custom_headers')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .contains('events', [eventType]) as any)

  if (error || !endpoints?.length) return

  const eventId = crypto.randomUUID()
  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    event_id: eventId,
    data,
  }
  const payloadJson = JSON.stringify(payload)

  // Deliver to each endpoint (parallel, non-blocking)
  await Promise.allSettled(endpoints.map((endpoint: any) => deliverToEndpoint(endpoint, payloadJson, orgId, db)))
}

async function deliverToEndpoint(
  endpoint: any,
  payloadJson: string,
  orgId: string,
  db: any
): Promise<void> {
  let secret: string
  try {
    secret = decrypt(endpoint.secret_encrypted)
  } catch {
    console.error(`[webhook-dispatcher] Failed to decrypt secret for endpoint ${endpoint.id}`)
    return
  }

  const signature = signPayload(payloadJson, secret)
  const customHeaders: Record<string, string> = endpoint.custom_headers ?? {}

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

  let responseStatus = 0
  let responseBody = ''
  let success = false

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Infin8-Event': payloadJson ? JSON.parse(payloadJson).event : '',
        'User-Agent': 'Infin8Content-Webhooks/1.0',
        ...customHeaders,
      },
      body: payloadJson,
      signal: controller.signal,
    })
    clearTimeout(timer)
    responseStatus = res.status
    responseBody = await res.text().catch(() => '')
    success = res.ok
  } catch (err: any) {
    clearTimeout(timer)
    responseBody = err.name === 'AbortError' ? 'Request timeout (10s)' : (err.message ?? 'Network error')
  }

  const status = success ? 'delivered' : 'pending' // pending = eligible for retry

  // Write delivery record
  const { data: delivery } = await (db
    .from('webhook_deliveries')
    .insert({
      endpoint_id: endpoint.id,
      org_id: orgId,
      event_type: JSON.parse(payloadJson).event,
      payload: JSON.parse(payloadJson),
      response_status: responseStatus || null,
      response_body: responseBody.slice(0, 2000), // cap stored response
      attempt_count: 1,
      status,
      delivered_at: success ? new Date().toISOString() : null,
      next_retry_at: success ? null : new Date(Date.now() + 30_000).toISOString(), // first retry in 30s
    })
    .select('id')
    .single() as any)

  // Update endpoint stats
  if (success) {
    db.from('webhook_endpoints').update({
      success_count: db.rpc('increment', { x: 1 }), // fallback: just update last triggered
      last_triggered_at: new Date().toISOString(),
    }).eq('id', endpoint.id).then(() => {})
  } else {
    db.from('webhook_endpoints').update({
      failure_count: db.rpc('increment', { x: 1 }),
      last_triggered_at: new Date().toISOString(),
    }).eq('id', endpoint.id).then(() => {})

    // Fire Inngest retry job if delivery was created
    if (delivery?.id) {
      const { inngest } = await import('@/lib/inngest/client')
      inngest.send({
        name: 'webhook/delivery.retry',
        data: { deliveryId: delivery.id, attempt: 1 },
      }).catch(() => {})
    }
  }
}

// ─── Test delivery (used by /[id]/test route) ─────────────────────────────────

export async function sendTestDelivery(endpointId: string, orgId: string): Promise<{
  success: boolean
  status?: number
  error?: string
}> {
  const db = createServiceRoleClient()
  const { data: endpoint, error } = await (db
    .from('webhook_endpoints')
    .select('id, url, secret_encrypted, custom_headers')
    .eq('id', endpointId)
    .eq('org_id', orgId)
    .single() as any)

  if (error || !endpoint) return { success: false, error: 'Endpoint not found' }

  let secret: string
  try {
    secret = decrypt(endpoint.secret_encrypted)
  } catch {
    return { success: false, error: 'Failed to decrypt webhook secret' }
  }

  const testPayload = JSON.stringify({
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    event_id: crypto.randomUUID(),
    data: { message: 'This is a test webhook from Infin8Content' },
  })

  const signature = signPayload(testPayload, secret)
  const controller = new AbortController()
  setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'User-Agent': 'Infin8Content-Webhooks/1.0 (test)',
        ...(endpoint.custom_headers ?? {}),
      },
      body: testPayload,
      signal: controller.signal,
    })
    return { success: res.ok, status: res.status }
  } catch (err: any) {
    return { success: false, error: err.name === 'AbortError' ? 'Request timeout' : err.message }
  }
}
