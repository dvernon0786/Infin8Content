import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { disconnectGoogleService } from '@/lib/services/google/credential-manager'
import type { GoogleService } from '@/lib/services/google/oauth-client'

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const service = searchParams.get('service') as GoogleService | null

  try {
    if (!service || !['analytics', 'search_console'].includes(service)) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await disconnectGoogleService(currentUser.org_id, service)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Google Disconnect] Error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to disconnect' }, { status: 500 })
  }
}
