import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (orgId !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Type assertion needed until database types are regenerated after migration
    // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
    const { data: articles, error } = await (supabase
      .from('articles' as any)
      .select('id, keyword, status, created_at')
      .eq('org_id', currentUser.org_id)
      .in('status', ['queued', 'generating'])
      .order('created_at', { ascending: true }) as unknown as Promise<{ data: any[]; error: any }>)

    if (error) {
      console.error('Failed to fetch queue status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch queue status' },
        { status: 500 }
      )
    }

    // Add position numbers for queued articles
    const articlesWithPosition = (articles || []).map((article, index) => ({
      ...article,
      position: article.status === 'queued' ? index + 1 : undefined,
    }))

    return NextResponse.json({
      articles: articlesWithPosition,
    })
  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    )
  }
}

