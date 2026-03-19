/**
 * POST /api/articles/[id]/schedule
 *
 * Schedules a draft article for background generation on a future date.
 * Also accepts an optional publish_at date for the publish-reminder email.
 *
 * Gates:
 *   - Must be authenticated
 *   - Article must belong to user's org
 *   - Plan gate: trial → 403 PLAN_GATE
 *   - Quota gate: scheduled count this month vs plan limit
 *   - Article must be in 'draft' status
 *   - scheduled_at must not be more than 1 hour in the past (allows small clock skew)
 *
 * File: app/api/articles/[id]/schedule/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { PLAN_LIMITS, type PlanType } from '@/lib/config/plan-limits'
import type { ScheduleArticleRequest, ScheduleArticleErrorResponse } from '@/types/article'

function err(code: ScheduleArticleErrorResponse['code'], message: string, status: number) {
    return NextResponse.json<ScheduleArticleErrorResponse>(
        { success: false, error: message, code },
        { status }
    )
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // ── Auth ────────────────────────────────────────────────────────────────────
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
        return err('UNAUTHORIZED', 'Authentication required.', 401)
    }

    const { id: articleId } = await params
    if (!articleId) {
        return err('NOT_FOUND', 'Article ID is required.', 400)
    }

    // ── Parse body ──────────────────────────────────────────────────────────────
    let body: ScheduleArticleRequest
    try {
        body = await request.json()
    } catch {
        return err('INVALID_DATE', 'Invalid request body.', 400)
    }

    const { scheduled_at, publish_at } = body

    if (!scheduled_at) {
        return err('INVALID_DATE', 'scheduled_at is required.', 400)
    }

    // scheduled_at must not be more than 1 hour in the past (1-hour skew buffer for clock drift / timezone edge cases)
    const scheduledDate = new Date(scheduled_at)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= oneHourAgo) {
        return err('INVALID_DATE', 'scheduled_at must be a valid date that is not more than 1 hour in the past.', 400)
    }

    // publish_at (if provided) must be >= scheduled_at
    if (publish_at) {
        const publishDate = new Date(publish_at)
        if (isNaN(publishDate.getTime()) || publishDate < scheduledDate) {
            return err('INVALID_DATE', 'publish_at must be on or after scheduled_at.', 400)
        }
    }

    const supabase = createServiceRoleClient()

    // ── Fetch org plan ──────────────────────────────────────────────────────────
    const { data: orgData, error: orgError } = await (supabase as any)
        .from('organizations')
        .select('id, plan, payment_status, article_usage')
        .eq('id', currentUser.org_id)
        .single()

    if (orgError || !orgData) {
        return err('DATABASE_ERROR', 'Failed to fetch organization.', 500)
    }

    const plan = ((orgData as any).plan || 'trial').toLowerCase() as PlanType
    const paymentStatus = (orgData as any).payment_status

    // Normalize/validate plan before indexing PLAN_LIMITS to avoid unexpected keys
    const normalizedPlan: PlanType = (Object.keys(PLAN_LIMITS.article_generation) as unknown as PlanType[]).includes(plan)
        ? plan
        : 'trial'
    // ── Gating: Payment Status ──────────────────────────────────────────────────
    if (paymentStatus === 'suspended' || paymentStatus === 'past_due') {
        return err(
            'FORBIDDEN',
            'Account access is restricted. Please update your billing to schedule articles.',
            403
        )
    }

    // ── Server-side hard quota: article_generation / article_usage
    const generationLimit = PLAN_LIMITS.article_generation[normalizedPlan]
    const orgArticleUsage = (orgData as any).article_usage ?? 0
    if (generationLimit !== null && orgArticleUsage >= generationLimit) {
        return err(
            'QUOTA_EXCEEDED',
            `You have reached your monthly generation limit of ${generationLimit} articles.`,
            403
        )
    }

    // ── Plan gate: trial cannot schedule ────────────────────────────────────────
    const scheduleLimit = PLAN_LIMITS.schedule_per_month[normalizedPlan]

    if (scheduleLimit === 0) {
        return err(
            'PLAN_GATE',
            'Scheduling is not available on the Trial plan. Upgrade to Starter or higher.',
            403
        )
    }

    // ── Quota check ─────────────────────────────────────────────────────────────
    if (scheduleLimit !== null) {
        const startOfMonth = new Date()
        startOfMonth.setUTCDate(1)
        startOfMonth.setUTCHours(0, 0, 0, 0)

        const { count, error: countError } = await (supabase as any)
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', currentUser.org_id)
            .in('status', ['queued', 'processing', 'completed'])
            .gte('scheduled_at', startOfMonth.toISOString())

        if (countError) {
            return err('DATABASE_ERROR', 'Failed to check scheduling quota.', 500)
        }

        if ((count ?? 0) >= scheduleLimit) {
            return err(
                'QUOTA_EXCEEDED',
                `You have reached your monthly scheduling limit of ${scheduleLimit} articles. Your quota resets on the 1st of next month.`,
                429
            )
        }
    }

    // ── Fetch article and verify ownership ──────────────────────────────────────
    const { data: articleData, error: articleError } = await (supabase as any)
        .from('articles')
        .select('id, org_id, status, title')
        .eq('id', articleId)
        .eq('org_id', currentUser.org_id)
        .single()

    if (articleError || !articleData) {
        return err('NOT_FOUND', 'Article not found.', 404)
    }

    const article = articleData as { id: string; org_id: string; status: string; title: string }

    // ── Status gate: only draft articles can be scheduled ───────────────────────
    if (article.status !== 'draft') {
        return err(
            'INVALID_STATUS',
            `Only draft articles can be scheduled. This article is currently '${article.status}'.`,
            409
        )
    }

    // ── Apply schedule ───────────────────────────────────────────────────────────
    const updatePayload: Record<string, any> = {
        status: 'queued',
        scheduled_at: scheduledDate.toISOString(),
        updated_at: new Date().toISOString(),
    }

    if (publish_at) {
        updatePayload.publish_at = new Date(publish_at).toISOString()
    }

    const { error: updateError } = await (supabase as any)
        .from('articles')
        .update(updatePayload)
        .eq('id', articleId)
        .eq('status', 'draft')   // final atomic guard

    if (updateError) {
        return err('DATABASE_ERROR', 'Failed to schedule article.', 500)
    }

    // ── Audit log ────────────────────────────────────────────────────────────────
    const { logActionAsync } = await import('@/lib/services/audit-logger')
    const { AuditAction } = await import('@/types/audit')
    await logActionAsync({
        orgId: currentUser.org_id,
        userId: currentUser.id,
        action: AuditAction.ARTICLE_SCHEDULED,
        details: {
            article_id: articleId,
            title: article.title,
            scheduled_at: scheduledDate.toISOString(),
            publish_at: publish_at ?? null,
            plan,
        },
    })

    return NextResponse.json(
        {
            success: true,
            articleId,
            scheduled_at: scheduledDate.toISOString(),
            publish_at: publish_at ? new Date(publish_at).toISOString() : undefined,
        },
        { status: 200 }
    )
}
