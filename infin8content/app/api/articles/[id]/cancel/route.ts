import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Check if article exists and belongs to user's organization
    // Type assertion needed until database types are regenerated after migration
    // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
    const { data: article, error: fetchError } = await (supabase
      .from('articles' as any)
      .select('id, status, org_id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single() as unknown as Promise<{ data: any; error: any }>)

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Only allow cancelling queued articles
    if (article.status !== 'queued') {
      return NextResponse.json(
        { error: 'Only queued articles can be cancelled' },
        { status: 400 }
      )
    }

    // Update article status to cancelled
    const { error: updateError } = await supabase
      .from('articles' as any)
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to cancel article:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel article' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Article cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel article error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel article' },
      { status: 500 }
    )
  }
}

