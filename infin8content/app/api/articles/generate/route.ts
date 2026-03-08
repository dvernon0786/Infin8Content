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

        // 3. Quota Enforcement (Atomic & Billing-Cycle Aware)
        const orgData = currentUser.organizations as any
        const planType = (orgData?.plan || 'trial').toLowerCase()
        const planKey = planType as keyof typeof PLAN_LIMITS.article_generation;
        const articleLimit = PLAN_LIMITS.article_generation[planKey];

        if (articleLimit !== null) {
            const now = new Date()
            const resetDate = orgData.usage_reset_at ? new Date(orgData.usage_reset_at) : null
            let isNewCycle = resetDate && now > resetDate

            const updateData: any = {
                article_usage: isNewCycle ? 1 : orgData.article_usage + 1
            }
            if (isNewCycle && resetDate) {
                const nextReset = new Date(resetDate)
                nextReset.setMonth(nextReset.getMonth() + 1)
                updateData.usage_reset_at = nextReset.toISOString()
            }

            const query = supabase
                .from('organizations')
                .update(updateData)
                .eq('id', currentUser.org_id)

            // CRITICAL: Condition for atomic enforcement
            if (!isNewCycle) {
                query.lt('article_usage', articleLimit)
            }

            const { data: orgUpdate, error: orgUpdateError } = await query.select('article_usage').single()

            if (orgUpdateError || !orgUpdate) {
                // If the update failed or returned nothing, it's either an error or the limit was hit
                if (orgUpdateError?.code === 'PGRST116' || (!orgUpdate && !orgUpdateError)) {
                    // 📊 QUOTA TELEMETRY
                    await logActionAsync({
                        orgId: currentUser.org_id,
                        userId: currentUser.id,
                        action: 'quota.article_generation.limit_hit' as any,
                        details: {
                            plan: planType,
                            currentUsage: orgData.article_usage,
                            limit: articleLimit,
                            metric: 'article_generation',
                        },
                        ipAddress: extractIpAddress(request.headers),
                        userAgent: extractUserAgent(request.headers),
                    })

                    const errorMsg = planType === 'trial'
                        ? "Trial users can only generate one article. Please upgrade."
                        : "Monthly article limit reached. Please upgrade your plan."

                    return NextResponse.json({
                        error: errorMsg,
                        limit: articleLimit,
                        currentUsage: orgData.article_usage,
                        plan: planType,
                        metric: 'article_generation',
                    }, { status: 403 })
                }

                console.error('[Quota Check] Atomic update failed:', orgUpdateError)
                return NextResponse.json({ error: 'Failed to verify usage limits' }, { status: 500 })
            }
        }

        // 4. Set status and trigger generation
        const { data: updatedRows, error: updateError } = await supabase
            .from('articles')
            .update({
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', articleId)
            .eq('org_id', currentUser.org_id)
            .in('status', ['queued', 'failed']) // ATOMIC LOCK Verification (Supports Retries)
            .select('id')

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update article status' }, { status: 500 })
        }

        if (!updatedRows || (updatedRows as any[]).length === 0) {
            return NextResponse.json({
                error: 'Article was already triggered by another process.'
            }, { status: 409 })
        }

        // 5. Emit Inngest Event
        await inngest.send({
            name: 'article/generate',
            data: {
                articleId,
                workflowId: article.intent_workflow_id,
                organizationId: article.org_id
            }
        })

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
