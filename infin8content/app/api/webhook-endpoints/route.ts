/**
 * GET  /api/webhook-endpoints   — List all outbound webhook endpoints for the org
 * POST /api/webhook-endpoints   — Create a new outbound webhook endpoint
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { encrypt } from '@/lib/security/encryption'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { z, ZodError } from 'zod'

const SUPPORTED_EVENTS = [
  'article.generated',
  'article.published',
  'article.failed',
  'keyword_research.completed',
  'usage_limit.approaching',
] as const

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().regex(/^https:\/\//, 'URL must start with https://'),
  events: z.array(z.enum(SUPPORTED_EVENTS)).min(1),
  secret: z.string().min(8).optional(), // user-provided, or we generate one
  custom_headers: z.record(z.string()).optional(),
})

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await (supabase
      .from('webhook_endpoints')
      .select(
        'id, name, url, events, status, custom_headers, success_count, failure_count, last_triggered_at, created_at'
      )
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false }) as any)

    if (error) {
      return NextResponse.json({ error: 'Failed to load webhook endpoints' }, { status: 500 })
    }

    // Never return the encrypted secret
    return NextResponse.json({ endpoints: data || [] })
  } catch (err) {
    console.error('[webhook-endpoints GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createSchema.parse(body)

    // Generate a secret if user didn't provide one
    const secret = validated.secret ?? crypto.randomBytes(32).toString('hex')
    const secretEncrypted = encrypt(secret)

    const supabase = await createClient()
    const { data: endpoint, error: insertErr } = await (supabase
      .from('webhook_endpoints')
      .insert({
        org_id: currentUser.org_id,
        created_by: currentUser.id,
        name: validated.name,
        url: validated.url,
        events: validated.events,
        secret_encrypted: secretEncrypted,
        custom_headers: validated.custom_headers ?? {},
        status: 'active',
      })
      .select('id, name, url, events, status, created_at')
      .single() as any)

    if (insertErr) {
      console.error('[webhook-endpoints POST] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create webhook endpoint' }, { status: 500 })
    }

    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'webhook_endpoint.created' as any,
      details: { endpointId: endpoint.id, name: validated.name, events: validated.events },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // Return the plain secret ONCE — never again after this
    return NextResponse.json(
      {
        success: true,
        endpoint: { ...endpoint },
        // Plain secret shown once for user to configure their receiving system
        secret,
        warning: 'Save this secret now — it will not be shown again. Use it to validate X-Webhook-Signature headers.',
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err instanceof ZodError) {
      const first = err.issues[0]
      return NextResponse.json(
        { error: 'Invalid input', details: { field: first.path.join('.'), message: first.message } },
        { status: 400 }
      )
    }
    console.error('[webhook-endpoints POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
