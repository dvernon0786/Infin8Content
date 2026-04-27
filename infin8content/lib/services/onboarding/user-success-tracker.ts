// Epic 12: Story 12-6 — User Success Tracking
// Writes/reads the existing `activities` table to track onboarding milestones.
// No new table — extends the existing audit pattern.

import { createServiceRoleClient } from '@/lib/supabase/server'

export const SUCCESS_EVENTS = {
  FIRST_WORKFLOW_CREATED: 'FIRST_WORKFLOW_CREATED',
  FIRST_ARTICLE_GENERATED: 'FIRST_ARTICLE_GENERATED',
  FIRST_ARTICLE_PUBLISHED: 'FIRST_ARTICLE_PUBLISHED',
  CMS_CONNECTED: 'CMS_CONNECTED',
  KEYWORD_RESEARCH_DONE: 'KEYWORD_RESEARCH_DONE',
} as const

export type SuccessEventType = typeof SUCCESS_EVENTS[keyof typeof SUCCESS_EVENTS]

export async function recordSuccessEvent(
  orgId: string,
  userId: string,
  event: SuccessEventType
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Idempotent: only insert if not already recorded for this org
  const { data: existing } = await supabase
    .from('activities')
    .select('id')
    .eq('organization_id', orgId)
    .eq('activity_type', 'onboarding_success')
    .eq('activity_data->>event', event)
    .maybeSingle()

  if (existing) return // Already recorded — skip

  await supabase.from('activities').insert({
    organization_id: orgId,
    user_id: userId,
    activity_type: 'onboarding_success',
    activity_data: { event },
  })
}

export async function getCompletedSuccessEvents(
  orgId: string
): Promise<Set<SuccessEventType>> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('activities')
    .select('activity_data')
    .eq('organization_id', orgId)
    .eq('activity_type', 'onboarding_success')

  const events = new Set<SuccessEventType>()
  for (const row of data ?? []) {
    const event = (row.activity_data as any)?.event as SuccessEventType
    if (event) events.add(event)
  }
  return events
}
