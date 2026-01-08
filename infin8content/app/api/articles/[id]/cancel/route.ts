import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * POST /api/articles/[id]/cancel
 * 
 * Cancels a queued article generation request.
 * Only articles with status "queued" can be cancelled.
 * 
 * @param request - HTTP request (body not used)
 * @param params - Route parameters containing article ID
 * @returns JSON response with success status
 * 
 * Route Parameters:
 * - id: string (required) - UUID of the article to cancel
 * 
 * Response (Success - 200):
 * - success: boolean
 * - message: string
 * 
 * Response (Error - 400):
 * - error: "Only queued articles can be cancelled"
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 404):
 * - error: "Article not found"
 * 
 * Response (Error - 500):
 * - error: string - Server error message
 * 
 * Authentication: Requires authenticated user session
 * Authorization: User must belong to the organization that owns the article
 */
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
    // TODO: Remove type assertion after regenerating types from Supabase Dashboard
    const { error: updateError } = await (supabase as any)
      .from('articles')
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

