import { createClient } from '@supabase/supabase-js'
import { WordPressAdapter } from '../wordpress-adapter'
import { createCMSAdapter } from './cms-engine'
import { decrypt } from '@/lib/security/encryption'
import type { CMSPlatform } from './cms-engine'

export interface WordPressPublishInput {
  articleId: string
  organizationId: string
  credentials: {
    site_url: string
    username: string
    application_password: string
  }
}

export interface WordPressPublishOutput {
  url: string
  postId: string
  alreadyPublished: boolean
}

export interface PublishArticleInput {
  articleId: string
  organizationId: string
  connectionId: string
}

// Database helpers for cleaner testing
export async function getExistingPublishReference(db: any, articleId: string, platform: string = 'wordpress', connectionId?: string) {
  let query = db
    .from('publish_references')
    .select('*')
    .eq('article_id', articleId)
    .eq('platform', platform)

  if (connectionId) {
    query = query.eq('connection_id', connectionId)
  }

  return query.single()
}

export async function getArticleForPublishing(db: any, articleId: string, orgId: string) {
  return db
    .from('articles')
    .select('title, sections, status')
    .eq('id', articleId)
    .eq('org_id', orgId)
    .single()
}

export async function createPublishReference(
  db: any,
  articleId: string,
  postId: string,
  url: string,
  platform: string = 'wordpress',
  connectionId?: string
) {
  return db
    .from('publish_references')
    .insert({
      article_id: articleId,
      platform,
      platform_post_id: String(postId),
      platform_url: url,
      published_at: new Date().toISOString(),
      ...(connectionId ? { connection_id: connectionId } : {}),
    })
}

/**
 * Generic article publisher — works with any cms_connections row.
 * Loads connection, decrypts credentials, routes to the right adapter.
 */
export async function publishArticle(
  input: PublishArticleInput
): Promise<WordPressPublishOutput> {
  const { articleId, organizationId, connectionId } = input

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
  const { CMS_SECRET_FIELDS } = await import('./cms-engine')
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
  const { data: existingRef, error: refError } = await getExistingPublishReference(
    supabase, articleId, platform, connectionId
  )
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
  const { data: article, error: articleError } = await getArticleForPublishing(supabase, articleId, organizationId)
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
  const { error: insertError } = await createPublishReference(
    supabase, articleId, result.postId, result.url, platform, connectionId
  )
  if (insertError) {
    throw new Error(`Failed to create publish reference: ${insertError.message}`)
  }

  return { url: result.url, postId: result.postId, alreadyPublished: false }
}

/**
 * @deprecated Use publishArticle() with a connectionId instead.
 * Kept for backward compatibility during the transition period.
 * Will be removed once all callers are migrated.
 */
export async function publishArticleToWordPress(
  input: WordPressPublishInput
): Promise<WordPressPublishOutput> {
  const { articleId, organizationId, credentials } = input

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existingReference, error: referenceError } = await getExistingPublishReference(supabase, articleId, 'wordpress')
  if (referenceError && referenceError.code !== 'PGRST116') {
    throw new Error(`Database error checking publish reference: ${referenceError.message}`)
  }
  if (existingReference) {
    return {
      url: existingReference.platform_url,
      postId: existingReference.platform_post_id,
      alreadyPublished: true,
    }
  }

  const { data: article, error: articleError } = await getArticleForPublishing(supabase, articleId, organizationId)
  if (articleError || !article) {
    throw new Error(`Article not found: ${articleError?.message || 'Unknown error'}`)
  }

  const fullHtml = Array.isArray(article.sections)
    ? article.sections.map((s: any) => s.html).join('\n')
    : ''

  const adapter = new WordPressAdapter(credentials)
  const result = await adapter.publishPost({ title: article.title, content: fullHtml, status: 'publish' })

  if (!result.success || !result.url || !result.postId) {
    throw new Error(`WordPress publishing failed: ${result.error || 'Unknown error'}`)
  }

  const { error: insertError } = await createPublishReference(supabase, articleId, String(result.postId), result.url, 'wordpress')
  if (insertError) {
    throw new Error(`Failed to create publish reference: ${insertError.message}`)
  }

  return { url: result.url, postId: String(result.postId), alreadyPublished: false }
}
