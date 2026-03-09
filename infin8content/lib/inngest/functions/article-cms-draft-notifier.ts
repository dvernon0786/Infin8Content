/**
 * Article CMS Draft Notifier
 *
 * Runs every hour. Finds articles that:
 *   - have status = 'completed'
 *   - have cms_status = 'none'   (generation done, not yet marked as draft)
 *   - have draft_notified_at IS NULL
 *
 * For each: sets cms_status = 'draft', records draft_notified_at, sends email.
 *
 * Deliberately decoupled from generate-article.ts — no changes to the
 * generation worker are needed.
 *
 * File: lib/inngest/functions/article-cms-draft-notifier.ts
 * Register this function in lib/inngest/client.ts alongside the other workers.
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendArticleDraftReadyEmail } from '@/lib/services/content-notifications'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'

const BATCH_SIZE = 20  // max articles processed per run

export const articleCmsDraftNotifier = inngest.createFunction(
    {
        id: 'article-cms-draft-notifier',
        concurrency: { limit: 1 },
    },
    { cron: '0 * * * *' },  // every hour
    async ({ step, logger }) => {
        const supabase = createServiceRoleClient()

        // ── 1. Find completed articles not yet marked as CMS draft ──────────────
        const pendingArticles = await step.run('fetch-pending-draft-articles', async () => {
            const { data, error } = await (supabase as any)
                .from('articles')
                .select('id, title, org_id, publish_at, intent_workflow_id')
                .eq('status', 'completed')
                .eq('cms_status', 'none')
                .is('draft_notified_at', null)
                .order('updated_at', { ascending: true })
                .limit(BATCH_SIZE)

            if (error) {
                logger?.error('[DraftNotifier] Failed to fetch pending articles', { error })
                throw error
            }

            return (data ?? []) as Array<{
                id: string
                title: string
                org_id: string
                publish_at: string | null
                intent_workflow_id: string | null
            }>
        })

        if (pendingArticles.length === 0) {
            return { success: true, message: 'No articles pending CMS draft notification.' }
        }

        logger?.info(`[DraftNotifier] Processing ${pendingArticles.length} articles`)

        const results = { notified: 0, failed: 0 }

        // ── 2. Process each article ──────────────────────────────────────────────
        for (const article of pendingArticles) {
            await step.run(`notify-draft-${article.id}`, async () => {
                // a) Atomic update — only proceed if still in the expected state
                const { data: updated, error: updateError } = await (supabase as any)
                    .from('articles')
                    .update({
                        cms_status: 'draft',
                        draft_notified_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', article.id)
                    .eq('status', 'completed')
                    .eq('cms_status', 'none')
                    .is('draft_notified_at', null)
                    .select('id')

                if (updateError || !updated || (updated as any[]).length === 0) {
                    // Another process already handled this article — skip silently
                    return
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
                    logger?.warn('[DraftNotifier] Owner email not found', { orgId: article.org_id })
                    results.failed++
                    return
                }

                // c) Send draft-ready email (non-blocking on email failure)
                try {
                    await sendArticleDraftReadyEmail({
                        to: owner.email,
                        userName: owner.first_name ?? undefined,
                        articleTitle: article.title,
                        articleId: article.id,
                        publishAt: article.publish_at ?? undefined,
                    })
                    results.notified++
                } catch (emailError) {
                    logger?.error('[DraftNotifier] Email failed (non-blocking)', {
                        articleId: article.id,
                        error: emailError,
                    })
                    results.failed++
                }

                // d) Audit log
                const { logActionAsync } = await import('@/lib/services/audit-logger')
                const { AuditAction } = await import('@/types/audit')
                await logActionAsync({
                    orgId: article.org_id,
                    userId: SYSTEM_USER_ID,
                    action: AuditAction.ARTICLE_DRAFT_NOTIFIED,
                    details: {
                        article_id: article.id,
                        title: article.title,
                        publish_at: article.publish_at,
                    },
                })
            })
        }

        return {
            success: true,
            processed: pendingArticles.length,
            notified: results.notified,
            failed: results.failed,
        }
    }
)
