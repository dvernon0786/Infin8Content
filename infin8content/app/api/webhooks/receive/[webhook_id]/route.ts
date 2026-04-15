/**
 * POST /api/webhooks/receive/[webhook_id]
 * Epic 11, Story 11.4 — Inbound webhook receiver
 *
 * Accepts webhooks from external systems. Validates HMAC-SHA256 signature
 * (if configured), stores to webhook_events, dispatches via Inngest.
 *
 * ALWAYS returns 200 immediately — processing is async (same pattern as Stripe).
 * Duplicate events are silently accepted (idempotency handled downstream).
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/security/encryption'
import { inngest } from '@/lib/inngest/client'

export const runtime = 'nodejs' // Required for raw body access

interface RouteParams {
  params: Promise<{ webhook_id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const { webhook_id } = await params

  const db = createServiceRoleClient()

  // Look up the endpoint this webhook_id belongs to
  const { data: endpoint } = await (db
    .from('webhook_endpoints')
    .select('id, org_id, secret_encrypted, status')
    .eq('id', webhook_id)
    .single() as any)

  // Always return 200 to prevent enumeration — even for unknown IDs
  if (!endpoint || endpoint.status !== 'active') {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const rawBody = await request.text()

  // HMAC-SHA256 signature validation
  let signatureValid = false
  const signatureHeader = request.headers.get('x-webhook-signature') ?? ''

  if (endpoint.secret_encrypted) {
    try {
      const secret = decrypt(endpoint.secret_encrypted)
      const expected = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')}`
      // Constant-time comparison prevents timing attacks
      if (signatureHeader.length === expected.length) {
        signatureValid = crypto.timingSafeEqual(
          Buffer.from(signatureHeader),
          Buffer.from(expected)
        )
      }
    } catch {
      signatureValid = false
    }
  } else {
    // No secret configured → accept all (user's choice)
    signatureValid = true
  }

  let payload: Record<string, unknown> = {}
  try {
    payload = JSON.parse(rawBody)
  } catch {
    payload = { raw: rawBody.slice(0, 4096) }
  }

  const source = request.headers.get('user-agent') ?? 'unknown'

  // Store webhook event (fire and respond)
  const { data: evt } = await (db
    .from('webhook_events')
    .insert({
      org_id: endpoint.org_id,
      endpoint_id: endpoint.id,
      source,
      payload,
      signature_valid: signatureValid,
      status: signatureValid ? 'received' : 'skipped',
    })
    .select('id')
    .single() as any)

  if (signatureValid && evt?.id) {
    // Dispatch for async processing via Inngest
    await inngest.send({
      name: 'webhook/inbound.received',
      data: {
        eventId: evt.id,
        orgId: endpoint.org_id,
        endpointId: endpoint.id,
        payload,
      },
    })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
