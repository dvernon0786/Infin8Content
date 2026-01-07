import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const generateArticle = inngest.createFunction(
  { id: 'article/generate', concurrency: { limit: 50 } }, // NFR-P6: 50 concurrent
  { event: 'article/generate' },
  async ({ event, step }) => {
    const { articleId } = event.data
    
    // Update article status to "generating"
    const supabase = createServiceRoleClient()
    await supabase
      .from('articles' as any)
      .update({ status: 'generating' })
      .eq('id', articleId)
    
    // TODO: Actual generation logic will be implemented in Story 4a-2
    // For now, just update status and return
    
    return { success: true, articleId }
  }
)

