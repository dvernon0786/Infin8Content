import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { publishArticle } from '@/lib/services/publishing/wordpress-publisher'
import { NextResponse } from 'next/server'

/**
 * POST /api/articles/publish
 *
 * Publishes a completed article to a CMS connection.
 * 
 * Body: { articleId: string, connectionId?: string }
 *
 * If connectionId is omitted, falls back to the org's first active WordPress
 * connection (backward compatibility for existing WordPress-only integrations).
 */
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.org_id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Trial Plan Restriction
        const org = currentUser.organizations as any
        const planType = (org?.plan || org?.plan_type || 'starter').toLowerCase()

        if (planType === 'trial') {
            return NextResponse.json({
                error: 'Publishing is not available on the trial plan. Please upgrade to a paid plan to publish to CMS.'
            }, { status: 403 })
        }

        const body = await request.json()
        const { articleId, connectionId: explicitConnectionId } = body

        if (!articleId) {
            return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Resolve connectionId — explicit or fallback to first active WP connection
        let connectionId = explicitConnectionId as string | undefined

        if (!connectionId) {
            const { data: fallback } = await (supabase
                .from('cms_connections')
                .select('id, platform')
                .eq('org_id', currentUser.org_id)
                .eq('status', 'active')
                .eq('platform', 'wordpress')
                .order('created_at', { ascending: true })
                .limit(1)
                .single() as any)

            if (!fallback) {
                return NextResponse.json({
                    error: 'No CMS connection found. Please connect a platform in Settings → Integrations.'
                }, { status: 400 })
            }

            connectionId = fallback.id
        }

        // Publish via generic adapter
        try {
            const result = await publishArticle({
                articleId,
                organizationId: currentUser.org_id,
                connectionId: connectionId as string,
            })

            // Load platform for audit log
            const { data: connData } = await (supabase
                .from('cms_connections')
                .select('platform, name')
                .eq('id', connectionId)
                .single() as any)

            await logActionAsync({
                orgId: currentUser.org_id,
                userId: currentUser.id,
                action: AuditAction.ARTICLE_PUBLISHED,
                details: {
                    article_id: articleId,
                    platform: connData?.platform || 'unknown',
                    connection_id: connectionId,
                    connection_name: connData?.name,
                    url: result.url,
                    already_published: result.alreadyPublished
                },
                ipAddress: extractIpAddress(request.headers),
                userAgent: extractUserAgent(request.headers),
            })

            return NextResponse.json({
                success: true,
                url: result.url,
                alreadyPublished: result.alreadyPublished
            })

        } catch (publishError: any) {
            return NextResponse.json({
                error: publishError.message || 'Failed to publish article'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Unexpected error in POST /api/articles/publish:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
