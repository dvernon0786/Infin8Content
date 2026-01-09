// Section processing service for article generation
// Story 4a.2: Section-by-Section Architecture and Outline Generation
// Story 4a.3: Real-Time Research Per Section (Tavily Integration)

import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'
import { summarizeSections, fitInContextWindow, estimateTokens } from '@/lib/utils/token-management'
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'
import { validateContentQuality, countCitations } from '@/lib/utils/content-quality'
import { formatCitationsForMarkdown } from '@/lib/utils/citation-formatter'
import { 
  performBatchResearch, 
  getSectionResearchSources, 
  clearResearchCache,
  type ArticleResearchCache 
} from './research-optimizer'
import { 
  buildOptimizedContext, 
  batchUpdateSections, 
  clearContextCache,
  getContextStats 
} from './context-manager'
import { type TavilySource } from '@/lib/services/tavily/tavily-client'

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

  // Load article to get previous sections, organization ID, and user preferences
  const { data: articleData } = await supabase
    .from('articles' as any)
    .select('sections, keyword, org_id, writing_style, target_audience, custom_instructions')
    .eq('id', articleId)
    .single()

  if (!articleData) {
    throw new Error(`Article ${articleId} not found`)
  }

  // Type assertion needed because database types haven't been regenerated after migration
  const article = (articleData as unknown) as { 
    sections?: any[]; 
    keyword: string; 
    org_id: string;
    writing_style?: string;
    target_audience?: string;
    custom_instructions?: string;
  }
  const previousSections = (article.sections || []) as Section[]
  const organizationId = article.org_id

  // Determine section type and details based on index
  const sectionInfo = getSectionInfo(sectionIndex, outline)
  
  // Build optimized context using context manager (Performance Optimization)
  const optimizedContext = buildOptimizedContext(
    articleId,
    sectionIndex,
    previousSections,
    getTargetWordCount(sectionInfo.type)
  )

  // Perform research using batch optimizer (Story 4a-12 Performance Optimization)
  let researchSources: TavilySource[] = []
  let researchQueryUsed = ''
  let researchFailed = false

  try {
    // Get section-specific research from batch optimizer
    researchSources = getSectionResearchSources(articleId, sectionInfo.title)
    researchQueryUsed = `Batch research for ${sectionInfo.title}`
    
    if (researchSources.length === 0) {
      console.warn(`[SectionProcessor] No research sources found for section: ${sectionInfo.title}`)
      researchFailed = true
    } else {
      console.log(`[SectionProcessor] Using ${researchSources.length} cached sources for section: ${sectionInfo.title}`)
    }
  } catch (error) {
    // Graceful degradation: Continue without research
    console.warn(`[SectionProcessor] Research retrieval failed: ${error instanceof Error ? error.message : String(error)}`)
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
      optimizedContext,
      researchSources, // Pass research sources for citation inclusion
      organizationId,
      article.writing_style || 'Professional',
      article.target_audience || 'General',
      article.custom_instructions || undefined
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

  // Quality validation with optimized retry (1 retry instead of 2 for performance)
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

  // Regenerate if quality fails (1 retry for performance optimization)
  if (!qualityResult.passed && qualityRetryCount < 1) {
    qualityRetryCount++
    console.warn(`Section ${sectionIndex} quality check failed on final content, regenerating (attempt ${qualityRetryCount}):`, qualityResult.errors)
    
    try {
      // Regenerate with same parameters
      generationResult = await generateSectionContent(
        article.keyword as string,
        sectionInfo,
        optimizedContext,
        researchSources,
        organizationId,
        article.writing_style || 'Professional',
        article.target_audience || 'General',
        article.custom_instructions || undefined
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

  // Update article with new section using batch optimization
  const updatedSections = [...previousSections, section]
  
  // Use batch update for better performance (only update database every few sections)
  if (updatedSections.length % 3 === 0 || sectionIndex >= 10) {
    // Batch update every 3 sections or for later sections
    await batchUpdateSections(articleId, updatedSections)
  } else {
    // Individual update for early sections (progress tracking is more important)
    await supabase
      .from('articles' as any)
      .update({
        sections: updatedSections,
        current_section_index: sectionIndex
      })
      .eq('id', articleId)
  }

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
  optimizedContext: string,
  researchSources: TavilySource[] = [],
  organizationId: string,
  writingStyle: string = 'Professional',
  targetAudience: string = 'General',
  customInstructions?: string
): Promise<{
  content: string
  tokensUsed: number
  modelUsed: string
  promptTokens: number
  completionTokens: number
}> {
  // Determine target word count based on section type
  const targetWordCount = getTargetWordCount(sectionInfo.type)
  
  // Construct comprehensive prompt with all user preferences (Performance Optimization)
  const systemMessage = `You are an expert SEO content writer creating a section for a long-form article.
Write engaging, informative content that naturally incorporates citations and optimizes for SEO.
Use proper heading structure (H2, H3) and maintain a ${writingStyle.toLowerCase()} yet conversational tone.
Target audience: ${targetAudience.toLowerCase()}
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}`

  // Format research sources for prompt
  const researchSourcesText = researchSources
    .slice(0, 10) // Use top 10 sources
    .map((source, index) => {
      return `${index + 1}. [${source.title}](${source.url})${source.excerpt ? `: ${source.excerpt.slice(0, 200)}` : ''}`
    })
    .join('\n')

  // Build user message with all context using optimized context manager and enhanced prompts
  // NOTE: SERP analysis insights are not included (Story 4a-4 is optional and not implemented)
  
  // Add section-specific guidance
  const sectionGuidance = getSectionSpecificGuidance(sectionInfo.type, sectionInfo.title, keyword)
  
  const userMessageParts = [
    `Section: ${sectionInfo.title}`,
    `Type: ${sectionInfo.type}`,
    `Target Word Count: ${targetWordCount} words`,
    '',
    'Section-Specific Guidance:',
    sectionGuidance,
    '',
    'Research Sources:',
    researchSourcesText || 'No research sources available.',
    '',
    'Keyword Focus:',
    `- Primary keyword: ${keyword}`,
    '- SEO Requirements: Include keyword naturally, avoid keyword stuffing',
    '',
    'Context from Previous Sections:',
    optimizedContext || 'This is the first section.',
    '',
    `Writing Style: ${writingStyle}`,
    `Target Audience: ${targetAudience}`,
    ...(customInstructions ? ['', 'Custom Instructions:', customInstructions] : []),
    '',
    'Quality Requirements:',
    '- Include 2-4 natural citations from research sources',
    '- Use proper markdown formatting (H2/H3 headings)',
    '- Maintain coherence with previous sections',
    '- Write in complete, well-structured sentences',
    '',
    `Generate ${targetWordCount} words of engaging, informative content for this section.`
  ]

  const userMessage = userMessageParts.join('\n')

  // Check token limits
  const promptTokens = estimateTokens(systemMessage + userMessage)
  const researchTokens = estimateTokens(researchSourcesText)
  const contextTokens = estimateTokens(optimizedContext)
  const totalPromptTokens = promptTokens + researchTokens + contextTokens

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
 * Get section-specific guidance for better content generation
 */
function getSectionSpecificGuidance(sectionType: string, sectionTitle: string, keyword: string): string {
  switch (sectionType) {
    case 'introduction':
      return `Write a compelling introduction that:
- Hooks the reader immediately with an interesting fact or question about ${keyword}
- Clearly states what this article will cover
- Sets up the structure for the upcoming sections
- Is approximately 300 words and engaging`

    case 'conclusion':
      return `Write a strong conclusion that:
- Summarizes the key points covered in this article about ${keyword}
- Provides actionable takeaways for the reader
- Ends with a memorable final thought or call to action
- Is approximately 400 words and impactful`

    case 'faq':
      return `Write a helpful FAQ section that:
- Anticipates common questions about ${keyword}
- Provides clear, concise answers (2-3 sentences each)
- Covers practical concerns and "how-to" aspects
- Is approximately 500 words total with 5-7 Q&A pairs`

    case 'h2':
      return `Write a comprehensive H2 section that:
- Thoroughly covers ${sectionTitle} with depth and expertise
- Includes relevant examples, data, or case studies
- Uses subheadings (H3) to break up complex topics
- Is approximately 600 words and highly informative`

    case 'h3':
      return `Write a focused H3 subsection that:
- Expands on a specific aspect of ${sectionTitle}
- Provides detailed information and practical insights
- Connects logically to the parent H2 section
- Is approximately 400 words and targeted`

    default:
      return `Write a high-quality section about ${sectionTitle} that:
- Provides valuable, accurate information
- Maintains reader engagement throughout
- Supports the overall article structure
- Meets the target word count requirements`
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

