import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateOutline } from '@/lib/services/article-generation/outline-generator'
import { processSection } from '@/lib/services/article-generation/section-processor'
import { analyzeSerpStructure } from '@/lib/services/dataforseo/serp-analysis'
import { createProgressTracker } from '@/lib/services/progress-tracking'
import type { Section } from '@/lib/services/article-generation/section-processor'

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
    // Log function invocation immediately
    console.log(`[Inngest] Function invoked - Event received:`, {
      eventName: event.name,
      eventId: event.id,
      articleId: event.data?.articleId,
      timestamp: new Date().toISOString(),
    })

    const { articleId } = event.data
    
    if (!articleId) {
      const errorMsg = 'Missing articleId in event data'
      console.error(`[Inngest] ERROR: ${errorMsg}`, { event })
      throw new Error(errorMsg)
    }

    const supabase = createServiceRoleClient()

    console.log(`[Inngest] Starting article generation for articleId: ${articleId}`)

    try {
      // Step 1: Load article and check if it's already in a terminal state
      const article = await step.run('load-article', async () => {
        console.log(`[Inngest] Step: load-article - Loading article ${articleId}`)
        const { data, error } = await supabase
          .from('articles' as any)
          .select('id, org_id, keyword, status')
          .eq('id', articleId)
          .single()

        if (error || !data) {
          const errorMsg = `Article ${articleId} not found: ${error?.message || 'Unknown error'}`
          console.error(`[Inngest] Step: load-article - ERROR: ${errorMsg}`)
          throw new Error(errorMsg)
        }

        // Type assertion after error check
        type ArticleData = {
          id: string
          org_id: string
          keyword: string
          status: string
        }
        const articleData = data as unknown as ArticleData

        // Check if article is already in a terminal state (failed, cancelled, completed)
        // This can happen if the article was manually marked as failed/cancelled
        // or if the function is retrying after the article was already processed
        const terminalStates = ['failed', 'cancelled', 'completed']
        if (terminalStates.includes(articleData.status)) {
          const msg = `Article ${articleId} is already in terminal state: ${articleData.status}. Skipping generation.`
          console.log(`[Inngest] Step: load-article - ${msg}`)
          return {
            ...articleData,
            skipped: true,
            reason: `Article already ${articleData.status}`
          }
        }

        // Update status to generating
        const { error: updateError } = await supabase
          .from('articles' as any)
          .update({
            status: 'generating',
            generation_started_at: new Date().toISOString()
          })
          .eq('id', articleId)

        if (updateError) {
          const errorMsg = `Failed to update article status: ${updateError.message}`
          console.error(`[Inngest] Step: load-article - ERROR: ${errorMsg}`)
          throw new Error(errorMsg)
        }

        console.log(`[Inngest] Step: load-article - Success: Article ${articleId} loaded, status updated to generating`)

        // Initialize progress tracking (will be updated after outline generation)
        const progressTracker = createProgressTracker(articleId, articleData.org_id, 1) // Temporary, will be updated after outline
        await progressTracker.initialize('Starting article generation...')

        console.log(`[Inngest] Step: load-article - Progress tracking initialized`)

        // Type assertion needed because database types haven't been regenerated after migration
        // We've already checked data exists above, so this is safe
        return (data as unknown) as { id: string; org_id: string; keyword: string; status: string; skipped?: boolean; reason?: string; progressTracker?: any }
      })

      // Early exit if article was skipped (already in terminal state)
      if ((article as any).skipped) {
        console.log(`[Inngest] Article generation skipped for articleId: ${articleId} - ${(article as any).reason}`)
        return { 
          success: true, 
          articleId, 
          skipped: true,
          reason: (article as any).reason
        }
      }

      // Step 2: Load keyword research data
      const keywordResearch = await step.run('load-keyword-research', async () => {
        console.log(`[Inngest] Step: load-keyword-research - Loading research for keyword: ${article.keyword}`)
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

        console.log(`[Inngest] Step: load-keyword-research - ${researchData ? 'Cache hit' : 'Cache miss'}`)
        return null // Cache miss - use keyword only
      })

      // Step 3: Generate SERP analysis
      const serpAnalysis = await step.run('generate-serp-analysis', async () => {
        console.log(`[Inngest] Step: generate-serp-analysis - Analyzing SERP for keyword: ${article.keyword}`)
        
        // Update progress to researching
        await (article as any).progressTracker?.updateResearching('Analyzing search results and competitor content...')
        
        try {
          const analysis = await analyzeSerpStructure(article.keyword, article.org_id)
          console.log(`[Inngest] Step: generate-serp-analysis - Success: SERP analysis completed`)
          return analysis
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`[Inngest] Step: generate-serp-analysis - ERROR: ${errorMsg}`)
          
          // Mark progress as failed
          await (article as any).progressTracker?.fail(`SERP analysis failed: ${errorMsg}`)
          throw error
        }
      })

      // Step 4: Generate outline
      const outline = await step.run('generate-outline', async () => {
        console.log(`[Inngest] Step: generate-outline - Generating outline for keyword: ${article.keyword}`)
        const startTime = Date.now()
        
        // Update progress to researching during outline generation
        await (article as any).progressTracker?.updateResearching('Generating article structure and outline...')
        
        try {
          const generatedOutline = await generateOutline(
            article.keyword,
            keywordResearch,
            serpAnalysis
          )

          const duration = Date.now() - startTime
          console.log(`[Inngest] Step: generate-outline - Success: Outline generated in ${duration}ms`)

          // Update progress tracker with correct total sections
          const totalSections = 1 + generatedOutline.h2_sections.length + 1 + (generatedOutline.faq?.included ? 1 : 0)
          console.log(`[Inngest] Step: generate-outline - Updating progress tracker with ${totalSections} total sections`)
          
          // Create new progress tracker with correct section count
          const newProgressTracker = createProgressTracker(articleId, article.org_id, totalSections)
          await newProgressTracker.initialize('Article structure generated, starting content creation...')
          
          // Update the article object to use the new progress tracker
          ;(article as any).progressTracker = newProgressTracker

          // Store outline in article record
          const { error: updateError } = await supabase
            .from('articles' as any)
            .update({
              outline: generatedOutline,
              outline_generation_duration_ms: duration
            })
            .eq('id', articleId)

          if (updateError) {
            const errorMsg = `Failed to store outline: ${updateError.message}`
            console.error(`[Inngest] Step: generate-outline - ERROR: ${errorMsg}`)
            
            // Mark progress as failed
            await (article as any).progressTracker?.fail(`Failed to store outline: ${errorMsg}`)
            throw new Error(errorMsg)
          }

          return generatedOutline
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          console.error(`[Inngest] Step: generate-outline - ERROR: ${errorMsg}`)
          
          // Mark progress as failed
          await (article as any).progressTracker?.fail(`Outline generation failed: ${errorMsg}`)
          throw error
        }
      })

      // Step 5: Process sections sequentially with retry logic
      const sectionStats = await step.run('process-sections', async () => {
        console.log(`[Inngest] Step: process-sections - Starting section processing for article ${articleId}`)
        
        try {
          const { data: articleData, error: fetchError } = await supabase
            .from('articles' as any)
            .select('outline')
            .eq('id', articleId)
            .single()

          if (fetchError) {
            throw new Error(`Failed to load article outline: ${fetchError.message}`)
          }

          // Type assertion needed because database types haven't been regenerated after migration
          const article = (articleData as unknown) as { outline?: any } | null
          if (!article?.outline) {
            throw new Error('Outline not found in article data')
          }

          const outline = article.outline as any
          const totalSections = 1 + outline.h2_sections.length + 1 + (outline.faq?.included ? 1 : 0)
          console.log(`[Inngest] Step: process-sections - Processing ${totalSections} sections total`)

          let currentSectionNumber = 1
          let totalWordCount = 0
          let totalCitations = 0
          let totalApiCost = 0

          // Process Introduction (index 0)
          console.log(`[Inngest] Step: process-sections - Processing Introduction (index 0)`)
          await (article as any).progressTracker?.updateWritingSection(currentSectionNumber, 'Writing Introduction...')
          
          try {
            const sectionResult = await retryWithBackoff(() => processSection(articleId, 0, outline)) as Section | null
            
            // Update metrics from section result
            if (sectionResult) {
              totalWordCount += sectionResult.word_count || 0
              totalCitations += sectionResult.citations_included || 0
              totalApiCost += 0 // API cost not tracked at section level
            }
            
            await (article as any).progressTracker?.completeSection(currentSectionNumber, sectionResult?.word_count || 0, sectionResult?.citations_included || 0, 0)
            console.log(`[Inngest] Step: process-sections - Introduction completed`)
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            await (article as any).progressTracker?.fail(`Introduction failed: ${errorMsg}`)
            throw error
          }
          currentSectionNumber++

          // Process H2 sections sequentially (one at a time)
          for (let h2Index = 1; h2Index <= outline.h2_sections.length; h2Index++) {
            console.log(`[Inngest] Step: process-sections - Processing H2 section ${h2Index}/${outline.h2_sections.length}`)
            
            // Update progress for this H2 section
            await (article as any).progressTracker?.updateWritingSection(currentSectionNumber, `Writing Section ${h2Index}: ${outline.h2_sections[h2Index - 1]?.title || 'H2 Section'}...`)
            
            try {
              const sectionResult = await retryWithBackoff(() => processSection(articleId, h2Index, outline)) as Section | null
              
              // Update metrics from section result
              if (sectionResult) {
                totalWordCount += sectionResult.word_count || 0
                totalCitations += sectionResult.citations_included || 0
                totalApiCost += 0 // API cost not tracked at section level
              }
              
              await (article as any).progressTracker?.completeSection(currentSectionNumber, sectionResult?.word_count || 0, sectionResult?.citations_included || 0, 0)
              console.log(`[Inngest] Step: process-sections - H2 section ${h2Index} completed`)
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error)
              await (article as any).progressTracker?.fail(`H2 section ${h2Index} failed: ${errorMsg}`)
              throw error
            }
            currentSectionNumber++

            // Process H3 subsections within this H2 section (decimal indices: 1.1, 1.2, etc.)
            const h2Section = outline.h2_sections[h2Index - 1]
            if (h2Section?.h3_subsections && Array.isArray(h2Section.h3_subsections)) {
              for (let h3Index = 1; h3Index <= h2Section.h3_subsections.length; h3Index++) {
                const sectionIndex = parseFloat(`${h2Index}.${h3Index}`)
                console.log(`[Inngest] Step: process-sections - Processing H3 subsection ${sectionIndex}`)
                
                try {
                  const h3Result = await retryWithBackoff(() => processSection(articleId, sectionIndex, outline)) as Section | null
                  
                  // Update metrics from H3 result
                  if (h3Result) {
                    totalWordCount += h3Result.word_count || 0
                    totalCitations += h3Result.citations_included || 0
                    totalApiCost += 0 // API cost not tracked at section level
                  }
                  
                  console.log(`[Inngest] Step: process-sections - H3 subsection ${sectionIndex} completed`)
                } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : String(error)
                  await (article as any).progressTracker?.fail(`H3 subsection ${sectionIndex} failed: ${errorMsg}`)
                  throw error
                }
              }
            }
          }

          // Process Conclusion (index N+1, where N = number of H2 sections)
          const conclusionIndex = outline.h2_sections.length + 1
          console.log(`[Inngest] Step: process-sections - Processing Conclusion (index ${conclusionIndex})`)
          
          await (article as any).progressTracker?.updateWritingSection(currentSectionNumber, 'Writing Conclusion...')
          
          try {
            const conclusionResult = await retryWithBackoff(() => processSection(articleId, conclusionIndex, outline)) as Section | null
            
            if (conclusionResult) {
              totalWordCount += conclusionResult.word_count || 0
              totalCitations += conclusionResult.citations_included || 0
              totalApiCost += 0 // API cost not tracked at section level
            }
            
            await (article as any).progressTracker?.completeSection(currentSectionNumber, conclusionResult?.word_count || 0, conclusionResult?.citations_included || 0, 0)
            console.log(`[Inngest] Step: process-sections - Conclusion completed`)
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            await (article as any).progressTracker?.fail(`Conclusion failed: ${errorMsg}`)
            throw error
          }
          currentSectionNumber++

          // Process FAQ if included (index N+2)
          if (outline.faq?.included) {
            const faqIndex = outline.h2_sections.length + 2
            console.log(`[Inngest] Step: process-sections - Processing FAQ (index ${faqIndex})`)
            
            await (article as any).progressTracker?.updateWritingSection(currentSectionNumber, 'Writing FAQ...')
            
            try {
              const faqResult = await retryWithBackoff(() => processSection(articleId, faqIndex, outline)) as Section | null
              
              if (faqResult) {
                totalWordCount += faqResult.word_count || 0
                totalCitations += faqResult.citations_included || 0
                totalApiCost += 0 // API cost not tracked at section level
              }
              
              await (article as any).progressTracker?.completeSection(currentSectionNumber, faqResult?.word_count || 0, faqResult?.citations_included || 0, 0)
              console.log(`[Inngest] Step: process-sections - FAQ completed`)
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error)
              await (article as any).progressTracker?.fail(`FAQ failed: ${errorMsg}`)
              throw error
            }
          }

          console.log(`[Inngest] Step: process-sections - All sections processed successfully`)
          
          // Return the accumulated statistics for the next step
          return {
            totalWordCount,
            totalCitations,
            totalApiCost
          };
        } catch (error) {
          // Ensure we update status even if timeout occurs mid-processing
          const isTimeout = error instanceof Error && 
            (error.message.includes('timeout') || error.message.includes('TIMEOUT'))
          
          if (isTimeout) {
            console.error(`[Inngest] Step: process-sections - TIMEOUT ERROR: ${error instanceof Error ? error.message : String(error)}`)
            await supabase
              .from('articles' as any)
              .update({
                status: 'failed',
                error_details: {
                  error_message: `Timeout during section processing: ${error instanceof Error ? error.message : String(error)}`,
                  failed_at: new Date().toISOString(),
                  timeout: true
                }
              })
              .eq('id', articleId)
          }
          throw error
        }
      })

      // Step 6: Update article status to completed
      await step.run('complete-article', async () => {
        console.log(`[Inngest] Step: complete-article - Marking article ${articleId} as completed`)
        
        // Mark progress as completed with final statistics
        await (article as any).progressTracker?.complete({
          wordCount: sectionStats.totalWordCount,
          citations: sectionStats.totalCitations,
          apiCost: sectionStats.totalApiCost
        })
        
        const { error: updateError } = await supabase
          .from('articles' as any)
          .update({
            status: 'completed',
            generation_completed_at: new Date().toISOString()
          })
          .eq('id', articleId)

        if (updateError) {
          const errorMsg = `Failed to mark article as completed: ${updateError.message}`
          console.error(`[Inngest] Step: complete-article - ERROR: ${errorMsg}`)
          throw new Error(errorMsg)
        }

        console.log(`[Inngest] Step: complete-article - Success: Article ${articleId} marked as completed`)
        console.log(`[Inngest] Step: complete-article - Final stats: ${sectionStats.totalWordCount} words, ${sectionStats.totalCitations} citations, $${sectionStats.totalApiCost.toFixed(2)} cost`)
      })

      console.log(`[Inngest] Article generation completed successfully for articleId: ${articleId}`)
      return { success: true, articleId }
    } catch (error) {
      // Handle errors: save partial article and update status
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[Inngest] Article generation FAILED for articleId: ${articleId}`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Check if this is a timeout error
      const isTimeout = errorMessage.includes('timeout') || 
                       errorMessage.includes('TIMEOUT') ||
                       errorMessage.includes('Function invocation timeout') ||
                       errorMessage.includes('FUNCTION_INVOCATION_TIMEOUT')
      
      await step.run('handle-error', async () => {
        console.log(`[Inngest] Step: handle-error - Handling error for article ${articleId}, isTimeout: ${isTimeout}`)
        // Get current sections to preserve partial article
        const { data: articleData } = await supabase
          .from('articles' as any)
          .select('sections, current_section_index')
          .eq('id', articleId)
          .single()

        // Type assertion needed because database types haven't been regenerated after migration
        const article = (articleData as unknown) as { sections?: any[]; current_section_index?: number } | null

        const { error: updateError } = await supabase
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

        if (updateError) {
          console.error(`[Inngest] Step: handle-error - Failed to update article status: ${updateError.message}`)
        } else {
          console.log(`[Inngest] Step: handle-error - Success: Article ${articleId} marked as failed`)
        }

        // NOTE: User notification is handled by Story 4a-6 (real-time progress tracking)
        // The article status update to "failed" will trigger real-time updates to the user
        // via WebSocket/SSE connections established in Story 4a-6
      })

      throw error
    }
  }
)

