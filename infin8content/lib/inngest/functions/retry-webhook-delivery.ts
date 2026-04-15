/**
 * lib/inngest/functions/retry-webhook-delivery.ts
 * Epic 11, Story 11.5 — Retry failed outbound webhook deliveries with exponential backoff.
 *
 * Registered in: app/api/inngest/route.ts
 *
 * Retry schedule: 30s → 5min → 30min (3 attempts total, then mark failed)
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/security/encryption'
import crypto from 'crypto'

const MAX_ATTEMPTS = 3
// Delay (ms) per attempt: attempt 1 = 30s, 2 = 5min, 3 = 30min
const RETRY_DELAYS_MS = [30_000, 300_000, 1_800_000]

export const retryWebhookDelivery = inngest.createFunction(
  {
    id: 'retry-webhook-delivery',
    name: 'Retry Webhook Delivery',
    concurrency: { limit: 10 },
  },
  { event: 'webhook/delivery.retry' },
  async ({ event, step, logger }) => {
    const { deliveryId, attempt } = event.data as {
      deliveryId: string
      attempt: number
    }

    // Wait before retrying (sleep handled by Inngest step scheduling)
    const delayMs = RETRY_DELAYS_MS[attempt - 1] ?? 1_800_000
    await step.sleep(`wait-before-retry-${attempt}`, delayMs)

    const db = createServiceRoleClient()

    const { data: delivery } = await (db
      .from('webhook_deliveries')
      .select('id, endpoint_id, org_id, payload')
      .eq('id', deliveryId)
      .eq('status', 'pending')
      .single() as any)

    if (!delivery) {
      logger.info(`Delivery ${deliveryId} no longer pending — skipping retry`)
      return { skipped: true }
    }

    const { data: endpoint } = await (db
      .from('webhook_endpoints')
      .select('url, secret_encrypted, custom_headers, status')
      .eq('id', delivery.endpoint_id)
      .single() as any)

    if (!endpoint || endpoint.status !== 'active') {
      await (db
        .from('webhook_deliveries')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', deliveryId) as any)
      return { failed: true, reason: 'endpoint inactive or not found' }
    }

    let secret: string
    try {
      secret = decrypt(endpoint.secret_encrypted)
    } catch {
      logger.error(`Cannot decrypt webhook secret for endpoint ${delivery.endpoint_id}`)
      await db.from('webhook_deliveries').update({ status: 'failed' }).eq('id', deliveryId)
      return { failed: true, reason: 'secret decryption failed' }
    }

    const payloadJson = JSON.stringify(delivery.payload)
    const signature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payloadJson)
      .digest('hex')}`

    let success = false
    let responseStatus = 0
    let responseBody = ''

    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10_000)

      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'Infin8Content-Webhooks/1.0 (retry)',
          ...(endpoint.custom_headers ?? {}),
        },
        body: payloadJson,
        signal: controller.signal,
      })
      responseStatus = res.status
      responseBody = await res.text().catch(() => '')
      success = res.ok
    } catch (err: any) {
      responseBody = err.name === 'AbortError' ? 'Timeout' : (err.message ?? 'Network error')
    }

    const nextAttempt = attempt + 1

    if (success) {
      await (db
        .from('webhook_deliveries')
        .update({
          status: 'delivered',
          response_status: responseStatus,
          response_body: responseBody.slice(0, 2000),
          attempt_count: nextAttempt,
          delivered_at: new Date().toISOString(),
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId) as any)

      return { success: true, attempt }
    }

    if (nextAttempt > MAX_ATTEMPTS) {
      // Give up
      await (db
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          response_status: responseStatus || null,
          response_body: responseBody.slice(0, 2000),
          attempt_count: nextAttempt,
          next_retry_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId) as any)

      logger.warn(`Delivery ${deliveryId} failed after ${MAX_ATTEMPTS} attempts`)
      return { failed: true, reason: 'max attempts reached' }
    }

    // Schedule next retry
    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[nextAttempt - 1]).toISOString()
    await (db
      .from('webhook_deliveries')
      .update({
        attempt_count: nextAttempt,
        response_status: responseStatus || null,
        response_body: responseBody.slice(0, 2000),
        next_retry_at: nextRetryAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryId) as any)

    await inngest.send({
      name: 'webhook/delivery.retry',
      data: { deliveryId, attempt: nextAttempt },
    })

    return { retrying: true, nextAttempt }
  }
)
