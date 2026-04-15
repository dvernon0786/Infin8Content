/**
 * GET    /api/webhook-endpoints/[id]   — Get endpoint details
 * PUT    /api/webhook-endpoints/[id]   — Update endpoint (url, events, name, status)
 * DELETE /api/webhook-endpoints/[id]   — Delete endpoint permanently
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { z, ZodError } from 'zod'

const SUPPORTED_EVENTS = [
  'article.generated',
  'article.published',
  'article.failed',
  'keyword_research.completed',
  'usage_limit.approaching',
] as const

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().regex(/^https:\/\//).optional(),
  events: z.array(z.enum(SUPPORTED_EVENTS)).min(1).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  custom_headers: z.record(z.string()).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await (supabase
      .from('webhook_endpoints')
      .select(
        'id, name, url, events, status, custom_headers, success_count, failure_count, last_triggered_at, created_at, updated_at'
      )
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single() as any)

    if (error || !data) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 })
    }

    return NextResponse.json({ endpoint: data })
  } catch (err) {
    console.error('[webhook-endpoints/:id GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const updates = updateSchema.parse(body)

    const supabase = await createClient()
    const { data, error } = await (supabase
      .from('webhook_endpoints')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .select('id, name, url, events, status, custom_headers, updated_at')
      .single() as any)

    if (error || !data) {
      return NextResponse.json({ error: 'Webhook endpoint not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, endpoint: data })
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.issues[0].message },
        { status: 400 }
      )
    }
    console.error('[webhook-endpoints/:id PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: existing } = await (supabase
      .from('webhook_endpoints')
      .select('id, name')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single() as any)

    if (!existing) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 })
    }

    const { error: delErr } = await (supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id)
      .eq('org_id', currentUser.org_id) as any)

    if (delErr) {
      return NextResponse.json({ error: 'Failed to delete webhook endpoint' }, { status: 500 })
    }

    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'webhook_endpoint.deleted' as any,
      details: { endpointId: id, name: existing.name },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[webhook-endpoints/:id DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
