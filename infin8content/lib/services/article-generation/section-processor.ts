// Section processing service for article generation
// Story 4a.2: Section-by-Section Architecture and Outline Generation
// Story 4a.3: Real-Time Research Per Section (Tavily Integration)

import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'
import { summarizeSections, fitInContextWindow, estimateTokens } from '@/lib/utils/token-management'
import { researchQuery, type TavilySource } from '@/lib/services/tavily/tavily-client'
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'
import { validateContentQuality, countCitations } from '@/lib/utils/content-quality'
import { formatCitationsForMarkdown } from '@/lib/utils/citation-formatter'

/**
 * Section structure matching database schema
 */
export interface Section {
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  section_index: number
  h2_index?: number
  h3_index?: number
  title: string
  content: string
  word_count: number
  generated_at: string
  research_sources?: Array<{
    title: string
    url: string
    excerpt?: string
    published_date?: string | null
    author?: string | null
    relevance_score?: number
  }>
  citations_included?: number
  research_query?: string
  tokens_used?: number
  model_used?: string
  quality_metrics?: {
    word_count: number
    citations_included: number
    readability_score?: number
    keyword_density?: number
    quality_passed: boolean
    quality_retry_count: number
  }
}

/**
 * Process a single section of an article
 * 
 * @param articleId - Article ID
 * @param sectionIndex - Current section index
 * @param outline - Article outline
 * @returns Generated section
 */
