// Epic 12: Story 12-9 — User Feedback API
// POST: inserts a row into user_feedback table

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'

const VALID_TYPES = ['nps', 'feature_request', 'bug_report', 'general'] as const
type FeedbackType = typeof VALID_TYPES[number]

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    feedback_type?: string
    nps_score?: number
    body?: string
    trigger_event?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.feedback_type || !VALID_TYPES.includes(body.feedback_type as FeedbackType)) {
    return NextResponse.json(
      { error: 'Invalid feedback_type', valid: VALID_TYPES },
      { status: 400 }
    )
  }

  if (body.feedback_type === 'nps') {
    if (body.nps_score === undefined || body.nps_score < 0 || body.nps_score > 10) {
      return NextResponse.json(
        { error: 'nps_score must be between 0 and 10' },
        { status: 400 }
      )
    }
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('user_feedback').insert({
    org_id: currentUser.org_id,
    user_id: currentUser.id,
    feedback_type: body.feedback_type as FeedbackType,
    nps_score: body.nps_score ?? null,
    body: body.body ?? null,
    trigger_event: body.trigger_event ?? null,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
