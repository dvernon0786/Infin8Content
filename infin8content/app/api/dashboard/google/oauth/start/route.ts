import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { buildAuthUrl, GoogleService } from '@/lib/services/google/oauth-client'

export async function GET(request: NextRequest) {
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

    const url = buildAuthUrl(service, currentUser.org_id)
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('[Google OAuth Start] Error:', err?.message)
    return NextResponse.json({ error: err?.message || 'Failed to start OAuth' }, { status: 500 })
  }
}
