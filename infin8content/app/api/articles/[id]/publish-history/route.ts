/**
 * GET /api/articles/[id]/publish-history
 *
 * Returns all publish_references rows for an article,
 * joined with cms_connections name for display.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id: articleId } = await params

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify article belongs to org
    const { data: article, error: articleError } = await (supabase
      .from('articles')
      .select('id')
      .eq('id', articleId)
      .eq('org_id', currentUser.org_id)
      .maybeSingle() as any)

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Fetch publish references ordered newest first
    const { data: refs, error: refsError } = await (supabase
      .from('publish_references')
      .select('id, platform, platform_url, platform_post_id, published_at, connection_id')
      .eq('article_id', articleId)
      .order('published_at', { ascending: false }) as any)

    if (refsError) {
      return NextResponse.json({ error: 'Failed to load publish history' }, { status: 500 })
    }

    // Enrich with connection names where available
    const records = await Promise.all(
      (refs || []).map(async (ref: any) => {
        let connection_name: string | null = null
        if (ref.connection_id) {
          const { data: conn } = await (supabase
            .from('cms_connections')
            .select('name')
            .eq('id', ref.connection_id)
            .single() as any)
          connection_name = conn?.name ?? null
        }
        return { ...ref, connection_name }
      })
    )

    return NextResponse.json({ records })
  } catch (err) {
    console.error('[publish-history GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
