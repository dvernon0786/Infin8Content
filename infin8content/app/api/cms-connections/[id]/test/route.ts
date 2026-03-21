/**
 * POST /api/cms-connections/[id]/test
 * Tests a saved CMS connection by decrypting credentials and calling adapter.testConnection()
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { decrypt } from '@/lib/security/encryption'
import { createCMSAdapter, CMS_SECRET_FIELDS } from '@/lib/services/publishing/cms-engine'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: connection, error } = await (supabase
      .from('cms_connections')
      .select('*')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single() as any)

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const platform = connection.platform as CMSPlatform
    const rawCreds = connection.credentials as Record<string, string>
    const secretFields = CMS_SECRET_FIELDS[platform] || []

    const credentials: Record<string, string> = { ...rawCreds }
    for (const field of secretFields) {
      if (credentials[field] && credentials[field] !== '••••••••') {
        try {
          credentials[field] = decrypt(credentials[field])
        } catch {
          return NextResponse.json(
            { success: false, message: 'Failed to decrypt credentials — please re-save the connection.' },
            { status: 200 }
          )
        }
      }
    }

    const adapter = createCMSAdapter(platform, credentials)
    const testResult = await adapter.testConnection()

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Connection verified' : (testResult.message ?? 'Connection test failed'),
    })
  } catch (err) {
    console.error('[cms-connections/:id/test POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
