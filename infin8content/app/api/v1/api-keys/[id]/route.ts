/**
 * GET    /api/v1/api-keys/[id]  — Get key details (never returns hashed_key)
 * DELETE /api/v1/api-keys/[id]  — Revoke key (irreversible — status → 'revoked')
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'

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
      .from('api_keys')
      .select(
        'id, name, description, key_prefix, scopes, status, expires_at, last_used_at, usage_count, created_at, updated_at'
      )
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single() as any)

    if (error || !data) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return NextResponse.json({ key: data })
  } catch (err) {
    console.error('[api-keys/:id GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE (revoke) ───────────────────────────────────────────────────────────

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify ownership before revoking
    const { data: existing, error: fetchErr } = await (supabase
      .from('api_keys')
      .select('id, name, status')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single() as any)

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    if (existing.status === 'revoked') {
      return NextResponse.json({ error: 'API key is already revoked' }, { status: 409 })
    }

    const { error: updateErr } = await (supabase
      .from('api_keys')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', currentUser.org_id) as any)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
    }

    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'api_key.revoked' as any,
      details: { keyId: id, name: existing.name },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({ success: true, message: 'API key revoked successfully' })
  } catch (err) {
    console.error('[api-keys/:id DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
