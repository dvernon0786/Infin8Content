/**
 * cms-publisher.ts
 *
 * Central orchestrator for publishing articles to any connected CMS platform.
 * Handles idempotency, credential decryption, adapter routing, and
 * publish_references persistence.
 */

import { createClient } from '@supabase/supabase-js'
import { createCMSAdapter, CMS_SECRET_FIELDS } from './cms-engine'
import { decrypt } from '@/lib/security/encryption'
import type { CMSPlatform } from './cms-engine'

export interface PublishArticleParams {
  articleId: string
  organizationId: string
  connectionId: string
}

export interface PublishArticleResult {
  url: string
  postId: string
  alreadyPublished: boolean
}

export async function publishArticle(
  params: PublishArticleParams
): Promise<PublishArticleResult> {
  const { articleId, organizationId, connectionId } = params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Load connection
  const { data: connection, error: connError } = await (supabase
    .from('cms_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('org_id', organizationId)
    .eq('status', 'active')
    .single() as any)

  if (connError || !connection) {
    throw new Error('CMS connection not found or inactive')
  }

  const platform = connection.platform as CMSPlatform
  const rawCreds = connection.credentials as Record<string, string>

  // 2. Decrypt secret fields
  const secretFields = CMS_SECRET_FIELDS[platform] || []
  const credentials: Record<string, string> = { ...rawCreds }
  for (const field of secretFields) {
    if (credentials[field]) {
      try {
        credentials[field] = decrypt(credentials[field])
      } catch {
        throw new Error(`Failed to decrypt credentials for ${platform} connection`)
      }
    }
  }

  // 3. Idempotency check
  const { data: existingRef, error: refError } = await (supabase
    .from('publish_references')
    .select('*')
    .eq('article_id', articleId)
    .eq('platform', platform)
    .eq('connection_id', connectionId)
    .single() as any)

  if (refError && refError.code !== 'PGRST116') {
    throw new Error(`Database error checking publish reference: ${refError.message}`)
  }
  if (existingRef) {
    return {
      url: existingRef.platform_url,
      postId: existingRef.platform_post_id,
      alreadyPublished: true,
    }
  }

  // 4. Load article
  const { data: article, error: articleError } = await (supabase
    .from('articles')
    .select('title, sections, status')
    .eq('id', articleId)
    .eq('org_id', organizationId)
    .single() as any)

  if (articleError || !article) {
    throw new Error(`Article not found: ${articleError?.message || 'Unknown error'}`)
  }

  const fullHtml = Array.isArray(article.sections)
    ? article.sections.map((s: any) => s.html).join('\n')
    : ''

  // 5. Publish via adapter
  const adapter = createCMSAdapter(platform, credentials)
  const result = await adapter.publishPost({ title: article.title, html: fullHtml })

  if (!result.success || !result.url || !result.postId) {
    throw new Error(`Publishing failed: ${result.error || 'Unknown error'}`)
  }

  // 6. Persist publish reference
  const { error: insertError } = await (supabase
    .from('publish_references')
    .insert({
      article_id: articleId,
      platform,
      platform_post_id: String(result.postId),
      platform_url: result.url,
      published_at: new Date().toISOString(),
      connection_id: connectionId,
    }) as any)

  if (insertError) {
    throw new Error(`Failed to create publish reference: ${insertError.message}`)
  }

  return { url: result.url, postId: result.postId, alreadyPublished: false }
}
