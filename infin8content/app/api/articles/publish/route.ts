// Publish API Route
// Story C-3: WordPress Publishing Service (Idempotent Service Layer)
// POST /api/articles/publish

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { publishArticleToWordPress, WordPressPublishInput } from '@/lib/services/publishing/wordpress-publisher';

// Feature flag for instant rollback capability
const WORDPRESS_PUBLISH_ENABLED = process.env.WORDPRESS_PUBLISH_ENABLED === 'true';

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
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { articleId, credentials } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Use provided credentials or system defaults
    const wordpressCredentials = credentials || {
      site_url: process.env.WORDPRESS_DEFAULT_SITE_URL!,
      username: process.env.WORDPRESS_DEFAULT_USERNAME!,
      application_password: process.env.WORDPRESS_DEFAULT_APPLICATION_PASSWORD!,
    };

    // Validate credentials are configured
    if (!wordpressCredentials.username || !wordpressCredentials.application_password || !wordpressCredentials.site_url) {
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      );
    }

    // Prepare input for WordPress publishing service
    const publishInput: WordPressPublishInput = {
      articleId,
      organizationId: currentUser.org_id,
      credentials: wordpressCredentials
    };

    // Publish using the new service (handles idempotency, validation, etc.)
    const result = await publishArticleToWordPress(publishInput);

    // Return success response
    return NextResponse.json({
      success: true,
      url: result.url,
      postId: result.postId,
      alreadyPublished: result.alreadyPublished,
    });

  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
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
