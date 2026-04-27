// Epic 12: Story 12-6 — Success Events API
// GET: returns completed success events for the current org
// POST: records a new success event

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import {
  getCompletedSuccessEvents,
  recordSuccessEvent,
  SUCCESS_EVENTS,
  type SuccessEventType,
} from '@/lib/services/onboarding/user-success-tracker'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const completed = await getCompletedSuccessEvents(currentUser.org_id)
  return NextResponse.json({ events: Array.from(completed) })
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { event?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validEvents = Object.values(SUCCESS_EVENTS) as string[]
  if (!body.event || !validEvents.includes(body.event)) {
    return NextResponse.json(
      { error: 'Invalid event', valid: validEvents },
      { status: 400 }
    )
  }

  await recordSuccessEvent(
    currentUser.org_id,
    currentUser.id,
    body.event as SuccessEventType
  )

  return NextResponse.json({ ok: true })
}
