// Section processing service for article generation
// Story 4a.2: Section-by-Section Architecture and Outline Generation
// Story 4a.3: Real-Time Research Per Section (Tavily Integration)
// Story 4a.12: Performance Optimization with Enhanced SEO Prompts

import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'
import { summarizeSections, fitInContextWindow, estimateTokens } from '@/lib/utils/token-management'
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'
import { validateContentQuality, countCitations } from '@/lib/utils/content-quality'
import { formatCitationsForMarkdown } from '@/lib/utils/citation-formatter'
import { researchQuery, type TavilySource } from '@/lib/services/tavily/tavily-client'
import { 
  buildOptimizedContext, 
  batchUpdateSections, 
  clearContextCache,
  getContextStats 
} from './context-manager'

// Enhanced SEO Helper Functions
function calculateTargetDensity(wordCount: number): number {
  // Aim for 0.5-1.5% density
  const minDensity = Math.ceil(wordCount * 0.005)
  const maxDensity = Math.floor(wordCount * 0.015)
  return Math.floor((minDensity + maxDensity) / 2)
}

function generateSemanticKeywords(primaryKeyword: string): string {
  // Extract root concepts and generate variations
  const keywords = [
    primaryKeyword,
    primaryKeyword.replace(/best|top|how to/gi, '').trim(),
    `${primaryKeyword} guide`,
    `${primaryKeyword} tips`,
    `${primaryKeyword} examples`,
    `${primaryKeyword} strategies`,
    `${primaryKeyword} methods`
  ]
  return keywords.slice(0, 5).join(', ')
}

// Story 4a.3 Helper Functions
function generateResearchQuery(sectionTitle: string, keyword: string, previousSections: Section[]): string {
  // Extract key terms from previous sections for context
  const previousContext = previousSections
    .slice(-2) // Use last 2 sections for context
    .map(section => section.title)
    .join(' ')
  
  // Build comprehensive research query
  const baseQuery = `${sectionTitle} ${keyword}`
  const contextQuery = previousContext ? ` ${previousContext}` : ''
  
  // Add current year for fresh results
  const fullQuery = `${baseQuery}${contextQuery} 2024 2025 latest best practices`
  
  // Keep query concise (50-100 characters max for API efficiency)
  return fullQuery.length > 100 ? fullQuery.substring(0, 97) + '...' : fullQuery
}

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