export async function processSection(
  articleId: string,
  sectionIndex: number,
  outline: Outline
): Promise<Section> {
  const supabase = createServiceRoleClient()

  // Load article to get previous sections and organization ID
  const { data: articleData } = await supabase
    .from('articles' as any)
    .select('sections, keyword, org_id')
    .eq('id', articleId)
    .single()

  if (!articleData) {
    throw new Error(`Article ${articleId} not found`)
  }

  // Type assertion needed because database types haven't been regenerated after migration
  const article = (articleData as unknown) as { sections?: any[]; keyword: string; org_id: string }
  const previousSections = (article.sections || []) as Section[]
  const organizationId = article.org_id

  // Determine section type and details based on index
  const sectionInfo = getSectionInfo(sectionIndex, outline)
  
  // Summarize previous sections for context (token management)
  const summaries = summarizeSections(previousSections, 1500) // ~1500 tokens for summaries

  // Perform Tavily research for this section (Story 4a.3)
  let researchSources: TavilySource[] = []
  let researchQueryUsed = ''
  let researchFailed = false

  try {
    // Generate research query from section topic + keyword + previous sections
    researchQueryUsed = generateResearchQuery(
      sectionInfo.title,
      article.keyword as string,
      summaries
    )

    // Normalize query for cache lookup
    const normalizedQuery = normalizeQuery(researchQueryUsed)

    // Check cache first
    const cachedResults = await getCachedResearch(organizationId, normalizedQuery)
    
    if (cachedResults) {
      researchSources = cachedResults
    } else {
      // Call Tavily API
      researchSources = await researchQuery(researchQueryUsed, { maxRetries: 3 })
      
      // Store in cache (24-hour TTL)
      await storeCachedResearch(organizationId, normalizedQuery, researchSources)
      
      // Track API cost
      await trackApiCost(organizationId, 0.08)
    }
  } catch (error) {
    // Graceful degradation: Continue without fresh research
    console.warn(`Section generated without fresh Tavily research: ${error instanceof Error ? error.message : String(error)}`)
    researchFailed = true
    
    // Update article error_details with research failure
    await updateArticleErrorDetails(articleId, sectionIndex, researchQueryUsed, error)
  }

  // Generate section content using OpenRouter API (Story 4a-5)
  // With quality validation and citation integration
  let generationResult
  let generationFailed = false
  let generationError: unknown = null

  try {
    generationResult = await generateSectionContent(
      article.keyword as string,
      sectionInfo,
      summaries,
      researchSources, // Pass research sources for citation inclusion
      organizationId
    )
  } catch (error) {
    // Generation failed - update error details and continue
    generationFailed = true
    generationError = error
    console.error(`Section ${sectionIndex} generation failed:`, error)
    
    await updateArticleGenerationErrorDetails(
      articleId,
      sectionIndex,
      error
    )
    
    // Throw error to stop processing (user can retry failed section)
    throw new Error(`Content generation failed for section ${sectionIndex}: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Integrate citations naturally into content (Task 4)
  // NOTE: Citations are integrated BEFORE quality validation so metrics reflect final content
  let contentWithCitations = formatCitationsForMarkdown(
    generationResult.content,
    researchSources,
    1, // minCitations
    3  // maxCitations
  )

  // Quality validation with retry (2 retries if quality fails)
  // IMPORTANT: Validate on content WITH citations to ensure metrics are accurate
  let qualityRetryCount = 0
  const targetWordCount = getTargetWordCount(sectionInfo.type)
  let qualityResult = validateContentQuality(
    contentWithCitations, // Validate final content with citations
    targetWordCount,
    article.keyword as string,
    sectionInfo.type,
    qualityRetryCount
  )

  // Regenerate if quality fails (2 retries for better success rate)
  if (!qualityResult.passed && qualityRetryCount < 2) {
    qualityRetryCount++
    console.warn(`Section ${sectionIndex} quality check failed on final content, regenerating (attempt ${qualityRetryCount}):`, qualityResult.errors)
    
    try {
      // Regenerate with same parameters
      generationResult = await generateSectionContent(
        article.keyword as string,
        sectionInfo,
        summaries,
        researchSources,
        organizationId
      )
      
      // Re-integrate citations
      contentWithCitations = formatCitationsForMarkdown(
        generationResult.content,
        researchSources,
        1, // minCitations
        3  // maxCitations
      )
      
      // Re-validate on content WITH citations
      qualityResult = validateContentQuality(
        contentWithCitations, // Validate final content with citations
        targetWordCount,
        article.keyword as string,
        sectionInfo.type,
        qualityRetryCount
      )
    } catch (error) {
      // Quality retry also failed
      generationFailed = true
      generationError = error
      await updateArticleGenerationErrorDetails(
        articleId,
        sectionIndex,
        error
      )
      throw new Error(`Content generation failed after quality retry for section ${sectionIndex}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Count actual citations in final content
  const finalCitationsCount = countCitations(contentWithCitations)

  const section: Section = {
    section_type: sectionInfo.type,
    section_index: sectionIndex,
    h2_index: sectionInfo.h2Index,
    h3_index: sectionInfo.h3Index,
    title: sectionInfo.title,
    content: contentWithCitations, // Content with citations integrated
    word_count: contentWithCitations.split(/\s+/).filter(w => w.length > 0).length,
    generated_at: new Date().toISOString(),
    research_sources: researchSources.map(source => ({
      title: source.title,
      url: source.url,
      excerpt: source.excerpt,
      published_date: source.published_date,
      author: source.author,
      relevance_score: source.relevance_score
    })),
    citations_included: finalCitationsCount,
    research_query: researchQueryUsed,
    tokens_used: generationResult.tokensUsed,
    model_used: generationResult.modelUsed,
    quality_metrics: qualityResult.metrics
  }

  // Update article with new section
  const updatedSections = [...previousSections, section]
  
  await supabase
    .from('articles' as any)
    .update({
      sections: updatedSections,
      current_section_index: sectionIndex
    })
    .eq('id', articleId)

  return section
}

/**
 * Get section information based on index and outline
 */
function getSectionInfo(
  sectionIndex: number,
  outline: Outline
): {
  type: Section['section_type']
  title: string
  h2Index?: number
  h3Index?: number
} {
  // Introduction: index 0
  if (sectionIndex === 0) {
    return {
      type: 'introduction',
      title: outline.introduction.title
    }
  }

  // H2 sections: indices 1 to N (where N = number of H2 sections)
  const h2Count = outline.h2_sections.length
  if (sectionIndex >= 1 && sectionIndex <= h2Count && Number.isInteger(sectionIndex)) {
    const h2Index = sectionIndex
    const h2Section = outline.h2_sections[h2Index - 1]
    
    return {
      type: 'h2',
      title: h2Section.title,
      h2Index
    }
  }

  // H3 subsections: decimal indices (e.g., 1.1, 1.2, 2.1, etc.)
  // Check if sectionIndex is a decimal (has fractional part)
  if (!Number.isInteger(sectionIndex) && sectionIndex > 1 && sectionIndex < h2Count + 1) {
    const h2Index = Math.floor(sectionIndex)
    const h3Index = Math.round((sectionIndex - h2Index) * 10) // Extract decimal part
    
    if (h2Index >= 1 && h2Index <= h2Count) {
      const h2Section = outline.h2_sections[h2Index - 1]
      const h3Subsection = h2Section?.h3_subsections?.[h3Index - 1]
      
      if (h3Subsection) {
        return {
          type: 'h3',
          title: h3Subsection,
          h2Index,
          h3Index
        }
      }
    }
  }

  // Conclusion: index N+1
  const conclusionIndex = h2Count + 1
  if (sectionIndex === conclusionIndex) {
    return {
      type: 'conclusion',
      title: outline.conclusion.title
    }
  }

  // FAQ: index N+2 (if included)
  if (outline.faq?.included) {
    const faqIndex = h2Count + 2
    if (sectionIndex === faqIndex) {
      return {
        type: 'faq',
        title: outline.faq.title
      }
    }
  }

  throw new Error(`Invalid section index: ${sectionIndex}`)
}

/**
 * Normalize research query for cache lookup
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Generate research query from section topic + keyword + previous sections
 */
function generateResearchQuery(
  sectionTitle: string,
  keyword: string,
  previousSummaries: string
): string {
  // Combine components into natural language query
  // Keep concise (50-100 chars) for better API results
  const year = new Date().getFullYear()
  
  // Extract key terms from previous sections for coherence (AC requirement)
  // Take first 20-30 chars of summaries to include context without bloating query
  const summaryContext = previousSummaries
    ? previousSummaries
        .split(/\s+/)
        .slice(0, 5) // Take first 5 words from summaries
        .join(' ')
    : ''
  
  // Build query with section topic, keyword, year, and previous context
  let query = `${sectionTitle} ${keyword} ${year}`
  
  // Add summary context if available (for coherence between sections)
  if (summaryContext) {
    query += ` ${summaryContext}`
  }
  
  query += ' best practices latest'
  
  // Truncate to ~100 characters if needed
  return query.length > 100 ? query.substring(0, 100).trim() : query
}

/**
 * Get cached research results if available and not expired
 */
async function getCachedResearch(
  organizationId: string,
  normalizedQuery: string
): Promise<TavilySource[] | null> {
  const supabase = createServiceRoleClient()
  
  // Use ilike for case-insensitive matching to match the LOWER() index
  // Since normalizedQuery is already lowercase, this ensures optimal index usage
  const { data, error } = await (supabase
    .from('tavily_research_cache' as any)
    .select('research_results')
    .eq('organization_id', organizationId)
    .ilike('research_query', normalizedQuery) // Case-insensitive match to use LOWER() index
    .gt('cached_until', new Date().toISOString())
    .maybeSingle() as unknown as Promise<{ data: any; error: any }>)

  if (error || !data) {
    return null
  }

  // Parse cached results and convert to TavilySource format
  const results = data.research_results?.results || []
  return results.map((result: any) => ({
    title: result.title || '',
    url: result.url || '',
    excerpt: result.content || '',
    published_date: result.published_date || null,
    author: result.author || null,
    relevance_score: result.score || 0
  }))
}

/**
 * Store research results in cache with 24-hour TTL
 */
async function storeCachedResearch(
  organizationId: string,
  normalizedQuery: string,
  sources: TavilySource[]
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  // Convert sources back to Tavily API response format for storage
  const researchResults = {
    query: normalizedQuery,
    results: sources.map(source => ({
      title: source.title,
      url: source.url,
      content: source.excerpt,
      score: source.relevance_score,
      published_date: source.published_date,
      author: source.author
    })),
    response_time: 0 // Not stored in cache
  }

  const cachedUntil = new Date()
  cachedUntil.setHours(cachedUntil.getHours() + 24) // 24-hour TTL

  try {
    const { error } = await (supabase
      .from('tavily_research_cache' as any)
      .upsert({
        organization_id: organizationId,
        research_query: normalizedQuery,
        research_results: researchResults,
        cached_until: cachedUntil.toISOString()
      }, {
        onConflict: 'organization_id,research_query',
        ignoreDuplicates: false
      }) as unknown as Promise<{ error: any }>)

    if (error) {
      // If upsert fails due to constraint issues (42P10), try a fallback approach
      if (error.code === '42P10' || error.message?.includes('no unique or exclusion constraint')) {
        // Fallback: Delete existing and insert new (manual upsert)
        await supabase
          .from('tavily_research_cache' as any)
          .delete()
          .eq('organization_id', organizationId)
          .eq('research_query', normalizedQuery)
        
        const { error: insertError } = await supabase
          .from('tavily_research_cache' as any)
          .insert({
            organization_id: organizationId,
            research_query: normalizedQuery,
            research_results: researchResults,
            cached_until: cachedUntil.toISOString()
          })
        
        if (insertError) {
          console.error('Failed to store Tavily research cache (fallback insert):', insertError)
        }
      } else {
        console.error('Failed to store Tavily research cache:', error)
      }
    }
  } catch (error) {
    console.error('Failed to store Tavily research cache:', error)
    // Don't throw - cache storage failure shouldn't block article generation
  }
}

/**
 * Track API cost for Tavily research
 */
async function trackApiCost(organizationId: string, cost: number): Promise<void> {
  const supabase = createServiceRoleClient()
  
  const { error } = await (supabase
    .from('api_costs' as any)
    .insert({
      organization_id: organizationId,
      service: 'tavily',
      operation: 'section_research',
      cost: cost
    }) as unknown as Promise<{ error: any }>)

  if (error) {
    console.error('Failed to track Tavily API cost:', error)
    // Don't throw - cost tracking failure shouldn't block article generation
  }
}

/**
 * Update article error_details with research failure information
 */
async function updateArticleErrorDetails(
  articleId: string,
  sectionIndex: number,
  researchQuery: string,
  error: unknown
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  // Load current error_details
  const { data: articleData } = await supabase
    .from('articles' as any)
    .select('error_details')
    .eq('id', articleId)
    .single()

  const currentErrorDetails = (articleData as any)?.error_details || {}
  const researchFailures = currentErrorDetails.research_failures || []
  
  researchFailures.push({
    section_index: sectionIndex,
    research_query: researchQuery,
    error_type: error instanceof Error ? error.constructor.name : 'Unknown',
    error_message: error instanceof Error ? error.message : String(error),
    retry_attempts: 3,
    failed_at: new Date().toISOString()
  })

  await supabase
    .from('articles' as any)
    .update({
      error_details: {
        ...currentErrorDetails,
        research_failures: researchFailures
      }
    })
    .eq('id', articleId)
}

/**
 * Update article error_details with content generation failure information
 */
async function updateArticleGenerationErrorDetails(
  articleId: string,
  sectionIndex: number,
  error: unknown
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  // Load current error_details
  const { data: articleData } = await supabase
    .from('articles' as any)
    .select('error_details')
    .eq('id', articleId)
    .single()

  const currentErrorDetails = (articleData as any)?.error_details || {}
  const generationFailures = currentErrorDetails.generation_failures || []
  
  generationFailures.push({
    section_index: sectionIndex,
    error_type: error instanceof Error ? error.constructor.name : 'Unknown',
    error_message: error instanceof Error ? error.message : String(error),
    retry_attempts: 3,
    failed_at: new Date().toISOString()
  })

  await supabase
    .from('articles' as any)
    .update({
      error_details: {
        ...currentErrorDetails,
        generation_failures: generationFailures
      }
    })
    .eq('id', articleId)
}

/**
 * Generate section content using OpenRouter API
 * Story 4a-5: LLM Content Generation with OpenRouter Integration
 */
async function generateSectionContent(
  keyword: string,
  sectionInfo: { type: string; title: string },
  previousSummaries: string,
  researchSources: TavilySource[] = [],
  organizationId: string
): Promise<{
  content: string
  tokensUsed: number
  modelUsed: string
  promptTokens: number
  completionTokens: number
}> {
  // Determine target word count based on section type
  const targetWordCount = getTargetWordCount(sectionInfo.type)
  
  // Construct comprehensive prompt
  const systemMessage = `You are an expert SEO content writer creating a section for a long-form article.
Write engaging, informative content that naturally incorporates citations and optimizes for SEO.
Use proper heading structure (H2, H3) and maintain a professional yet conversational tone.`

  // Format research sources for prompt
  const researchSourcesText = researchSources
    .slice(0, 10) // Use top 10 sources
    .map((source, index) => {
      return `${index + 1}. [${source.title}](${source.url})${source.excerpt ? `: ${source.excerpt.slice(0, 200)}` : ''}`
    })
    .join('\n')

  // Build user message with all context
  // NOTE: SERP analysis insights are not included (Story 4a-4 is optional and not implemented)
  const userMessageParts = [
    `Section: ${sectionInfo.title}`,
    `Type: ${sectionInfo.type}`,
    `Target Word Count: ${targetWordCount} words`,
    '',
    'Research Sources:',
    researchSourcesText || 'No research sources available.',
    '',
    'Keyword Focus:',
    `- Primary keyword: ${keyword}`,
    '- SEO Requirements: Include keyword naturally, avoid keyword stuffing',
    '',
    'Previous Sections Summary:',
    previousSummaries || 'This is the first section.',
    '',
    'Writing Style: Professional, Conversational',
    'Target Audience: General audience interested in SEO-optimized content',
    '',
    `Generate content with proper markdown formatting (H2/H3 headings) and integrate citations naturally within the content, not all at the end. Aim for ${targetWordCount} words.`
  ]

  const userMessage = userMessageParts.join('\n')

  // Check token limits
  const promptTokens = estimateTokens(systemMessage + userMessage)
  const researchTokens = estimateTokens(researchSourcesText)
  const summariesTokens = estimateTokens(previousSummaries)
  const totalPromptTokens = promptTokens + researchTokens + summariesTokens

  // Calculate max tokens for response (leave room for prompt)
  // Free models typically have 8k-32k context windows, use 6k as safe limit
  const maxResponseTokens = Math.min(2000, 6000 - totalPromptTokens - 500) // 500 buffer

  if (maxResponseTokens < 500) {
    throw new Error(`Prompt too long: ${totalPromptTokens} tokens exceeds context window`)
  }

  // Call OpenRouter API
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ]

  const result = await generateContent(messages, {
    maxTokens: maxResponseTokens,
    temperature: 0.7,
    maxRetries: 3,
    model: 'google/gemini-2.5-flash' // Explicitly use Gemini 2.5 Flash for better quality
  })

  // Track API cost (free models = $0.00)
  await trackOpenRouterApiCost(organizationId, 0.00)

  return {
    content: result.content,
    tokensUsed: result.tokensUsed,
    modelUsed: result.modelUsed,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens
  }
}

/**
 * Get target word count based on section type
 */
function getTargetWordCount(sectionType: string): number {
  switch (sectionType) {
    case 'introduction':
      return 300
    case 'h2':
      return 600
    case 'h3':
      return 400
    case 'conclusion':
      return 400
    case 'faq':
      return 500
    default:
      return 500
  }
}

// Export for use in generateSectionContent
export { getTargetWordCount }

/**
 * Track OpenRouter API cost per section
 */
async function trackOpenRouterApiCost(organizationId: string, cost: number): Promise<void> {
  const supabase = createServiceRoleClient()
  
  const { error } = await (supabase
    .from('api_costs' as any)
    .insert({
      organization_id: organizationId,
      service: 'openrouter',
      operation: 'section_generation',
      cost: cost
    }) as unknown as Promise<{ error: any }>)

  if (error) {
    console.error('Failed to track OpenRouter API cost:', error)
    // Don't throw - cost tracking failure shouldn't block article generation
  }
}

/**
 * Process all sections sequentially according to outline
 * 
 * NOTE: This function is kept for potential future use, but the Inngest worker
 * (generate-article.ts) implements its own section processing loop for better
 * control over retry logic and error handling per section.
 * 
 * If you need to process sections outside of the Inngest worker context,
 * you can use this function.
 */
export async function processAllSections(
  articleId: string,
  outline: Outline
): Promise<Section[]> {
  const sections: Section[] = []
  
  // Process Introduction (index 0)
  sections.push(await processSection(articleId, 0, outline))

  // Process H2 sections sequentially (one at a time)
  for (let h2Index = 1; h2Index <= outline.h2_sections.length; h2Index++) {
    // Process H2 section
    sections.push(await processSection(articleId, h2Index, outline))

    // Process H3 subsections within this H2 section (decimal indices: 1.1, 1.2, etc.)
    const h2Section = outline.h2_sections[h2Index - 1]
    if (h2Section?.h3_subsections && Array.isArray(h2Section.h3_subsections)) {
      for (let h3Index = 1; h3Index <= h2Section.h3_subsections.length; h3Index++) {
        const sectionIndex = parseFloat(`${h2Index}.${h3Index}`)
        sections.push(await processSection(articleId, sectionIndex, outline))
      }
    }
  }

  // Process Conclusion
  const conclusionIndex = outline.h2_sections.length + 1
  sections.push(await processSection(articleId, conclusionIndex, outline))

  // Process FAQ (if included)
  if (outline.faq?.included) {
    const faqIndex = outline.h2_sections.length + 2
    sections.push(await processSection(articleId, faqIndex, outline))
  }

  return sections
}

