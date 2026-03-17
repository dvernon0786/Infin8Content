/**
 * GET    /api/cms-connections/[id]  — Get single connection (credentials masked)
 * PUT    /api/cms-connections/[id]  — Update name or credentials
 * DELETE /api/cms-connections/[id]  — Hard delete (cascades to publish_references.connection_id via SET NULL)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { encrypt } from '@/lib/security/encryption'
import { createCMSAdapter, CMS_SECRET_FIELDS } from '@/lib/services/publishing/cms-engine'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { z, ZodError } from 'zod'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getOwnedConnection(supabase: any, id: string, orgId: string) {
  return supabase
    .from('cms_connections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await (getOwnedConnection(supabase, id, currentUser.org_id) as any)

    if (error || !data) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const secretFields = CMS_SECRET_FIELDS[data.platform as CMSPlatform] || []
    const maskedCreds: Record<string, string> = {}
    for (const [k, v] of Object.entries(data.credentials as Record<string, string>)) {
      maskedCreds[k] = secretFields.includes(k) ? '••••••••' : (v ?? '')
    }

    return NextResponse.json({ connection: { ...data, credentials: maskedCreds } })
  } catch (err) {
    console.error('[cms-connections/:id GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credentials: z.record(z.string()).optional(),
})

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const supabase = await createClient()
    const { data: existing, error: fetchError } = await (getOwnedConnection(supabase, id, currentUser.org_id) as any)

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const platform = existing.platform as CMSPlatform
    const updates: Record<string, any> = {}

    if (validated.name !== undefined) {
      updates.name = validated.name
    }

    if (validated.credentials) {
      const secretFields = CMS_SECRET_FIELDS[platform]
      const newCreds = validated.credentials

      // Test with new credentials before saving
      const adapter = createCMSAdapter(platform, newCreds)
      const testResult = await adapter.testConnection()
      if (!testResult.success) {
        return NextResponse.json(
          { error: 'Connection test failed', details: testResult.message },
          { status: 400 }
        )
      }

      // Build merged+encrypted credentials
      const merged: Record<string, string> = { ...existing.credentials }
      for (const [k, v] of Object.entries(newCreds)) {
        if (secretFields.includes(k)) {
          merged[k] = encrypt(v)
        } else {
          merged[k] = v
        }
      }
      updates.credentials = merged
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await (supabase
      .from('cms_connections')
      .update(updates)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .select('id, platform, name, status, created_at, updated_at')
      .single() as any)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true, connection: updated })
  } catch (err: any) {
    if (err instanceof ZodError) {
      const first = err.issues[0]
      return NextResponse.json(
        { error: 'Invalid input', details: { field: first.path.join('.'), message: first.message } },
        { status: 400 }
      )
    }
    console.error('[cms-connections/:id PUT]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: existing, error: fetchError } = await (getOwnedConnection(supabase, id, currentUser.org_id) as any)

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const { error: deleteError } = await (supabase
      .from('cms_connections')
      .delete()
      .eq('id', id)
      .eq('org_id', currentUser.org_id) as any)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.INTEGRATION_DISCONNECTED,
      details: { platform: existing.platform, name: existing.name, connection_id: id },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[cms-connections/:id DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
