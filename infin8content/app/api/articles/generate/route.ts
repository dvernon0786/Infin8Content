import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { PLAN_LIMITS } from '@/lib/config/plan-limits'
import { inngest } from '@/lib/inngest/client'
import { NextResponse } from 'next/server'

/**
 * POST /api/articles/generate
 * 
 * Manually triggers article generation for a specific article.
 * Enforces organizational isolation and plan-based quotas.
 */
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.org_id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const body = await request.json()
        const { articleId } = body

        if (!articleId) {
            return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Fetch article and verify ownership
        const { data: articleData, error: fetchError } = await supabase
            .from('articles')
            .select('id, org_id, status, keyword, intent_workflow_id')
            .eq('id', articleId)
            .eq('org_id', currentUser.org_id)
            .single()

        if (fetchError || !articleData) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        const article = (articleData as unknown) as {
            id: string;
            org_id: string;
            status: string;
            keyword: string;
            intent_workflow_id: string;
        }

        // 2. Validate current status
        if (article.status !== 'queued' && article.status !== 'failed') {
            return NextResponse.json({
                error: `Article is currently in ${article.status} state. Only queued or failed articles can be generated.`
            }, { status: 400 })
        }

        // 3. Quota Enforcement
        // Read plan strictly from org.plan (no plan_type fallback - plan is the canonical field written by webhooks)
        const orgData = currentUser.organizations as any
        const planType = (orgData?.plan || 'starter').toLowerCase()

        // 🔒 PLAN VALIDATION: Prevent quota bypass via undefined/legacy plan strings
        if (!(planType in PLAN_LIMITS.article_generation)) {
            console.error(`[Quota Check] Invalid plan detected: ${planType}`)
            return NextResponse.json({ error: 'Invalid organization plan configuration' }, { status: 403 })
        }

        const planKey = planType as keyof typeof PLAN_LIMITS.article_generation;
        const articleLimit = PLAN_LIMITS.article_generation[planKey];

        // 4. Set status to processing (Atomic Lock)
        // This update will only succeed if the article is still in a triggerable state.
        const { data: updatedRows, error: updateError } = await supabase
            .from('articles')
            .update({
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', articleId)
            .eq('org_id', currentUser.org_id)
            .in('status', ['queued', 'failed'])
            .select('id')

        if (updateError || !updatedRows || (updatedRows as any[]).length === 0) {
            if (updateError) console.error('[Status Update] Failed:', updateError)
            return NextResponse.json({
                error: updateError ? 'Failed to update article status' : 'Article was already triggered or not found.'
            }, { status: updateError ? 500 : 409 })
        }

        // 5. Quota Enforcement (Atomic)
        // 🔒 NB_QUOTA_LEAK FIX: Only increment quota AFTER status lock succeeds to prevent phantom leakage on 409 collisions.
        if (articleLimit !== null) {
            const { data: quotaRows, error: quotaError } = await supabase
                .rpc('increment_article_usage', {
                    target_org_id: currentUser.org_id,
                    max_limit: articleLimit
                })

            const quotaResult = quotaRows?.[0] as { success: boolean; new_usage: number } | undefined
            if (quotaError || !quotaResult?.success) {
                // REVERT status lock if quota check fails
                await supabase.from('articles')
                    .update({ status: article.status })
                    .eq('id', articleId)
                    .eq('org_id', currentUser.org_id) // 🔒 NB_REVERT_ORGID FIX: Consistent org guard

                const errorMsg = planType === 'trial'
                    ? "Trial users can only generate one article. Please upgrade."
                    : "Monthly article limit reached. Please upgrade your plan."
                return NextResponse.json({ error: errorMsg }, { status: 403 })
            }
        }

        // 6. Emit Inngest Event (Idempotent Job Submission with Failure Revert)
        // 🚨 QUEUE FAILURE FIX: Revert status to original if Inngest fails to prevent stuck states
        try {
            await inngest.send({
                name: 'article/generate',
                id: `article-gen-${articleId}`,
                data: {
                    articleId,
                    workflowId: article.intent_workflow_id,
                    organizationId: article.org_id
                }
            })
        } catch (queueError) {
            console.error('[Queue Failure] Reverting status:', queueError)

            // 🔒 NB_QUOTA_LEAK FIX: Best-effort usage decrement on queue failure
            const orgData = currentUser.organizations as any
            if (articleLimit !== null && orgData?.article_usage > 0) {
                await supabase.from('organizations')
                    .update({ article_usage: orgData.article_usage - 1 })
                    .eq('id', currentUser.org_id)
            }

            const { error: revertError } = await supabase
                .from('articles')
                .update({ status: article.status })
                .eq('id', articleId)
                .eq('org_id', currentUser.org_id)

            if (revertError) {
                console.error('[Queue Failure] Revert FAILED — article may be stuck in processing:', { articleId, revertError })
            }

            return NextResponse.json({ error: 'Failed to queue generation job' }, { status: 500 })
        }

        // 6. Log Audit
        await logActionAsync({
            orgId: currentUser.org_id,
            userId: currentUser.id,
            action: AuditAction.ARTICLE_GENERATION_STARTED,
            details: {
                article_id: article.id,
                keyword: article.keyword,
                trigger: 'manual'
            },
            ipAddress: extractIpAddress(request.headers),
            userAgent: extractUserAgent(request.headers),
        })

        return NextResponse.json({ success: true, status: 'processing' })

    } catch (error) {
        console.error('Unexpected error in POST /api/articles/generate:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
