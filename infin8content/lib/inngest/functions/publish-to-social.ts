/**
 * lib/inngest/functions/publish-to-social.ts
 *
 * Handles BOTH publish paths:
 *
 *   1. AUTO-PUBLISH — fires when article/generation.completed is emitted
 *      at the end of the generate-article pipeline.
 *
 *   2. MANUAL PUBLISH — fires when POST /api/v1/articles/:id/publish-social
 *      sends the "article/publish.requested" event.
 *
 * Steps (Inngest durable execution):
 *   step 1 — load article + org social accounts from DB
 *   step 2 — generate AI caption
 *   step 3 — call Outstand POST /v1/posts  (publish immediately)
 *   step 4 — persist outstand_post_id in publish_references + log activity
 *   step 5 — (background, 1h later) fetch analytics + store in DB
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateSocialCaption } from '@/lib/services/outstand/caption-generator'
import { createPost, getPostAnalytics } from '@/lib/services/outstand/client'

// ── Event type declarations ───────────────────────────────────────────────────

export type ArticleCompletedEvent = {
  name: 'article/generation.completed'
  data: {
    articleId: string
    organizationId: string
  }
}

export type ArticlePublishRequestedEvent = {
  name: 'article/publish.requested'
  data: {
    articleId: string
    organizationId: string
    requestedBy: string
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function buildArticleUrl(articleId: string, slug?: string | null): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.infin8content.com'
  return slug ? `${base}/articles/${slug}` : `${base}/articles/${articleId}`
}

// ── Shared publish logic ──────────────────────────────────────────────────────

async function runPublishWorkflow(
  step: any,
  articleId: string,
  organizationId: string,
  requestedBy?: string,
) {
  // ── Step 1: Load article + social accounts ──────────────────────────────
  const { article, socialAccounts } = await step.run(
    'load-article-and-social-accounts',
    async () => {
      const supabase = createServiceRoleClient()

      const { data: art, error: artErr } = await supabase
        .from('articles')
        .select('id, title, writing_style, sections, slug, status, cms_status')
        .eq('id', articleId)
        .eq('organization_id', organizationId)
        .single()

      if (artErr || !art) {
        throw new Error(`Article not found: ${artErr?.message}`)
      }

      // Idempotency guard — don't double-publish
      if (art.cms_status === 'published') {
        return { article: art, socialAccounts: [], skip: true }
      }

      const { data: accounts, error: accErr } = await supabase
        .from('org_social_accounts')
        .select('outstand_account_id, network, username')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (accErr) throw new Error(`Failed to load social accounts: ${accErr.message}`)

      return { article: art, socialAccounts: accounts ?? [], skip: false }
    },
  )

  // No active social accounts → nothing to do
  if ((socialAccounts as any).skip || !socialAccounts.length) {
    return { skipped: true, reason: 'no active social accounts or already published' }
  }

  // ── Step 2: Generate AI caption ─────────────────────────────────────────
  const caption = await step.run('generate-social-caption', async () => {
    let excerpt = ''
    if (article.sections && Array.isArray(article.sections)) {
      excerpt = article.sections
        .slice(0, 2)
        .map((s: any) => s.content_markdown ?? s.content ?? '')
        .join(' ')
        .replace(/[#*`>\-]/g, '')
        .trim()
        .slice(0, 500)
    }

    return generateSocialCaption({
      title: article.title,
      excerpt,
      articleUrl: buildArticleUrl(articleId, article.slug),
      writingStyle: article.writing_style,
    })
  })

  // ── Step 3: Post to Outstand ─────────────────────────────────────────────
  const outstandPost = await step.run('post-to-outstand', async () => {
    const accountIds = (socialAccounts as any[]).map((a) => a.outstand_account_id)
    return createPost({ content: caption, accounts: accountIds })
  })

  // ── Step 4: Persist outstand_post_id + log activity ──────────────────────
  await step.run('persist-publish-reference', async () => {
    const supabase = createServiceRoleClient()

    const { error: refErr } = await (supabase as any)
      .from('publish_references')
      .upsert(
        {
          article_id: articleId,
          organization_id: organizationId,
          platform: 'social',
          outstand_post_id: outstandPost.id,
          social_status: 'pending',
          published_at: new Date().toISOString(),
        },
        { onConflict: 'article_id,platform' },
      )

    if (refErr) throw new Error(`publish_references upsert failed: ${refErr.message}`)

    // Mark article as published
    await supabase
      .from('articles')
      .update({ cms_status: 'published' })
      .eq('id', articleId)

    // Activity feed
    await supabase.from('activities').insert({
      organization_id: organizationId,
      user_id: requestedBy ?? undefined,
      article_id: articleId,
      activity_type: 'article_published_social',
      metadata: {
        outstand_post_id: outstandPost.id,
        networks: (socialAccounts as any[]).map((a) => a.network),
        caption_preview: caption.slice(0, 120),
      },
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      org_id: organizationId,
      user_id: requestedBy ?? undefined,
      action: 'article.published_social',
      details: {
        article_id: articleId,
        outstand_post_id: outstandPost.id,
        networks: (socialAccounts as any[]).map((a) => a.network),
      },
    })
  })

  // ── Step 5: Wait 1h then fetch analytics ─────────────────────────────────
  await step.sleep('wait-for-analytics', '1h')

  await step.run('fetch-and-store-analytics', async () => {
    const analytics = await getPostAnalytics(outstandPost.id)
    const supabase = createServiceRoleClient()

    await supabase
      .from('publish_references')
      .update({
        analytics_synced_at: new Date().toISOString(),
        analytics_data: analytics.aggregated_metrics,
      })
      .eq('outstand_post_id', outstandPost.id)

    const rows = analytics.metrics_by_account.map((acc) => ({
      article_id: articleId,
      organization_id: organizationId,
      outstand_post_id: outstandPost.id,
      network: acc.social_account.network,
      username: acc.social_account.username,
      platform_post_id: acc.platform_post_id,
      likes: acc.metrics.likes,
      comments: acc.metrics.comments,
      shares: acc.metrics.shares,
      views: acc.metrics.views,
      impressions: acc.metrics.impressions,
      reach: acc.metrics.reach,
      engagement_rate: acc.metrics.engagement_rate,
      fetched_at: new Date().toISOString(),
    }))

    if (rows.length > 0) {
      await supabase
        .from('article_social_analytics')
        .upsert(rows, { onConflict: 'article_id,outstand_post_id,network' })
    }
  })

  return { outstandPostId: outstandPost.id, caption }
}

// ── Inngest function: AUTO-PUBLISH ────────────────────────────────────────────

export const autoPublishToSocial = inngest.createFunction(
  {
    id: 'auto-publish-to-social',
    name: 'Auto Publish to Social (article completed)',
    retries: 3,
  },
  { event: 'article/generation.completed' },
  async ({ event, step }) => {
    const { articleId, organizationId } = event.data
    return runPublishWorkflow(step, articleId, organizationId)
  },
)

// ── Inngest function: MANUAL PUBLISH ─────────────────────────────────────────

export const manualPublishToSocial = inngest.createFunction(
  {
    id: 'manual-publish-to-social',
    name: 'Manual Publish to Social (user triggered)',
    retries: 3,
  },
  { event: 'article/publish.requested' },
  async ({ event, step }) => {
    const { articleId, organizationId, requestedBy } = event.data
    return runPublishWorkflow(step, articleId, organizationId, requestedBy)
  },
)
