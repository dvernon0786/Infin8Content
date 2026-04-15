/**
 * POST /api/webhook-endpoints/[id]/test
 * Epic 11, Story 11.4 — Send a test webhook delivery to verify endpoint config.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { sendTestDelivery } from '@/lib/services/webhooks/webhook-dispatcher'

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

    const result = await sendTestDelivery(id, currentUser.org_id)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'Test delivery failed',
          http_status: result.status,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, http_status: result.status })
  } catch (err) {
    console.error('[webhook-endpoints/:id/test POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
