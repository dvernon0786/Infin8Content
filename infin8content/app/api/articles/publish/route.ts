// Publish API Route
// Story 5-1: Publish Article to WordPress (Minimal One-Click Export)
// POST /api/articles/publish

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { WordPressAdapter, WordPressPostRequest } from '@/lib/services/wordpress-adapter';
import { getPublishReference, createPublishReference } from '@/lib/supabase/publish-references';

// Feature flag for instant rollback capability
const WORDPRESS_PUBLISH_ENABLED = process.env.WORDPRESS_PUBLISH_ENABLED === 'true';

// WordPress credentials (system-level defaults for Story 5-1)
const WORDPRESS_DEFAULT_SITE_URL = process.env.WORDPRESS_DEFAULT_SITE_URL;
const WORDPRESS_DEFAULT_USERNAME = process.env.WORDPRESS_DEFAULT_USERNAME;
const WORDPRESS_DEFAULT_APPLICATION_PASSWORD = process.env.WORDPRESS_DEFAULT_APPLICATION_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!WORDPRESS_PUBLISH_ENABLED) {
      return NextResponse.json(
        { error: 'WordPress publishing is currently disabled' },
        { status: 503 }
      );
    }

    // Get current user using existing pattern
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client for RLS-protected operations
    const supabase = await createClient()

    // Check if article exists and user has access
    const { data: article, error: articleError } = await (supabase
      .from('articles' as any)
      .select('id, title, status, org_id, sections')
      .eq('id', articleId)
      .single() as any);

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Verify user can access this article (RLS handles this, but double-check)
    if ((article as any).org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if article is completed (AC: Eligibility)
    if ((article as any).status !== 'completed') {
      return NextResponse.json(
        { error: 'Article must be completed before publishing' },
        { status: 400 }
      );
    }

    // Check for existing publish reference (idempotency)
    const existingReference = await getPublishReference(articleId, 'wordpress');
    
    if (existingReference) {
      // Article already published - return existing URL
      return NextResponse.json({
        success: true,
        url: existingReference.platform_url,
        alreadyPublished: true,
      });
    }

    // Get WordPress credentials from environment (system-level defaults for Story 5-1)
    const wordpressCredentials = {
      username: process.env.WORDPRESS_DEFAULT_USERNAME!,
      application_password: process.env.WORDPRESS_DEFAULT_APPLICATION_PASSWORD!,
      site_url: process.env.WORDPRESS_DEFAULT_SITE_URL!,
    };

    // Validate credentials are configured
    if (!wordpressCredentials.username || !wordpressCredentials.application_password || !wordpressCredentials.site_url) {
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      );
    }

    // Create WordPress adapter
    const wordpressAdapter = new WordPressAdapter(wordpressCredentials);

    // Build content from sections (articles stores content in JSON sections array)
    let content = ''

    try {
      const sections = Array.isArray((article as any).sections)
        ? (article as any).sections
        : JSON.parse((article as any).sections || '[]')

      content = sections
        .map((s: any) => s?.content)
        .filter(Boolean)
        .join('\n\n')
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse article content' },
        { status: 500 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Article has no content to publish' },
        { status: 400 }
      )
    }

    // Prepare WordPress post data (exact contract)
    const postData: WordPressPostRequest = {
      title: (article as any).title || 'Untitled Article',
      content,
      status: 'publish',
    };

    // Publish to WordPress
    const publishResult = await wordpressAdapter.publishPost(postData);

    if (!publishResult.success) {
      return NextResponse.json(
        { error: publishResult.error || 'Failed to publish to WordPress' },
        { status: 500 }
      );
    }

    // Store publish reference in database
    // NOTE: Persistence failure does not undo publishing by design (Story 5-1 requirement)
    // This avoids rollback complexity while maintaining idempotency via publish_references lookup
    try {
      await createPublishReference({
        article_id: articleId,
        platform: 'wordpress',
        platform_post_id: publishResult.postId?.toString() || '',
        platform_url: publishResult.url!,
        published_at: new Date().toISOString(),
      });
    } catch (dbError) {
      // Log error but don't fail the publish operation
      console.error('Failed to store publish reference:', dbError);
      // Per story requirements, persistence failure doesn't undo publishing
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url: publishResult.url,
      postId: publishResult.postId,
    });

  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint for feature flag status
export async function GET() {
  return NextResponse.json({
    enabled: WORDPRESS_PUBLISH_ENABLED,
    configured: !!(process.env.WORDPRESS_DEFAULT_USERNAME && 
                   process.env.WORDPRESS_DEFAULT_APPLICATION_PASSWORD && 
                   process.env.WORDPRESS_DEFAULT_SITE_URL),
  });
}