async function checkResearchCache(organizationId: string, normalizedQuery: string): Promise<TavilySource[] | null> {
  const supabase = createServiceRoleClient()
  
  try {
    const { data, error } = await supabase
      .from('tavily_research_cache' as any)
      .select('research_results')
      .eq('organization_id', organizationId)
      .ilike('research_query', normalizedQuery)
      .gt('cached_until', new Date().toISOString())
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Parse cached results and convert to TavilySource format
    const cachedResults = (data as any).research_results as any
    return (cachedResults.results || []).map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      excerpt: result.content || '',
      published_date: result.published_date || null,
      author: result.author || null,
      relevance_score: result.score || 0
    }))
  } catch (error) {
    console.warn(`[SectionProcessor] Cache lookup failed: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

async function storeResearchCache(organizationId: string, normalizedQuery: string, sources: TavilySource[]): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    // Calculate cache expiry (24 hours from now)
    const cachedUntil = new Date()
    cachedUntil.setHours(cachedUntil.getHours() + 24)
    
    // Prepare cache data in Tavily API response format
    const cacheData = {
      results: sources.map(source => ({
        title: source.title,
        url: source.url,
        content: source.excerpt,
        published_date: source.published_date,
        author: source.author,
        score: source.relevance_score
      }))
    }
    
    // Upsert to cache (handle existing entries)
    await supabase
      .from('tavily_research_cache' as any)
      .upsert({
        organization_id: organizationId,
        research_query: normalizedQuery,
        research_results: cacheData,
        cached_until: cachedUntil.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,research_query'
      })
    
    console.log(`[SectionProcessor] Cached research results for query: "${normalizedQuery}"`)
  } catch (error) {
    // Cache storage failure shouldn't block article generation
    console.warn(`[SectionProcessor] Cache storage failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function trackApiCost(organizationId: string, service: string, operation: string, cost: number): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    await supabase
      .from('api_costs' as any)
      .insert({
        organization_id: organizationId,
        service: service,
        operation: operation,
        cost: cost
      })
    
    console.log(`[SectionProcessor] Tracked API cost: ${service} ${operation} $${cost.toFixed(2)}`)
  } catch (error) {
    // Cost tracking failure shouldn't block article generation
    console.warn(`[SectionProcessor] Cost tracking failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function getUserIntentSignals(keyword: string, sectionType: string): string {
  const intentMap = {
    informational: 'Readers want to learn, understand, or discover information',
    transactional: 'Readers are ready to take action, purchase, or commit',
    commercial: 'Readers are comparing options and evaluating choices',
    navigational: 'Readers are looking for a specific resource or location',
  }
  
  // Simple intent detection from keyword
  const intent = keyword.match(/how to|what is|why|guide/i) ? 'informational' :
                 keyword.match(/best|top|vs|compare/i) ? 'commercial' :
                 keyword.match(/buy|price|cost|review/i) ? 'transactional' : 
                 'informational'
  
  const intentStrategy = {
    informational: 'Provide comprehensive explanations and step-by-step guidance',
    transactional: 'Include clear calls-to-action and practical implementation steps',
    commercial: 'Compare options, highlight pros/cons, and help decision-making',
    navigational: 'Direct to specific resources with clear instructions'
  }
  
  return `${intentMap[intent]}\nAddress this by: ${intentStrategy[intent]}`
}

function getStyleGuidance(style: string, audience: string): string {
  const styleMap: Record<string, string> = {
    Professional: 'Use formal language, industry terminology, and authoritative tone. Cite sources frequently. Avoid casual expressions or humor.',
    Conversational: 'Write as if speaking to a friend. Use "you" and "your." Include relatable examples. Keep sentences short and punchy.',
    Technical: 'Use precise terminology. Include specifications, technical details, and in-depth explanations. Audience has domain expertise.',
    Casual: 'Relaxed, friendly tone. Use contractions, colloquialisms. Focus on relatability over formality.',
    Formal: 'Academic or business writing. No contractions. Objective, third-person perspective. Highly structured.',
  }
  
  return styleMap[style] || styleMap.Professional
}

function formatResearchSources(sources: TavilySource[]): string {
  return sources.slice(0, 10).map((source, index) => {
    const excerpt = (source as any).content?.slice(0, 200) || 'No excerpt available'
    const authority = source.url?.includes('.edu') ? '🎓 Academic' :
                     source.url?.includes('.gov') ? '🏛️ Government' :
                     '📰 Industry'
    
    return `${index + 1}. [${source.title}](${source.url}) ${authority}
   Excerpt: ${excerpt}...
   Relevance: ${(source as any).relevanceScore || (source as any).relevance_score || 'High'}`
  }).join('\n\n')
}

function getEnhancedSectionGuidance(
  sectionType: string, 
  sectionTitle: string, 
  keyword: string, 
  targetWordCount: number
): string {
  const targetDensity = calculateTargetDensity(targetWordCount)
  const semanticKeywords = generateSemanticKeywords(keyword)
  
  switch (sectionType) {
    case 'introduction':
      return `**SEO-Optimized Introduction Structure (300-400 words):**

**Opening Hook (1-2 sentences):**
- Use a compelling statistic, surprising fact, or provocative question about "${keyword}"
- Example: "Did you know that [shocking stat] about ${keyword}?"
- Alternative: "If you've ever wondered [common pain point], you're not alone."

**Keyword Integration (First paragraph):**
- Include primary keyword "${keyword}" naturally in first 50-100 words
- Use in context: "Understanding ${keyword} is crucial because..."
- Target density: ${targetDensity} occurrences total

**Value Proposition (1-2 paragraphs):**
- Clearly state what readers will learn
- Address the search intent directly
- Preview key topics covered
- Include semantic keywords: ${semanticKeywords}

**Credibility Signal (1 sentence):**
- Add one strong citation early to establish authority
- Format: "According to [authoritative source], [relevant insight]..."

**Structure Preview (Final paragraph):**
- Brief overview of article flow
- Transition to first H2 section
- Maintain momentum; don't over-explain structure

**SEO Requirements:**
☐ Primary keyword in first 100 words
☐ Include 1-2 semantic keywords
☐ At least 1 authoritative citation
☐ Clear value proposition for reader
☐ Hook that reduces bounce rate
☐ Natural transition to next section`

    case 'h2':
      return `**SEO-Optimized H2 Section Structure (500-700 words):**

**Opening (Topic Sentence + Context):**
- Start with clear topic sentence containing keyword variation
- Establish why this subtopic matters within the broader "${keyword}" context
- Format: "${sectionTitle} is essential for [specific benefit] because [reason]."
- Include one early citation to support the claim

**Core Content (3-5 paragraphs):**

**Paragraph 1 - Definition/Overview:**
- Define or explain the core concept
- Use semantic keywords naturally: ${semanticKeywords}
- Include specific examples or data
- Format: "At its core, [topic] means [definition]. For instance, [specific example]."

**Paragraph 2-3 - Deep Dive:**
- Provide detailed information with depth
- Break complex ideas into digestible parts
- Use "how it works" or "why it matters" approach
- Include at least 2 citations supporting different points
- Integrate statistics: "Research shows that [stat] according to [source]."

**Paragraph 4 - Practical Application:**
- Give actionable insights or real-world examples
- Show how readers can apply this information
- Use second-person: "You can achieve [result] by [action]."
- Include case study or specific scenario

**H3 Subsections (If needed):**
- Break into 2-3 H3s if topic is complex
- Each H3 should be 200-300 words
- H3 titles should include long-tail variations

**Closing (Transition):**
- Brief summary of key takeaway (1 sentence)
- Natural transition to next section
- Format: "Now that you understand [this topic], let's explore [next topic]..."

**SEO Requirements:**
☐ Keyword or semantic variation in first sentence
☐ Target density: ${targetDensity} total occurrences
☐ 3-4 citations distributed throughout
☐ At least 2 specific data points or statistics
☐ 1-2 concrete examples or case studies
☐ Proper H3 subsections if >600 words
☐ Actionable insights included
☐ Smooth transition to next section`

    case 'h3':
      return `**SEO-Optimized H3 Subsection Structure (300-500 words):**

**Context Connection (1 sentence):**
- Link this H3 directly to parent H2 topic
- Format: "Within [parent H2 topic], ${sectionTitle} plays a crucial role in [specific aspect]."

**Focused Content (2-4 paragraphs):**

**Paragraph 1 - Specific Focus:**
- Narrow down to the exact aspect this H3 covers
- Use long-tail keyword variation in first 50 words
- Provide immediate value

**Paragraph 2-3 - Detailed Explanation:**
- Go deep on this specific subtopic
- Include 1-2 citations
- Use examples specific to this narrow focus
- Keep content tightly scoped (don't drift to related topics)

**Paragraph 4 - Practical Takeaway:**
- Actionable tip or insight
- How this specific knowledge helps
- Quick win or implementation advice

**SEO Requirements:**
☐ Long-tail keyword variation included
☐ 1-2 targeted citations
☐ Stays focused on H3 topic (no scope creep)
☐ Connects to parent H2 naturally
☐ At least 1 specific example
☐ Practical application provided
☐ Target density: ${targetDensity} occurrences`

    case 'conclusion':
      return `**SEO-Optimized Conclusion Structure (300-500 words):**

**Summary Opening (1-2 paragraphs):**
- Synthesize key insights from entire article
- Restate primary keyword in context of value delivered
- Format: "Understanding ${keyword} requires [key insight 1], [key insight 2], and [key insight 3]."
- Don't just list topics; connect them thematically

**Key Takeaways (1 paragraph with 3-5 points):**
- Highlight most important actionable insights
- Use brief, punchy statements
- Format: "Remember: [takeaway 1]. [takeaway 2]. [takeaway 3]."
- Each takeaway should be independently valuable

**Future Outlook / Next Steps (1 paragraph):**
- Where is this topic heading?
- What should readers do next?
- Call to action (soft or explicit)
- Format: "As ${keyword} continues to evolve, [future trend]. To get started, [actionable next step]."

**Final Memorable Statement (1 sentence):**
- End with impact
- Reinforce core message
- Leave reader feeling informed and empowered
- Example: "Master ${keyword}, and you'll [compelling outcome]."

**SEO Requirements:**
☐ Primary keyword appears 1-2 times naturally
☐ Synthesizes article without repeating verbatim
☐ Provides clear takeaways
☐ Includes forward-looking insight
☐ Actionable next steps provided
☐ Ends on strong, memorable note
☐ 1 citation if introducing new supporting data`

    case 'faq':
      return `**SEO-Optimized FAQ Structure (400-600 words):**

**Section Introduction (1-2 sentences):**
- Brief setup: "Here are answers to common questions about ${keyword}:"
- Optional: Group questions thematically

**Question Format (5-8 Q&A pairs):**

**Question Optimization:**
- Write as actual user queries (natural language)
- Include long-tail keyword variations
- Format as H3: ### What is the best way to [specific aspect of keyword]?
- Mirror "People Also Ask" from Google if available
- Use question words: Who, What, When, Where, Why, How

**Answer Structure (Each 60-150 words):**

**Sentence 1 - Direct Answer:**
- Answer the question immediately (featured snippet optimization)
- Be concise and definitive
- Format: "The best way to [question topic] is [direct answer]."

**Sentences 2-4 - Supporting Detail:**
- Provide context or explanation
- Include 1 citation if making specific claim
- Add practical insight or example

**Final Sentence - Actionable Tip:**
- Quick takeaway or implementation advice
- Links back to main article content when relevant

**Question Selection Strategy:**
- Cover different aspects: basics, how-to, comparison, troubleshooting, cost/time
- Progress from beginner to advanced
- Address objections or concerns
- Fill content gaps from main article

**SEO Requirements:**
☐ 5-8 questions covering diverse subtopics
☐ Questions written as natural search queries
☐ Each answer 60-150 words
☐ Direct answer in first sentence (snippet-ready)
☐ 2-3 citations across all FAQs
☐ At least 2 long-tail keyword variations
☐ Practical advice in each answer`

    default:
      return `Generate comprehensive content for ${sectionTitle} following SEO best practices and including ${targetDensity} natural keyword occurrences.`
  }
}

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

  // Perform Tavily research with cache and cost tracking (Story 4a.3)
  let researchSources: TavilySource[] = []
  let researchQueryUsed = ''
  let researchFailed = false

  try {
    // Generate research query from section topic + keyword + previous sections
    researchQueryUsed = generateResearchQuery(sectionInfo.title, article.keyword as string, previousSections)
    
    // Normalize query for cache lookup
    const normalizedQuery = normalizeQuery(researchQueryUsed)
    
    // Check cache first (24-hour TTL)
    const cachedResults = await checkResearchCache(organizationId, normalizedQuery)
    
    if (cachedResults) {
      researchSources = cachedResults
      console.log(`[SectionProcessor] Using cached research for query: "${researchQueryUsed}" (${researchSources.length} sources)`)
    } else {
      // Call Tavily API with retry logic
      console.log(`[SectionProcessor] Performing fresh Tavily research for query: "${researchQueryUsed}"`)
      researchSources = await researchQuery(researchQueryUsed, {
        maxRetries: 3,
        retryDelay: 1000,
        maxResults: 20,
        maxSources: 10
      })
      
      // Store results in cache (24-hour TTL)
      await storeResearchCache(organizationId, normalizedQuery, researchSources)
      
      // Track API cost ($0.08 per query)
      await trackApiCost(organizationId, 'tavily', 'section_research', 0.08)
      
      console.log(`[SectionProcessor] Fresh research completed: ${researchSources.length} sources cached and cost tracked`)
    }
    
    if (researchSources.length === 0) {
      console.warn(`[SectionProcessor] No research sources found for section: ${sectionInfo.title}`)
      researchFailed = true
    }
  } catch (error) {
    // Graceful degradation: Continue without fresh research
    console.warn(`[SectionProcessor] Research failed: ${error instanceof Error ? error.message : String(error)}`)
    researchFailed = true
    
    // Update article error_details with research failure
    await updateArticleErrorDetails(articleId, sectionIndex, researchQueryUsed, error)
    
    // Log warning for partial research failure
    console.warn(`Section generated without fresh Tavily research: ${sectionInfo.title}`)
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
  const targetDensity = calculateTargetDensity(targetWordCount)
  const semanticKeywords = generateSemanticKeywords(keyword)
  const intentSignals = getUserIntentSignals(keyword, sectionInfo.type)
  const styleGuidance = getStyleGuidance(writingStyle, targetAudience)
  
  // Enhanced SEO-optimized system prompt
  const systemMessage = `You are an elite SEO content strategist and expert writer specializing in high-ranking, user-focused content that satisfies both search engines and human readers.

**Your Core Objectives:**
1. Create content that ranks on page 1 for target keywords while providing genuine value
2. Write naturally for humans first, optimize for search engines second
3. Demonstrate expertise, experience, authority, and trustworthiness (E-E-A-T)
4. Match user search intent precisely
5. Integrate citations seamlessly for credibility

**SEO Writing Principles:**
- Use the primary keyword naturally in the first 100 words
- Include semantic variations and related terms throughout (LSI keywords)
- Write in active voice with clear, scannable sentences
- Front-load important information (inverted pyramid style)
- Use transition words for readability and flow
- Include specific examples, data, and actionable insights
- Optimize for featured snippets where applicable (concise definitions, lists, tables)
- Write compelling meta-worthy content in opening paragraphs

**Content Structure Requirements:**
- Start each major section with a clear topic sentence containing relevant keywords
- Use H2/H3 hierarchy properly (never skip levels)
- Keep paragraphs 2-4 sentences for readability
- Use bullet points/lists only when they enhance clarity (not by default)
- Include relevant statistics within the first 200 words of sections
- End sections with natural transitions to the next topic

**Citation & Authority Building:**
- Integrate citations naturally: "According to [Source]," or "Research from [Source] shows..."
- Distribute citations evenly (not clustered at beginning/end)
- Prioritize authoritative sources (.edu, .gov, industry leaders)
- Use citations to support claims, not replace original analysis

**Writing Style:** ${writingStyle}
**Target Audience:** ${targetAudience}
**Audience Knowledge Level:** Intermediate - understands basics but wants deeper insights
${customInstructions ? `\n**Custom Requirements:** ${customInstructions}` : ''}

**Forbidden Practices:**
- Keyword stuffing or unnatural repetition
- Generic fluff content without substance
- Citation dumping at the end of sections
- Over-formatting (excessive bold, lists where prose is better)
- Clickbait or misleading information

Generate content that ranks well, engages readers deeply, and establishes topical authority.`

  // Format research sources with enhanced formatting
  const researchSourcesText = formatResearchSources(researchSources)

  // Enhanced section-specific guidance
  const sectionGuidance = getEnhancedSectionGuidance(sectionInfo.type, sectionInfo.title, keyword, targetWordCount)
  
  // Build comprehensive user message with SEO optimization
  const userMessageParts = [
    `**CONTENT BRIEFING**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `📌 **Section Details**`,
    `Section Title: ${sectionInfo.title}`,
    `Section Type: ${sectionInfo.type}`,
    `Target Word Count: ${targetWordCount} words (±10% flexibility for quality)`,
    `Section Position: ${1} of ${1}`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `🎯 **SEO STRATEGY & KEYWORD TARGETING**`,
    '',
    `**Primary Keyword:** "${keyword}"`,
    `**Search Intent:** ${intentSignals.split('\n')[0]}`,
    `**Competition Level:** Medium`,
    '',
    `**Keyword Integration Strategy:**`,
    `- Target Density: ${targetDensity} occurrences (0.5-1.5% density)`,
    `- First mention: Within first 100 words`,
    `- H2/H3 usage: Include primary or semantic variation in heading`,
    `- Natural placement: Prioritize readability over exact matches`,
    '',
    `**Semantic Keywords to Include:** ${semanticKeywords}`,
    '',
    `**User Intent Signals:**`,
    intentSignals,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `📚 **RESEARCH FOUNDATION**`,
    '',
    `**Primary Research Sources (${researchSources.length} sources):**`,
    researchSourcesText || 'No research sources available.',
    '',
    `**Citation Requirements:**`,
    `- Minimum citations: ${Math.ceil(targetWordCount / 200)} (distributed evenly)`,
    `- Citation style: "According to [Source Name], ..." or "Research from [Source] indicates..."`,
    `- Source diversity: Use at least ${Math.min(4, researchSources.length)} different sources`,
    `- Authority priority: Favor .edu, .gov, industry publications over generic blogs`,
    '',
    `**Data Integration:**`,
    `- Include at least 1 specific statistic or data point`,
    `- Use recent data (prefer 2024-2026 sources)`,
    `- Cite numerical claims precisely`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `📖 **CONTENT CONTEXT & CONTINUITY**`,
    '',
    optimizedContext ? 
    `**Previously Covered:**\n${optimizedContext}\n\n**Continuity Requirements:**\n- Reference previous concepts when relevant: "As discussed in [previous section]..."\n- Avoid repeating information already covered\n- Build progressively on established knowledge\n- Use transition sentences to connect this section to previous content` :
    `**This is the ${sectionInfo.type === 'introduction' ? 'INTRODUCTION' : 'FIRST'} SECTION**\n\n**Opening Requirements:**\n- Hook readers immediately (surprising fact, compelling question, bold statement)\n- Establish relevance: Why does this topic matter NOW?\n- Preview value: What will readers gain?\n- Include primary keyword in first paragraph\n- Set expectations for article flow`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `✍️ **SECTION-SPECIFIC REQUIREMENTS**`,
    '',
    sectionGuidance,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `🎨 **WRITING STYLE & AUDIENCE**`,
    '',
    `**Writing Style:** ${writingStyle}`,
    `**Target Audience:** ${targetAudience}`,
    `**Reading Level:** Grade 10-12 (accessible but informed)`,
    `**Tone:** Authoritative yet approachable`,
    `**Voice:** Active voice, second-person (you/your) for engagement`,
    '',
    `**Style Execution:**`,
    styleGuidance,
    '',
    ...(customInstructions ? [`**CUSTOM INSTRUCTIONS:**\n${customInstructions}\n`] : []),
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `✅ **QUALITY CHECKLIST**`,
    '',
    `**SEO Optimization:**`,
    `☐ Primary keyword appears ${targetDensity} times naturally`,
    `☐ Keyword in first 100 words`,
    `☐ Semantic keywords integrated throughout`,
    `☐ Heading includes keyword or variation`,
    `☐ Content matches search intent for "${keyword}"`,
    '',
    `**Content Quality:**`,
    `☐ Word count: ${targetWordCount - 50} to ${targetWordCount + 50} words`,
    `☐ ${Math.ceil(targetWordCount / 200)} citations distributed evenly`,
    `☐ At least 1 specific statistic or data point`,
    `☐ Concrete examples or case studies included`,
    `☐ Actionable insights provided (not just information)`,
    `☐ No generic filler content`,
    '',
    `**Readability:**`,
    `☐ Paragraphs are 2-4 sentences`,
    `☐ Proper H2/H3 markdown formatting`,
    `☐ Transition words between paragraphs`,
    `☐ Active voice predominates`,
    `☐ Scannable structure (easy to skim)`,
    '',
    `**E-E-A-T Signals:**`,
    `☐ Demonstrates expertise through specific knowledge`,
    `☐ Shows experience with real-world examples`,
    `☐ Cites authoritative sources`,
    `☐ Provides trustworthy, accurate information`,
    '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    `🚀 **GENERATE CONTENT NOW**`,
    '',
    `Create ${targetWordCount} words of comprehensive, SEO-optimized content that:`,
    `1. Ranks for "${keyword}" while genuinely helping readers`,
    `2. Satisfies the ${intentSignals.split('\n')[0]} search intent completely`,
    `3. Establishes topical authority through depth and citations`,
    `4. Engages ${targetAudience} with ${writingStyle.toLowerCase()} writing`,
    `5. Integrates seamlessly with previous content`,
    '',
    `**Output Format:** Pure markdown with proper heading hierarchy (start with ## for H2 or ### for H3)`
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

// Export for use in generateSectionContent and tests
export { 
  getTargetWordCount,
  calculateTargetDensity,
  generateSemanticKeywords,
  getUserIntentSignals,
  getStyleGuidance,
  formatResearchSources,
  getEnhancedSectionGuidance
}

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

