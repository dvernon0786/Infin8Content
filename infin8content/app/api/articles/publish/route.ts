import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { publishArticleToWordPress } from '@/lib/services/publishing/wordpress-publisher'
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/security/encryption'

/**
 * POST /api/articles/publish
 * 
 * Publishes a completed article to a connected CMS (WordPress).
 * Enforces trial plan restrictions.
 */
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.org_id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 1. Trial Plan Restriction
        const org = currentUser.organizations as any
        const planType = (org?.plan_type || org?.plan || 'starter').toLowerCase()

        if (planType === 'trial') {
            return NextResponse.json({
                error: 'Publishing is not available on the trial plan. Please upgrade to a paid plan to publish to CMS.'
            }, { status: 403 })
        }

        const body = await request.json()
        const { articleId } = body

        if (!articleId) {
            return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // 2. Verify ownership and get CMS config
        const { data: orgData, error: orgError } = await (supabase
            .from('organizations')
            .select('blog_config')
            .eq('id', currentUser.org_id)
            .single() as any)

        if (orgError || !orgData || !orgData.blog_config) {
            return NextResponse.json({ error: 'Organization or CMS config not found' }, { status: 404 })
        }

        const blogConfig = orgData.blog_config as any
        const wordpressConfig = blogConfig.integrations?.wordpress

        if (!wordpressConfig || !wordpressConfig.url || !wordpressConfig.application_password) {
            return NextResponse.json({ error: 'WordPress is not connected. Please connect it in settings.' }, { status: 400 })
        }

        // 3. Decrypt application password
        let password = ''
        try {
            password = decrypt(wordpressConfig.application_password)
        } catch (err) {
            console.error('Failed to decrypt WordPress password:', err)
            return NextResponse.json({ error: 'Failed to retrieve connection credentials' }, { status: 500 })
        }

        // 4. Publish Article
        try {
            const result = await publishArticleToWordPress({
                articleId,
                organizationId: currentUser.org_id,
                credentials: {
                    site_url: wordpressConfig.url,
                    username: wordpressConfig.username,
                    application_password: password
                }
            })

            // 5. Log Audit
            await logActionAsync({
                orgId: currentUser.org_id,
                userId: currentUser.id,
                action: AuditAction.ARTICLE_PUBLISHED,
                details: {
                    article_id: articleId,
                    platform: 'wordpress',
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
                error: publishError.message || 'Failed to publish to WordPress'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Unexpected error in POST /api/articles/publish:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
