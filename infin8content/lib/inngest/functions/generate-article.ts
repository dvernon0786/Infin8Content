import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateOutline } from '@/lib/services/article-generation/outline-generator'
import { processSection } from '@/lib/services/article-generation/section-processor'
import { analyzeSerpStructure } from '@/lib/services/dataforseo/serp-analysis'

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delays: number[] = [1000, 2000, 4000]
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxAttempts - 1) {
        const delay = delays[attempt] || delays[delays.length - 1]
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }

  throw lastError || new Error('Retry exhausted')
}

export const generateArticle = inngest.createFunction(
  { 
    id: 'article/generate', 
    concurrency: { limit: 5 }, // Plan limit: 5 concurrent (can be increased when plan upgraded)
    // Note: Inngest functions run in Inngest Cloud (not Vercel), so they're not subject to
    // Vercel's 10s FUNCTION_INVOCATION_TIMEOUT. Functions can run for up to 24 hours by default.
    // The cleanup job will catch any articles that get stuck due to unexpected failures.
  },
  { event: 'article/generate' },
  async ({ event, step }) => {
    const { articleId } = event.data
    const supabase = createServiceRoleClient()

    try {
      // Step 1: Load article and update status to "generating"
      const article = await step.run('load-article', async () => {
        const { data, error } = await supabase
          .from('articles' as any)
          .select('id, org_id, keyword, status')
          .eq('id', articleId)
          .single()

        if (error || !data) {
          throw new Error(`Article ${articleId} not found: ${error?.message}`)
        }

        // Update status to generating
        await supabase
          .from('articles' as any)
          .update({
            status: 'generating',
            generation_started_at: new Date().toISOString()
          })
          .eq('id', articleId)

        // Type assertion needed because database types haven't been regenerated after migration
        // We've already checked data exists above, so this is safe
        return (data as unknown) as { id: string; org_id: string; keyword: string; status: string }
      })

      // Step 2: Load keyword research data
      const keywordResearch = await step.run('load-keyword-research', async () => {
        const cacheKey = article.keyword.toLowerCase().trim()
        const { data } = await supabase
          .from('keyword_researches' as any)
          .select('results')
          .eq('organization_id', article.org_id)
          .eq('keyword', cacheKey)
          .gt('cached_until', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Extract keyword research data from JSONB results
        // Type assertion needed because database types haven't been regenerated after migration
        const researchData = (data as unknown) as { results?: any } | null
        if (researchData?.results) {
          const results = researchData.results as any
          const keywordResult = results.tasks?.[0]?.result?.[0]
          if (keywordResult) {
            return {
              keyword: keywordResult.keyword,
              searchVolume: keywordResult.search_volume || 0,
              keywordDifficulty: keywordResult.competition_index || 0,
              trend: keywordResult.monthly_searches?.map((m: any) => m.search_volume) || [],
              cpc: keywordResult.cpc,
              competition: keywordResult.keyword_info?.competition || 'Medium'
            }
          }
        }

        return null // Cache miss - use keyword only
      })

      // Step 3: Generate SERP analysis
      const serpAnalysis = await step.run('generate-serp-analysis', async () => {
        return analyzeSerpStructure(article.keyword, article.org_id)
      })

      // Step 4: Generate outline
      const outline = await step.run('generate-outline', async () => {
        const startTime = Date.now()
        
        const generatedOutline = await generateOutline(
          article.keyword,
          keywordResearch,
          serpAnalysis
        )

        const duration = Date.now() - startTime

        // Store outline in article record
        await supabase
          .from('articles' as any)
          .update({
            outline: generatedOutline,
            outline_generation_duration_ms: duration
          })
          .eq('id', articleId)

        return generatedOutline
      })

      // Step 5: Process sections sequentially with retry logic
      await step.run('process-sections', async () => {
        const { data: articleData } = await supabase
          .from('articles' as any)
          .select('outline')
          .eq('id', articleId)
          .single()

        // Type assertion needed because database types haven't been regenerated after migration
        const article = (articleData as unknown) as { outline?: any } | null
        if (!article?.outline) {
          throw new Error('Outline not found')
        }

        const outline = article.outline as any

        // Process Introduction (index 0)
        await retryWithBackoff(() => processSection(articleId, 0, outline))

        // Process H2 sections sequentially (one at a time)
        for (let h2Index = 1; h2Index <= outline.h2_sections.length; h2Index++) {
          // Process H2 section
          await retryWithBackoff(() => processSection(articleId, h2Index, outline))

          // Process H3 subsections within this H2 section (decimal indices: 1.1, 1.2, etc.)
          const h2Section = outline.h2_sections[h2Index - 1]
          if (h2Section?.h3_subsections && Array.isArray(h2Section.h3_subsections)) {
            for (let h3Index = 1; h3Index <= h2Section.h3_subsections.length; h3Index++) {
              const sectionIndex = parseFloat(`${h2Index}.${h3Index}`)
              await retryWithBackoff(() => processSection(articleId, sectionIndex, outline))
            }
          }
        }

        // Process Conclusion (index N+1, where N = number of H2 sections)
        const conclusionIndex = outline.h2_sections.length + 1
        await retryWithBackoff(() => processSection(articleId, conclusionIndex, outline))

        // Process FAQ if included (index N+2)
        if (outline.faq?.included) {
          const faqIndex = outline.h2_sections.length + 2
          await retryWithBackoff(() => processSection(articleId, faqIndex, outline))
        }
      })

      // Step 6: Update article status to completed
      await step.run('complete-article', async () => {
        await supabase
          .from('articles' as any)
          .update({
            status: 'completed',
            generation_completed_at: new Date().toISOString()
          })
          .eq('id', articleId)
      })

      return { success: true, articleId }
    } catch (error) {
      // Handle errors: save partial article and update status
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Check if this is a timeout error
      const isTimeout = errorMessage.includes('timeout') || 
                       errorMessage.includes('TIMEOUT') ||
                       errorMessage.includes('Function invocation timeout') ||
                       errorMessage.includes('FUNCTION_INVOCATION_TIMEOUT')
      
      await step.run('handle-error', async () => {
        // Get current sections to preserve partial article
        const { data: articleData } = await supabase
          .from('articles' as any)
          .select('sections, current_section_index')
          .eq('id', articleId)
          .single()

        // Type assertion needed because database types haven't been regenerated after migration
        const article = (articleData as unknown) as { sections?: any[]; current_section_index?: number } | null

        await supabase
          .from('articles' as any)
          .update({
            status: 'failed',
            error_details: {
              error_message: errorMessage,
              failed_at: new Date().toISOString(),
              section_index: article?.current_section_index || 0,
              partial_sections: article?.sections || [],
              timeout: isTimeout
            }
          })
          .eq('id', articleId)

        // NOTE: User notification is handled by Story 4a-6 (real-time progress tracking)
        // The article status update to "failed" will trigger real-time updates to the user
        // via WebSocket/SSE connections established in Story 4a-6
      })

      throw error
    }
  }
)

