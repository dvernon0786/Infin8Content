// Epic 12: Story 12-8 — Announcements API
// GET: returns active, unread announcements for the current user
// Uses feature_announcements LEFT JOIN announcement_reads

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  // Fetch active announcements not yet read by this user
  const { data: announcements, error } = await supabase
    .from('feature_announcements')
    .select(`
      id, slug, title, body, cta_url, cta_label, target_plans, active_from, active_until,
      announcement_reads!left ( user_id )
    `)
    .lte('active_from', now)
    .or(`active_until.is.null,active_until.gt.${now}`)
    .order('active_from', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }

  // Filter out already-read ones
  const unread = (announcements ?? []).filter((a: any) => {
    const reads: any[] = a.announcement_reads ?? []
    return !reads.some((r: any) => r.user_id === currentUser.id)
  }).map(({ announcement_reads: _, ...a }: any) => a)

  return NextResponse.json({ announcements: unread })
}
