/**
 * Publish Reminder Scheduler
 *
 * Runs daily at 09:00 UTC. Finds articles where:
 *   - cms_status = 'draft'
 *   - publish_at <= now()
 *   - publish_reminded_at IS NULL  (one reminder per article, ever)
 *
 * For each: sends publish-reminder email, stamps publish_reminded_at.
 *
 * File: lib/inngest/functions/publish-reminder-scheduler.ts
 * Register alongside other Inngest workers in lib/inngest/client.ts.
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendPublishReminderEmail } from '@/lib/services/content-notifications'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'

const BATCH_SIZE = 50

export const publishReminderScheduler = inngest.createFunction(
    {
        id: 'publish-reminder-scheduler',
        concurrency: { limit: 1 },
    },
    { cron: '0 9 * * *' },  // 09:00 UTC daily
    async ({ step, logger }) => {
        const supabase = createServiceRoleClient()

        // ── 1. Fetch articles due for publish reminder ───────────────────────────
        const dueArticles = await step.run('fetch-due-publish-reminders', async () => {
            const now = new Date().toISOString()

            const { data, error } = await (supabase as any)
                .from('articles')
                .select('id, title, org_id, publish_at')
                .eq('cms_status', 'draft')
                .is('publish_reminded_at', null)
                .lte('publish_at', now)
                .not('publish_at', 'is', null)
                .order('publish_at', { ascending: true })
                .limit(BATCH_SIZE)

            if (error) {
                logger?.error('[PublishReminder] Failed to fetch due articles', { error })
                throw error
            }

            return (data ?? []) as Array<{
                id: string
                title: string
                org_id: string
                publish_at: string
            }>
        })

        if (dueArticles.length === 0) {
            return { success: true, message: 'No publish reminders due.' }
        }

        logger?.info(`[PublishReminder] Sending ${dueArticles.length} reminders`)

        // ── 2. Process each article ──────────────────────────────────────────────
        const processingResults = []
        for (const article of dueArticles) {
            const res = await step.run(`remind-publish-${article.id}`, async () => {
                // a) Atomic stamp — prevent double-send on retry
                const { data: stamped, error: stampError } = await (supabase as any)
                    .from('articles')
                    .update({
                        publish_reminded_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', article.id)
                    .eq('cms_status', 'draft')
                    .is('publish_reminded_at', null)
                    .select('id')

                if (stampError || !stamped || (stamped as any[]).length === 0) {
                    // Already reminded — skip
                    return { success: false, skipped: true }
                }

                // b) Get org owner email
                const { data: ownerRows } = await supabase
                    .from('users' as any)
                    .select('email, first_name')
                    .eq('org_id', article.org_id)
                    .eq('role', 'owner')
                    .limit(1)

                const owner = (ownerRows as any[])?.[0]

                if (!owner?.email) {
                    logger?.warn('[PublishReminder] Owner not found', { orgId: article.org_id })
                    return { success: false, error: 'owner_not_found' }
                }

                // c) Send reminder (non-blocking on failure)
                let sent = false
                try {
                    await sendPublishReminderEmail({
                        to: owner.email,
                        userName: owner.first_name ?? undefined,
                        articleTitle: article.title,
                        articleId: article.id,
                        publishAt: article.publish_at,
                    })
                    sent = true
                } catch (emailError) {
                    logger?.error('[PublishReminder] Email failed (non-blocking)', {
                        articleId: article.id,
                        error: emailError,
                    })
                }

                // d) Audit log
                const { logActionAsync } = await import('@/lib/services/audit-logger')
                const { AuditAction } = await import('@/types/audit')
                await logActionAsync({
                    orgId: article.org_id,
                    userId: SYSTEM_USER_ID,
                    action: AuditAction.ARTICLE_PUBLISH_REMINDED,
                    details: {
                        article_id: article.id,
                        title: article.title,
                        publish_at: article.publish_at,
                    },
                })

                return { success: true, sent }
            })
            if (res) processingResults.push(res)
        }

        const stats = (processingResults as any[]).reduce(
            (acc, r) => {
                if (r.sent) acc.sent++
                if (r.success && !r.sent && !r.skipped) acc.failed++
                if (r.error === 'owner_not_found') acc.failed++
                return acc
            },
            { sent: 0, failed: 0 }
        )

        return {
            success: true,
            processed: dueArticles.length,
            sent: stats.sent,
            failed: stats.failed,
        }
    }
)
