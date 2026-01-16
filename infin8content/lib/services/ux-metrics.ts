import { createServiceRoleClient } from '@/lib/supabase/server'

export type UXMetricsEventName =
  | 'article_create_flow.STARTED'
  | 'article_create_flow.COMPLETED'
  | 'review_flow.STARTED'
  | 'review_flow.COMPLETED'
  | 'collaboration_interaction.COMMENT_CREATED'
  | 'collaboration_interaction.MENTION_CREATED'
  | 'collaboration_interaction.INVITE_ACCEPTED'
  | 'rating.TRUST_AI'
  | 'rating.COLLAB_VALUE'

export interface UXMetricsEventInput {
  orgId: string
  userId?: string | null
  eventName: UXMetricsEventName
  flowInstanceId?: string | null
  articleId?: string | null
  payload?: Record<string, unknown> | null
  createdAt?: string | null
}

export async function emitUXMetricsEvent(input: UXMetricsEventInput): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error } = await (supabase
    .from('ux_metrics_events' as any)
    .insert({
      org_id: input.orgId,
      user_id: input.userId ?? null,
      event_name: input.eventName,
      flow_instance_id: input.flowInstanceId ?? null,
      article_id: input.articleId ?? null,
      payload: input.payload ?? {},
      created_at: input.createdAt ?? new Date().toISOString(),
    }) as unknown as Promise<{ error: any }>)

  if (error) {
    // Log detailed error for debugging
    console.error('[UX Metrics] Failed to emit event:', {
      event_name: input.eventName,
      org_id: input.orgId,
      user_id: input.userId,
      flow_instance_id: input.flowInstanceId,
      article_id: input.articleId,
      error: error?.message || error,
      code: error?.code,
      details: error?.details,
    })

    // Re-throw for critical errors that should fail fast
    if (error?.code === '23505') {
      // Unique constraint violation - expected for idempotency, don't fail
      console.warn('[UX Metrics] Duplicate event ignored (idempotency):', {
        event_name: input.eventName,
        flow_instance_id: input.flowInstanceId,
      })
      return
    }

    // For other errors, we still log but don't fail the main operation
    // In production, you might want to use a dead letter queue or retry mechanism
    throw new Error(`Failed to emit UX metrics event: ${error?.message || 'Unknown error'}`)
  }
}
