/**
 * GET /api/cms-connections      — List all active connections for the org
 * POST /api/cms-connections     — Create a new CMS connection
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { encrypt } from '@/lib/security/encryption'
import { createCMSAdapter, CMS_PLATFORMS, CMS_SECRET_FIELDS } from '@/lib/services/publishing/cms-engine'
import { PLAN_LIMITS } from '@/lib/config/plan-limits'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { z, ZodError } from 'zod'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await (supabase
      .from('cms_connections')
      .select('id, org_id, platform, name, status, created_at, updated_at, credentials')
      .eq('org_id', currentUser.org_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }) as any)

    if (error) {
      return NextResponse.json({ error: 'Failed to load connections' }, { status: 500 })
    }

    // Mask secret fields — never return encrypted blobs to the client
    const masked = (data || []).map((conn: any) => {
      const secretFields = CMS_SECRET_FIELDS[conn.platform as CMSPlatform] || []
      const maskedCreds: Record<string, string> = {}
      for (const [k, v] of Object.entries(conn.credentials as Record<string, string>)) {
        maskedCreds[k] = secretFields.includes(k) ? '••••••••' : (v ?? '')
      }
      return { ...conn, credentials: maskedCreds }
    })

    return NextResponse.json({ connections: masked })
  } catch (err) {
    console.error('[cms-connections GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
const createSchema = z.object({
  platform: z.enum(CMS_PLATFORMS as [CMSPlatform, ...CMSPlatform[]]),
  name: z.string().min(1).max(100),
  credentials: z.record(z.string()),
})

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createSchema.parse(body)
    const { platform, name, credentials } = validated

    const supabase = await createClient()

    // Quota check
    const plan = (currentUser.organizations as any)?.plan || 'starter'
    const cmsLimit = PLAN_LIMITS.cms_connection[plan as keyof typeof PLAN_LIMITS.cms_connection]

    if (cmsLimit !== null) {
      const { count } = await (supabase
        .from('cms_connections')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', currentUser.org_id)
        .eq('status', 'active') as any)

      if ((count ?? 0) >= cmsLimit) {
        await logActionAsync({
          orgId: currentUser.org_id,
          userId: currentUser.id,
          action: 'quota.cms_connection.limit_hit' as any,
          details: { plan, currentValue: count, limit: cmsLimit, metric: 'cms_connection' },
          ipAddress: extractIpAddress(request.headers),
          userAgent: extractUserAgent(request.headers),
        })
        return NextResponse.json(
          { error: 'CMS connection limit reached', currentValue: count, limit: cmsLimit, plan, metric: 'cms_connection' },
          { status: 403 }
        )
      }
    }

    // Test connection before saving
    const secretFields = CMS_SECRET_FIELDS[platform]
    const decryptedCreds: Record<string, string> = { ...credentials }
    // At creation time, credentials arrive unencrypted from the client form
    const adapter = createCMSAdapter(platform, decryptedCreds)
    const testResult = await adapter.testConnection()

    if (!testResult.success) {
      return NextResponse.json(
        { error: 'Connection test failed', details: testResult.message },
        { status: 400 }
      )
    }

    // Encrypt secret fields before persisting
    const encryptedCreds: Record<string, string> = { ...credentials }
    for (const field of secretFields) {
      if (encryptedCreds[field]) {
        encryptedCreds[field] = encrypt(encryptedCreds[field])
      }
    }

    const { data: newConn, error: insertError } = await (supabase
      .from('cms_connections')
      .insert({
        org_id: currentUser.org_id,
        platform,
        name,
        credentials: encryptedCreds,
        status: 'active',
        created_by: currentUser.id,
      })
      .select('id, platform, name, status, created_at')
      .single() as any)

    if (insertError) {
      console.error('[cms-connections POST] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
    }

    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: AuditAction.INTEGRATION_CONNECTED,
      details: { platform, name, connection_id: newConn.id },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    return NextResponse.json({ success: true, connection: newConn }, { status: 201 })
  } catch (err: any) {
    if (err instanceof ZodError) {
      const first = err.issues[0]
      return NextResponse.json(
        { error: 'Invalid input', details: { field: first.path.join('.'), message: first.message } },
        { status: 400 }
      )
    }
    console.error('[cms-connections POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
