import { createServiceRoleClient } from '@/lib/supabase/server'  // ✅ Fix 1
import { createCMSAdapter, CMS_SECRET_FIELDS } from './cms-engine'
import { decrypt } from '@/lib/security/encryption'
import type { CMSPlatform } from './cms-engine'

export interface PublishArticleParams {
  articleId:      string
  organizationId: string
  connectionId:   string
}

export interface PublishArticleResult {
  url?:             string
  postId?:          string
  alreadyPublished: boolean
}

export async function publishArticle(
  params: PublishArticleParams
): Promise<PublishArticleResult> {
  const { articleId, organizationId, connectionId } = params
  const supabase = createServiceRoleClient()  // ✅ Fix 1: correct server client

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

  const platform     = (connection as any).platform as CMSPlatform
  const rawCreds = (connection as any).credentials as Record<string, string>
  const secretFields = CMS_SECRET_FIELDS[platform] ?? []

  // 3. Idempotency check (connection-specific first, then legacy rows without connection_id)
  const { data: existingRef, error: refError } = await (supabase
    .from('publish_references')
    .select('platform_url, platform_post_id')
    .eq('article_id', articleId)
    .eq('connection_id', connectionId)
    .maybeSingle() as any)

  if (refError) {
    throw new Error(`Database error checking publish reference: ${refError.message}`)
  }
  if (existingRef) {
    return {
      url:              existingRef.platform_url  ?? undefined,
      postId:           existingRef.platform_post_id ?? undefined,
      alreadyPublished: true,
    }
  }

  // Legacy idempotency check for pre-multi-CMS rows (connection_id IS NULL)
  const { data: legacyRef, error: legacyRefError } = await (supabase
    .from('publish_references')
    .select('platform_url, platform_post_id')
    .eq('article_id', articleId)
    .is('connection_id', null)
    .eq('platform', platform)
    .maybeSingle() as any)

  if (legacyRefError) {
    throw new Error(`Database error checking legacy publish reference: ${legacyRefError.message}`)
  }
  if (legacyRef) {
    return {
      url:              legacyRef.platform_url  ?? undefined,
      postId:           legacyRef.platform_post_id ?? undefined,
      alreadyPublished: true,
    }
  }

  // 4. Decrypt secret fields
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

  // 4. Load article — sections JSONB snapshot populated by ArticleAssembler
  const { data: article, error: articleError } = await (supabase
    .from('articles')
    .select('title, sections, status')
    .eq('id', articleId)
    .eq('org_id', organizationId)
    .single() as any)

  if (articleError || !article) {
    throw new Error(`Article not found: ${articleError?.message ?? 'unknown error'}`)
  }

  const sections = (article as any).sections
  const fullHtml = Array.isArray(sections) && sections.length > 0
    ? sections.map((s: any) => s.html ?? '').join('\n')
    : ''

  if (!fullHtml.trim()) {
    throw new Error('Article has no HTML content — run assembly first')
  }

  // 5. Publish via adapter
  const adapter = createCMSAdapter(platform, credentials)
  let result
  try {
    result = await adapter.publishPost({
      title: (article as any).title,
      html:  fullHtml,
    })
  } catch (err: any) {
    throw new Error(`Adapter error: ${err?.message ?? 'unknown'}`)
  }

  if (!result.success) {
    throw new Error(`Publishing failed: ${result.error ?? 'unknown error'}`)
  }

  // 6. Persist publish reference
  const { error: insertError } = await (supabase
    .from('publish_references')
    .insert({
      article_id:       articleId,
      platform,
      platform_post_id: result.postId ? String(result.postId) : null,
      platform_url:     result.url ?? null,
      published_at:     new Date().toISOString(),
      connection_id:    connectionId,
    } as any) as any)

  if (insertError) {
    throw new Error(`Failed to record publish reference: ${insertError.message}`)
  }

  return { url: result.url, postId: result.postId, alreadyPublished: false }
}
