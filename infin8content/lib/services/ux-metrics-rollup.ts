import { createServiceRoleClient } from '@/lib/supabase/server'

export interface UXMetricsWeeklyRollup {
  org_id: string
  week_start: string
  metrics: {
    article_creation_completion_rate: number | null
    review_flow_median_duration_minutes: number | null
    collaboration_adoption_rate: number | null
    avg_trust_score: number | null
    avg_collaboration_value_score: number | null
  }
}

/**
 * Compute review flow median completion time for a given org and week
 * - Start event: review_flow.STARTED
 * - End event: review_flow.COMPLETED
 * - Metric: median completion time in minutes across completed review flows
 */
export async function computeReviewFlowMedianDuration(orgId: string, weekStart: string): Promise<number | null> {
  const supabase = createServiceRoleClient()
  const weekStartDt = new Date(weekStart)
  const weekEnd = new Date(weekStartDt)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Get both STARTED and COMPLETED events in a single query for better performance
  const { data: allEvents, error: eventsError } = await (supabase
    .from('ux_metrics_events' as any)
    .select('event_name, flow_instance_id, created_at')
    .eq('org_id', orgId)
    .in('event_name', ['review_flow.STARTED', 'review_flow.COMPLETED'])
    .gte('created_at', weekStartDt.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: true }) as unknown as Promise<{
      data: Array<{ event_name: string; flow_instance_id: string; created_at: string }> | null
      error: any
    }>)

  if (eventsError || !allEvents || allEvents.length === 0) {
    return null
  }

  // Separate events by type
  const startedEvents = allEvents.filter(e => e.event_name === 'review_flow.STARTED')
  const completedEvents = allEvents.filter(e => e.event_name === 'review_flow.COMPLETED')

  if (startedEvents.length === 0) {
    return null
  }

  // Create lookup map for completed events
  const completedMap = new Map(
    completedEvents.map(e => [e.flow_instance_id, new Date(e.created_at)])
  )

  const durations: number[] = []
  for (const started of startedEvents) {
    const completedAt = completedMap.get(started.flow_instance_id)
    if (completedAt) {
      const startedAt = new Date(started.created_at)
      const durationMinutes = (completedAt.getTime() - startedAt.getTime()) / (1000 * 60)
      durations.push(durationMinutes)
    }
  }

  if (durations.length === 0) {
    return null
  }

  // Calculate median
  durations.sort((a, b) => a - b)
  const mid = Math.floor(durations.length / 2)
  const median = durations.length % 2 === 0 
    ? (durations[mid - 1] + durations[mid]) / 2 
    : durations[mid]

  return median
}

/**
 * Compute article creation completion rate for a given org and week
 * - Numerator: flows that reached COMPLETED within 24h of STARTED
 * - Denominator: flows that reached STARTED
 */
export async function computeArticleCreationCompletionRate(orgId: string, weekStart: string): Promise<number | null> {
  const supabase = createServiceRoleClient()
  const weekStartDt = new Date(weekStart)
  const weekEnd = new Date(weekStartDt)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Get both STARTED and COMPLETED events in a single query for better performance
  const { data: allEvents, error: eventsError } = await (supabase
    .from('ux_metrics_events' as any)
    .select('event_name, flow_instance_id, created_at')
    .eq('org_id', orgId)
    .in('event_name', ['article_create_flow.STARTED', 'article_create_flow.COMPLETED'])
    .gte('created_at', weekStartDt.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: true }) as unknown as Promise<{
      data: Array<{ event_name: string; flow_instance_id: string; created_at: string }> | null
      error: any
    }>)

  if (eventsError || !allEvents || allEvents.length === 0) {
    return null
  }

  // Separate events by type
  const startedEvents = allEvents.filter(e => e.event_name === 'article_create_flow.STARTED')
  const completedEvents = allEvents.filter(e => e.event_name === 'article_create_flow.COMPLETED')

  if (startedEvents.length === 0) {
    return null
  }

  // Create lookup map for completed events
  const completedMap = new Map(
    completedEvents.map(e => [e.flow_instance_id, new Date(e.created_at)])
  )

  let completedWithin24h = 0
  for (const started of startedEvents) {
    const completedAt = completedMap.get(started.flow_instance_id)
    if (completedAt) {
      const startedAt = new Date(started.created_at)
      const diffHours = (completedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
      if (diffHours <= 24) {
        completedWithin24h += 1
      }
    }
  }

  return completedWithin24h / startedEvents.length
}

