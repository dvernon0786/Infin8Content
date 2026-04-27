// Epic 12: Story 12-1 — Tour shown API
// PATCH: marks the guided tour as shown for the current org

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH() {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('organizations')
    .update({ onboarding_tour_shown: true })
    .eq('id', currentUser.org_id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update tour state' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
