import { createClient } from '@supabase/supabase-js'
import { WordPressAdapter } from '../wordpress-adapter'

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

// Database helpers for cleaner testing
export async function getExistingPublishReference(db: any, articleId: string) {
  return db
    .from('publish_references')
    .select('*')
    .eq('article_id', articleId)
    .eq('platform', 'wordpress')
    .single()
}

export async function getArticleForPublishing(db: any, articleId: string, orgId: string) {
  return db
    .from('articles')
    .select('title, content_html, status')
    .eq('id', articleId)
    .eq('organization_id', orgId)
    .single()
}

export async function createPublishReference(db: any, articleId: string, postId: string, url: string) {
  return db
    .from('publish_references')
    .insert({
      article_id: articleId,
      platform: 'wordpress',
      platform_post_id: String(postId),
      platform_url: url,
      published_at: new Date().toISOString()
    })
}

/**
 * Publishes an article to WordPress with idempotency
 * 
 * @param input - WordPress publishing input data
 * @returns WordPress publishing output with URL and post ID
 */
export async function publishArticleToWordPress(
  input: WordPressPublishInput
): Promise<WordPressPublishOutput> {
  const { articleId, organizationId, credentials } = input

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Check if already published (idempotency check)
    const { data: existingReference, error: referenceError } = await getExistingPublishReference(supabase, articleId)

    if (referenceError && referenceError.code !== 'PGRST116') {
      throw new Error(`Database error checking publish reference: ${referenceError.message}`)
    }

    if (existingReference) {
      return {
        url: existingReference.platform_url,
        postId: existingReference.platform_post_id,
        alreadyPublished: true
      }
    }

    // 2. Load article data
    const { data: article, error: articleError } = await getArticleForPublishing(supabase, articleId, organizationId)

    if (articleError || !article) {
      throw new Error(`Article not found: ${articleError?.message || 'Unknown error'}`)
    }

    // 3. Publish via WordPress adapter
    const adapter = new WordPressAdapter(credentials)
    const result = await adapter.publishPost({
      title: article.title,
      content: article.content_html,
      status: 'publish'
    })

    // Handle adapter response format
    if (!result.success || !result.url || !result.postId) {
      throw new Error(`WordPress publishing failed: ${result.error || 'Unknown error'}`)
    }

    // 4. Persist publish reference
    const { error: insertError } = await createPublishReference(supabase, articleId, String(result.postId), result.url)

    if (insertError) {
      throw new Error(`Failed to create publish reference: ${insertError.message}`)
    }

    return {
      url: result.url,
      postId: String(result.postId),
      alreadyPublished: false
    }
  } catch (error) {
    // Log error with context but don't auto-retry (user clicks retry button)
    console.error('WordPress publishing failed:', {
      articleId,
      organizationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}