/**
 * Compute collaboration adoption rate for a given org and week
 * - Adopted: at least one collaboration interaction during the week
 * - Active: at least one session or article action during the week
 */
export async function computeCollaborationAdoptionRate(orgId: string, weekStart: string): Promise<number | null> {
  const supabase = createServiceRoleClient()
  const weekStartDt = new Date(weekStart)
  const weekEnd = new Date(weekStartDt)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Check for any collaboration interaction in the week
  const { data: collaborationEvents, error: collabError } = await (supabase
    .from('ux_metrics_events' as any)
    .select('event_name')
    .eq('org_id', orgId)
    .in('event_name', [
      'collaboration_interaction.COMMENT_CREATED',
      'collaboration_interaction.MENTION_CREATED', 
      'collaboration_interaction.INVITE_ACCEPTED'
    ])
    .gte('created_at', weekStartDt.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .limit(1) as unknown as Promise<{ data: any[] | null; error: any }>)

  if (collabError) {
    console.error('[UX Metrics] Error fetching collaboration events:', collabError)
    return null
  }

  const adopted = (collaborationEvents && collaborationEvents.length > 0)

  // Simple proxy for "active org week": any article creation event in the week
  const { data: articleEvents, error: articleError } = await (supabase
    .from('ux_metrics_events' as any)
    .select('event_name')
    .eq('org_id', orgId)
    .in('event_name', ['article_create_flow.STARTED', 'article_create_flow.COMPLETED'])
    .gte('created_at', weekStartDt.toISOString())
    .lt('created_at', weekEnd.toISOString())
    .limit(1) as unknown as Promise<{ data: any[] | null; error: any }>)

  if (articleError) {
    console.error('[UX Metrics] Error fetching article events:', articleError)
    return null
  }

  const active = (articleEvents && articleEvents.length > 0)

  if (!active) {
    return null // No active orgs in this week, so adoption rate is undefined
  }

  return adopted ? 1 : 0
}

/**
 * Compute average rating score for a given org and week
 */
export async function computeAverageRating(
  orgId: string,
  weekStart: string,
  eventName: 'rating.TRUST_AI' | 'rating.COLLAB_VALUE'
): Promise<number | null> {
  const supabase = createServiceRoleClient()
  const weekStartDt = new Date(weekStart)
  const weekEnd = new Date(weekStartDt)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data: ratingEvents, error: ratingError } = await (supabase
    .from('ux_metrics_events' as any)
    .select('payload')
    .eq('org_id', orgId)
    .eq('event_name', eventName)
    .gte('created_at', weekStartDt.toISOString())
    .lt('created_at', weekEnd.toISOString()) as unknown as Promise<{
      data: Array<{ payload: { score?: number } }> | null
      error: any
    }>)

  if (ratingError || !ratingEvents || ratingEvents.length === 0) {
    return null
  }

  const scores = ratingEvents
    .map(e => e.payload?.score)
    .filter((s): s is number => typeof s === 'number' && s >= 1 && s <= 5)

  if (scores.length === 0) {
    return null
  }

  return scores.reduce((a, b) => a + b, 0) / scores.length
}

/**
 * Compute all UX metrics for a given org and week
 */
export async function computeUXMetricsRollup(orgId: string, weekStart: string): Promise<UXMetricsWeeklyRollup['metrics']> {
  const [
    completionRate,
    reviewDuration,
    adoptionRate,
    avgTrustScore,
    avgCollabValueScore,
  ] = await Promise.all([
    computeArticleCreationCompletionRate(orgId, weekStart),
    computeReviewFlowMedianDuration(orgId, weekStart),
    computeCollaborationAdoptionRate(orgId, weekStart),
    computeAverageRating(orgId, weekStart, 'rating.TRUST_AI'),
    computeAverageRating(orgId, weekStart, 'rating.COLLAB_VALUE'),
  ])

  return {
    article_creation_completion_rate: completionRate,
    review_flow_median_duration_minutes: reviewDuration,
    collaboration_adoption_rate: adoptionRate,
    avg_trust_score: avgTrustScore,
    avg_collaboration_value_score: avgCollabValueScore,
  }
}
