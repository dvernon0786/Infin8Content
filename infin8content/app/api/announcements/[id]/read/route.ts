// Epic 12: Story 12-8 — Mark announcement as read
// POST: inserts a row into announcement_reads (idempotent via unique constraint)

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // onConflict: 'ignore' handles the unique(user_id, announcement_id) constraint gracefully
  await supabase.from('announcement_reads').upsert(
    { user_id: currentUser.id, announcement_id: params.id },
    { onConflict: 'user_id,announcement_id', ignoreDuplicates: true }
  )

  return NextResponse.json({ ok: true })
}
