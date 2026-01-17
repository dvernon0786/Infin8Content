import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { articleId, title } = await request.json()
    
    if (!articleId || !title) {
      return NextResponse.json({ error: 'Missing articleId or title' }, { status: 400 })
    }
    
    const supabaseAdmin = createServiceRoleClient()
    
    // Update the article title
    const { data, error } = await supabaseAdmin
      .from('articles' as any)
      .update({ title })
      .eq('id', articleId)
      .select('id, title, keyword, status')
      .single()
    
    if (error) {
      console.error('[Fix Title] Error updating article:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }
    
    console.log('[Fix Title] Article updated successfully:', data)
    
    return NextResponse.json({
      success: true,
      article: data
    })
    
  } catch (error) {
    console.error('[Fix Title] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
