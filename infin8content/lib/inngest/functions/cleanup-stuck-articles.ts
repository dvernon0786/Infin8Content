import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Cleanup job to detect and fix articles stuck in "generating" status
 * Runs every 15 minutes to catch articles that timed out without proper error handling
 * 
 * This prevents articles from being stuck indefinitely in "generating" status
 * when Inngest functions timeout or crash unexpectedly.
 */
export const cleanupStuckArticles = inngest.createFunction(
  { 
    id: 'articles/cleanup-stuck',
    // Run cleanup job with lower priority (don't interfere with article generation)
    concurrency: { limit: 1 }
  },
  { cron: '*/15 * * * *' }, // Run every 15 minutes
  async ({ step }) => {
    const supabase = createServiceRoleClient()
    
    return await step.run('find-and-fix-stuck-articles', async () => {
      // Find articles stuck in "generating" for more than 30 minutes
      // This gives articles enough time to complete (most take 10-20 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      
      const { data: stuckArticlesData, error: findError } = await (supabase
        .from('articles' as any)
        .select('id, keyword, generation_started_at, current_section_index, sections')
        .eq('status', 'generating')
        .lt('generation_started_at', thirtyMinutesAgo) as unknown as Promise<{ 
          data: Array<{ id: string; keyword: string; generation_started_at: string; current_section_index?: number; sections?: any[] }> | null; 
          error: any 
        }>)
      
      if (findError) {
        console.error('Failed to find stuck articles:', findError)
        return { 
          success: false, 
          error: findError.message,
          updated: 0 
        }
      }
      
      const stuckArticles = stuckArticlesData || []
      
      if (stuckArticles.length === 0) {
        return { 
          success: true, 
          updated: 0,
          message: 'No stuck articles found'
        }
      }
      
      // Update stuck articles to failed status
      const articleIds = stuckArticles.map(a => a.id)
      const { error: updateError, data: updatedArticles } = await supabase
        .from('articles' as any)
        .update({
          status: 'failed',
          error_details: {
            error_message: 'Article generation timed out (stuck in generating status for >30 minutes)',
            failed_at: new Date().toISOString(),
            timeout: true,
            auto_cleaned: true,
            stuck_duration_minutes: stuckArticles.map(article => {
              const startTime = new Date(article.generation_started_at).getTime()
              const now = Date.now()
              return Math.round((now - startTime) / (60 * 1000))
            })
          }
        })
        .in('id', articleIds)
        .select('id, keyword')
      
      if (updateError) {
        console.error('Failed to update stuck articles:', updateError)
        return { 
          success: false, 
          error: updateError.message,
          updated: 0
        }
      }
      
      console.log(`Cleaned up ${stuckArticles.length} stuck article(s):`, 
        stuckArticles.map(a => ({ id: a.id, keyword: a.keyword }))
      )
      
      return { 
        success: true, 
        updated: stuckArticles.length,
        articles: updatedArticles || stuckArticles.map(a => ({ id: a.id, keyword: a.keyword }))
      }
    })
  }
)

