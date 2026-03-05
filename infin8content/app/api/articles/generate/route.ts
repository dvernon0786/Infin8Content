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
        const org = currentUser.organizations as any
        const planType = (org?.plan_type || org?.plan || 'starter').toLowerCase()
        const planKey = planType as keyof typeof PLAN_LIMITS.article_generation;
        const articleLimit = PLAN_LIMITS.article_generation[planKey] ?? (() => {
            console.error(`[Quota] Unknown plan key: ${planKey}, defaulting to trial limit`)
            return PLAN_LIMITS.article_generation.trial
        })();

        if (articleLimit !== null) {
            let currentUsage = 0

            if (planType === 'trial') {
                // Trial users: Check if they have ever successfully completed an article
                const { count, error: countError } = await supabase
                    .from('articles')
                    .select('id', { count: 'exact', head: true })
                    .eq('org_id', currentUser.org_id)
                    .eq('status', 'completed')

                if (countError) {
                    console.error('[Quota Check] Trial count error:', countError)
                    return NextResponse.json({ error: 'Failed to verify trial limits' }, { status: 500 })
                }

                currentUsage = count ?? 0
            } else {
                // Paid users: Check current month's usage
                const startOfMonth = new Date()
                startOfMonth.setDate(1)
                startOfMonth.setHours(0, 0, 0, 0)

                const { count: usageCount, error: usageError } = await supabase
                    .from('articles')
                    .select('id', { count: 'exact', head: true })
                    .eq('org_id', currentUser.org_id)
                    .gte('created_at', startOfMonth.toISOString())
                    .in('status', ['queued', 'generating', 'completed', 'reviewing'])

                if (usageError) {
                    console.error('[Quota Check] Monthly usage count failed:', usageError)
                    return NextResponse.json({ error: 'Failed to verify monthly limits' }, { status: 500 })
                }
                currentUsage = usageCount ?? 0
            }

            if (currentUsage >= articleLimit) {
                // 📊 QUOTA TELEMETRY
                await logActionAsync({
                    orgId: currentUser.org_id,
                    userId: currentUser.id,
                    action: 'quota.article_generation.limit_hit' as any,
                    details: {
                        plan: planType,
                        currentUsage,
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
                    currentUsage,
                    plan: planType,
                    metric: 'article_generation',
                }, { status: 403 })
            }
        }

        // 4. Set status and trigger generation
        const { data: updatedRows, error: updateError } = await supabase
            .from('articles')
            .update({
                status: 'generating',
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

        return NextResponse.json({ success: true, status: 'generating' })

    } catch (error) {
        console.error('Unexpected error in POST /api/articles/generate:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
