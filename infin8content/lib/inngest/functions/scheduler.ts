import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/config/plan-limits'
import { SYSTEM_USER_ID } from '@/lib/constants/system-user'

/**
 * Article Scheduler Worker
 * Runs every hour to pick up ONE scheduled article.
 * Enforces organizational quotas and avoids duplicate triggering.
 */
export const articleScheduler = inngest.createFunction(
    {
        id: 'article-scheduler',
        concurrency: { limit: 1 }
    },
    { cron: '0 * * * *' },
    async ({ step }) => {
        const supabase = createServiceRoleClient()

        // 1. Select the oldest eligible article
        // We pick ONE at a time to maintain deterministic concurrency and quota control
        const { data: articleData, error: fetchError } = await supabase
            .from('articles' as any)
            .select('id, org_id, keyword, intent_workflow_id, scheduled_at')
            .eq('status', 'queued')
            .lte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (fetchError) {
            console.error('[Scheduler] Error fetching eligible article:', fetchError)
            return { success: false, error: fetchError.message }
        }

        const article = (articleData as unknown) as {
            id: string;
            org_id: string;
            status: string;
            keyword: string;
            intent_workflow_id: string;
            scheduled_at: string
        } | null

        if (!article) {
            return { success: true, message: 'No articles eligible for scheduling.' }
        }

        // 2. Organization Quota Check
        // We must ensure the organization hasn't hit their monthly limit
        const orgQuotaResult = await step.run('check-quota', async () => {
            // Get organization plan
            const { data: orgData } = await supabase
                .from('organizations' as any)
                .select('plan, article_usage')
                .eq('id', article.org_id)
                .single()

            const org = orgData as unknown as { plan: string; article_usage: number } | null
            const plan = (org?.plan || 'starter').toLowerCase() as keyof typeof PLAN_LIMITS.article_generation
            const limit = PLAN_LIMITS.article_generation[plan]

            if (limit === null) return { allowed: true, usage: org?.article_usage ?? 0, limit: 0, plan }

            return {
                allowed: (org?.article_usage ?? 0) < limit,
                usage: org?.article_usage ?? 0,
                limit,
                plan
            }
        })

        if (!orgQuotaResult.allowed) {
            console.log(`[Scheduler] Org ${article.org_id} hit quota (${orgQuotaResult.usage}/${orgQuotaResult.limit}). Skipping article ${article.id}.`)
            return { success: true, message: 'Quota exhausted for organization.' }
        }

        // 3. Status Lock & Trigger
        // Use atomic update to prevent double-scheduling if cron races
        const transitionResult = await step.run('trigger-generation', async () => {
            const { data, error } = await supabase
                .from('articles' as any)
                .update({
                    status: 'processing',
                    updated_at: new Date().toISOString()
                })
                .eq('id', article.id)
                .eq('status', 'queued') // ATOMIC LOCK
                .select('id')

            if (error || !data || (data as any[]).length === 0) {
                return { success: false, reason: 'Already generating or status changed' }
            }

            if (orgQuotaResult.limit !== null) {
                const { data: quotaRows, error: quotaError } = await supabase
                    .rpc('increment_article_usage', {
                        target_org_id: article.org_id,
                        max_limit: orgQuotaResult.limit
                    })

                const quotaResult = quotaRows?.[0] as { success: boolean; new_usage: number } | undefined
                if (quotaError || !quotaResult?.success) {
                    // Revert status lock
                    await supabase.from('articles' as any)
                        .update({ status: 'queued' })
                        .eq('id', article.id)
                    return { success: false, reason: 'Quota exhausted at trigger time' }
                }
            }

            // Emit Generation Event
            await inngest.send({
                name: 'article/generate',
                data: {
                    articleId: article.id,
                    workflowId: article.intent_workflow_id,
                    organizationId: article.org_id
                }
            })

            // 📊 QUOTA TELEMETRY: Log audit event for tracking monthly usage
            // Use dummy values for IP/UA as this is a background system task
            const { logActionAsync } = await import('@/lib/services/audit-logger')
            const { AuditAction } = await import('@/types/audit')
            await logActionAsync({
                orgId: article.org_id,
                userId: SYSTEM_USER_ID,
                action: AuditAction.ARTICLE_GENERATION_STARTED,
                details: {
                    article_id: article.id,
                    keyword: article.keyword,
                    trigger: 'scheduler'
                }
            })

            return { success: true }
        })

        return {
            success: transitionResult.success,
            articleId: article.id,
            orgId: article.org_id
        }
    }
)
