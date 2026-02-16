// Section processing service for article generation
// Story 4a.2: Section-by-Section Architecture and Outline Generation
// Story 4a.3: Real-Time Research Per Section (Tavily Integration)
// Story 4a.12: Performance Optimization with Enhanced SEO Prompts

import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'
import { summarizeSections, fitInContextWindow, estimateTokens } from '@/lib/utils/token-management'
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'
import { validateContentQuality, validatePromptQuality, autoFixMinorIssues, generateTargetedRetryPrompt, countCitations } from '@/lib/utils/content-quality'
import { formatCitationsForMarkdown } from '@/lib/utils/citation-formatter'
import { researchQuery, type TavilySource } from '@/lib/services/tavily/tavily-client'
import { 
  performBatchResearch,
  getSectionResearchSources,
  clearResearchCache
} from './research-optimizer'
import { 
  buildOptimizedContext, 
  batchUpdateSections, 
  clearContextCache,
  getContextStats,
  getTokenUsageStats,
  getCachePerformanceStats,
  getPerformanceMetrics as getContextPerformanceMetrics
} from './context-manager'
import { 
  getSectionTemplate,
  processTemplate,
  type TemplateContext
} from './section-templates'
import {
  validateContentFormat,
  applyFormatCorrections,
  validateContentWithErrorHandling,
  type FormatValidationResult
} from './format-validator'
import { performanceMonitor } from './performance-monitor'

// Enhanced SEO Strategy Functions for Story 14.2

/**
 * Create keyword placement strategy algorithm
 * Returns strategic placement recommendations for primary and secondary keywords
 */
function createKeywordPlacementStrategy(
  keyword: string, 
  semanticKeywords: string, 
  sectionType: string, 
  targetWordCount: number
): string {
  // Enhanced density calculation with SEO best practices
  const baseDensity = calculateTargetDensity(targetWordCount, sectionType)
  const semanticList = semanticKeywords.split(', ')
  
  // Calculate optimal keyword density based on content type and target word count
  const getOptimalDensity = (sectionType: string, wordCount: number) => {
    const densities = {
      introduction: Math.max(1, Math.ceil(wordCount * 0.015)), // 1.5% for intro
      h2: Math.max(2, Math.ceil(wordCount * 0.018)), // 1.8% for H2 sections
      h3: Math.max(1, Math.ceil(wordCount * 0.012)), // 1.2% for H3 subsections
      conclusion: Math.max(1, Math.ceil(wordCount * 0.010)), // 1.0% for conclusion
      faq: Math.max(1, Math.ceil(wordCount * 0.014)) // 1.4% for FAQ
    }
    return densities[sectionType as keyof typeof densities] || densities.h2
  }
  
  const optimalDensity = getOptimalDensity(sectionType, targetWordCount)
  
  const strategies = {
    introduction: `**Enhanced Keyword Placement Strategy for Introduction:**
- **Primary Keyword Placement:** Use "${keyword}" in first 50-100 words (1 occurrence for strong opening)
- **Semantic Integration:** Weave in ${semanticList.slice(0, 2).join(' or ')} naturally throughout
- **Hook Integration:** Start with compelling hook: "The Ultimate Guide to ${keyword}" or "${keyword}: What You Need to Know"
- **Density Target:** ${optimalDensity} total occurrences (1.5% optimal for introductions)
- **SEO Best Practice:** Place primary keyword in first sentence for search engine prominence`,

    h2: `**Enhanced Keyword Placement Strategy for H2 Section:**
- **Primary Keyword Placement:** Include "${keyword}" or semantic variation in first sentence for topic authority
- **Semantic Integration:** Use ${semanticList.slice(0, 3).join(', ')} distributed naturally throughout section
- **Heading Optimization:** Current heading should contain keyword or semantic variation for hierarchy
- **Density Target:** ${optimalDensity} total occurrences (1.8% optimal for main sections)
- **Long-tail Opportunities:** Create H3 subsections using semantic variations like "${semanticList[0] || keyword} strategies"
- **LSI Integration:** Include latent semantic indexing terms for topical depth`,

    h3: `**Enhanced Keyword Placement Strategy for H3 Subsection:**
- **Long-tail Focus:** Use semantic variations like ${semanticList.slice(1, 3).join(' or ')} in heading for specificity
- **Contextual Placement:** Reference "${keyword}" naturally when discussing main topic
- **Density Target:** ${optimalDensity} occurrences (1.2% optimal for subsections)
- **Semantic Depth:** Explore specific aspects of ${semanticList[0] || keyword} with examples
- **Expertise Building:** Demonstrate deep knowledge through detailed explanations`,

    conclusion: `**Enhanced Keyword Placement Strategy for Conclusion:**
- **Keyword Reinforcement:** Use "${keyword}" 1-2 times in summary context for retention
- **Semantic Summary:** Reference key concepts: ${semanticList.slice(0, 2).join(', ')}
- **Final Integration:** End with memorable statement about ${keyword} for impact
- **Density Target:** ${optimalDensity} occurrences (1.0% optimal for conclusions)
- **Call-to-Action Enhancement:** Include keyword in final CTA for consistency`,

    faq: `**Enhanced Keyword Placement Strategy for FAQ:**
- **Question Optimization:** Frame 2-3 questions using "${keyword}" and semantic variations for featured snippets
- **Answer Integration:** Use semantic keywords naturally in comprehensive answers
- **Snippet Focus:** Structure for Google featured snippets with keyword-rich questions
- **Density Target:** ${optimalDensity} occurrences across Q&A (1.4% optimal for FAQs)
- **Semantic Questions:** "What are the best ${semanticList[0] || keyword} strategies?" and "How does ${keyword} work?"
- **Voice Search Optimization:** Use natural language questions that match voice search queries`
  }

  return strategies[sectionType as keyof typeof strategies] || strategies.h2
}

/**
 * Implement semantic keyword variation generator with enhanced logic
 */
function generateEnhancedSemanticKeywords(primaryKeyword: string, sectionType: string): string {
  const baseKeywords = generateSemanticKeywords(primaryKeyword)
  const baseList = baseKeywords.split(', ')
  
  // Enhanced section-specific semantic keywords with LSI and topic cluster concepts
  const sectionEnhancements = {
    introduction: [
      `${primaryKeyword} overview`,
      `${primaryKeyword} basics`,
      `${primaryKeyword} fundamentals`,
      `getting started with ${primaryKeyword}`,
      `${primaryKeyword} introduction`,
      `${primaryKeyword} for beginners`,
      `understanding ${primaryKeyword}`,
      `${primaryKeyword} essentials`
    ],
    h2: [
      `${primaryKeyword} strategies`,
      `${primaryKeyword} techniques`,
      `${primaryKeyword} methods`,
      `${primaryKeyword} best practices`,
      `advanced ${primaryKeyword}`,
      `${primaryKeyword} optimization`,
      `${primaryKeyword} implementation`,
      `${primaryKeyword} expert guide`
    ],
    h3: [
      `specific ${primaryKeyword}`,
      `${primaryKeyword} details`,
      `${primaryKeyword} implementation`,
      `${primaryKeyword} examples`,
      `${primaryKeyword} applications`,
      `${primaryKeyword} case studies`,
      `${primaryKeyword} step by step`,
      `${primaryKeyword} practical guide`
    ],
    conclusion: [
      `${primaryKeyword} summary`,
      `${primaryKeyword} key takeaways`,
      `${primaryKeyword} final thoughts`,
      `${primaryKeyword} recommendations`,
      `${primaryKeyword} next steps`,
      `${primaryKeyword} recap`,
      `${primaryKeyword} conclusion`,
      `${primaryKeyword} action items`
    ],
    faq: [
      `${primaryKeyword} questions`,
      `${primaryKeyword} answers`,
      `${primaryKeyword} problems`,
      `${primaryKeyword} solutions`,
      `${primaryKeyword} common issues`,
      `${primaryKeyword} troubleshooting`,
      `${primaryKeyword} frequently asked`,
      `${primaryKeyword} expert answers`
    ]
  }

  const enhancements = sectionEnhancements[sectionType as keyof typeof sectionEnhancements] || sectionEnhancements.h2
  
  // Combine base keywords with section-specific enhancements
  const combinedKeywords = [...baseList, ...enhancements.slice(0, 5)]
  
  // Remove duplicates and limit to 10 keywords max for better coverage
  const uniqueKeywords = [...new Set(combinedKeywords)].slice(0, 10)
  
  return uniqueKeywords.join(', ')
}

/**
 * Add target audience consideration logic
 */
function generateTargetAudienceGuidance(targetAudience: string, keyword: string, sectionType: string): string {
  const audienceGuidance = {
    'Small Business Owners': {
      introduction: `Focus on practical, budget-friendly ${keyword} strategies that deliver measurable ROI. Emphasize time efficiency and cost-effectiveness.`,
      h2: `Provide actionable ${keyword} implementations that small teams can execute with limited resources. Include specific tools and platforms suitable for small business budgets.`,
      h3: `Detail specific ${keyword} tactics with clear step-by-step instructions. Address common small business challenges and constraints.`,
      conclusion: `Summarize ${keyword} benefits specific to small business growth and competitive advantage. Provide clear next steps for immediate implementation.`,
      faq: `Address small business-specific concerns about ${keyword} costs, time investment, and resource requirements.`
    },
    'General': {
      introduction: `Make ${keyword} accessible to beginners while providing value for intermediate learners. Focus on universal principles and applications.`,
      h2: `Balance comprehensive ${keyword} coverage with practical examples. Use relatable scenarios and clear explanations.`,
      h3: `Explore specific ${keyword} aspects with detailed explanations. Use analogies and real-world examples for clarity.`,
      conclusion: `Reinforce key ${keyword} concepts with memorable takeaways. Provide resources for continued learning.`,
      faq: `Cover common ${keyword} questions from beginners to advanced users. Provide clear, actionable answers.`
    },
    'Marketing Professionals': {
      introduction: `Assume existing knowledge and focus on advanced ${keyword} strategies and emerging trends. Emphasize competitive advantages and innovation.`,
      h2: `Provide sophisticated ${keyword} techniques with industry insights. Include advanced metrics and optimization strategies.`,
      h3: `Deep dive into technical ${keyword} aspects with expert-level analysis. Include case studies and performance data.`,
      conclusion: `Synthesize advanced ${keyword} strategies with forward-looking insights. Discuss industry evolution and opportunities.`,
      faq: `Address expert-level ${keyword} questions about optimization, scaling, and integration with existing strategies.`
    }
  }

  const guidance = audienceGuidance[targetAudience as keyof typeof audienceGuidance] || audienceGuidance['General']
  return guidance[sectionType as keyof typeof guidance] || guidance.h2
}

/**
 * Build search intent signal integration
 */
function generateSearchIntentGuidance(keyword: string, sectionType: string): string {
  // Enhanced intent detection
  const intentType = keyword.match(/how to|what is|why|guide|tutorial/i) ? 'informational' :
                   keyword.match(/best|top|vs|compare|review/i) ? 'commercial' :
                   keyword.match(/buy|price|cost|hire|service/i) ? 'transactional' : 
                   'informational'

  const intentGuidance = {
    informational: {
      all: `**Informational Intent Strategy:**
- **User Goal:** Learn comprehensive information about ${keyword}
- **Content Approach:** Educational, thorough, and well-structured
- **Key Elements:** Step-by-step guidance, clear explanations, practical examples
- **Success Metrics:** User comprehension, bookmarking, sharing
- **SEO Focus:** Answer user questions completely, establish topical authority`,

      introduction: `Start with the fundamental question users have about ${keyword}. Provide immediate clarity on what they'll learn.`,

      h2: `Structure content to progressively build knowledge about ${keyword}. Use clear headings and logical flow.`,

      h3: `Focus on specific aspects users want to understand about ${keyword}. Provide detailed explanations and examples.`,

      conclusion: `Summarize key learnings about ${keyword}. Provide resources for deeper understanding.`,

      faq: `Anticipate and answer follow-up questions users have about ${keyword}. Structure for featured snippets.`
    },

    commercial: {
      all: `**Commercial Intent Strategy:**
- **User Goal:** Compare options and make informed decisions about ${keyword}
- **Content Approach:** Comparative analysis, pros/cons, evaluation criteria
- **Key Elements:** Feature comparisons, pricing insights, recommendations
- **Success Metrics:** Decision confidence, option clarity, satisfaction
- **SEO Focus:** Comparison keywords, decision factors, expert recommendations`,

      introduction: `Frame ${keyword} as a solution to a problem. Establish comparison criteria early.`,

      h2: `Provide detailed comparisons of ${keyword} options. Use structured formats for easy evaluation.`,

      h3: `Deep dive into specific ${keyword} features or alternatives. Use comparison tables and checklists.`,

      conclusion: `Summarize decision factors for ${keyword}. Provide clear recommendations based on user needs.`,

      faq: `Address comparison questions about ${keyword}. Help users evaluate options based on their specific needs.`
    },

    transactional: {
      all: `**Transactional Intent Strategy:**
- **User Goal:** Take specific action related to ${keyword}
- **Content Approach:** Action-oriented, conversion-focused, practical
- **Key Elements:** Clear calls-to-action, implementation steps, resource links
- **Success Metrics:** Conversion rates, action completion, user satisfaction
- **SEO Focus:** Action keywords, implementation guides, resource optimization`,

      introduction: `Establish immediate value proposition for ${keyword}. Create urgency and clear next steps.`,

      h2: `Provide actionable ${keyword} implementation guidance. Include specific tools and resources.`,

      h3: `Detail specific actions users can take with ${keyword}. Use step-by-step formats and checklists.`,

      conclusion: `Reinforce action benefits and provide clear implementation timeline for ${keyword}.`,

      faq: `Address implementation questions about ${keyword}. Remove barriers to action with clear answers.`
    }
  }

  const intent = intentGuidance[intentType] || intentGuidance.informational
  return intent[sectionType as keyof typeof intent] || intent.all
}

// Enhanced SEO Helper Functions with Error Handling

// Standard error handling pattern used across functions
function safeExecute<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch (error) {
    console.error(`[SectionProcessor] Function execution failed:`, error)
    return fallback
  }
}

function calculateTargetDensity(wordCount: number, contentType: string = 'general'): number {
  return safeExecute(() => {
    // Input validation
    if (!wordCount || wordCount < 0 || !Number.isFinite(wordCount)) {
      throw new Error(`Invalid wordCount: ${wordCount}. Must be a positive number.`)
    }
    
    if (!contentType || typeof contentType !== 'string') {
      throw new Error(`Invalid contentType: ${contentType}. Must be a string.`)
    }
    
    // Enhanced density calculation based on content type and SEO best practices
    // Primary keyword density: 1-2% for general content, 0.5-1.5% for specialized content
    
    let minDensity: number, maxDensity: number
    
    switch (contentType) {
      case 'introduction':
        // Higher density in introduction for immediate SEO impact
        minDensity = Math.ceil(wordCount * 0.012) // 1.2%
        maxDensity = Math.floor(wordCount * 0.020) // 2.0%
        break
      case 'conclusion':
        // Moderate density for reinforcement
        minDensity = Math.ceil(wordCount * 0.008) // 0.8%
        maxDensity = Math.floor(wordCount * 0.015) // 1.5%
        break
      case 'h2':
        // Optimal density for main sections
        minDensity = Math.ceil(wordCount * 0.010) // 1.0%
        maxDensity = Math.floor(wordCount * 0.018) // 1.8%
        break
      case 'h3':
        // Lower density for subsections (focus on semantic keywords)
        minDensity = Math.ceil(wordCount * 0.007) // 0.7%
        maxDensity = Math.floor(wordCount * 0.012) // 1.2%
        break
      case 'faq':
        // Natural density for Q&A format
        minDensity = Math.ceil(wordCount * 0.008) // 0.8%
        maxDensity = Math.floor(wordCount * 0.014) // 1.4%
        break
      default:
        // Standard density for general content
        minDensity = Math.ceil(wordCount * 0.010) // 1.0%
        maxDensity = Math.floor(wordCount * 0.020) // 2.0%
    }
    
    // Ensure minimum of 1 for very short content and reasonable maximum
    minDensity = Math.max(1, minDensity)
    maxDensity = Math.max(minDensity + 1, maxDensity)
    
    // Return the average for optimal balance
    return Math.floor((minDensity + maxDensity) / 2)
  }, Math.max(1, Math.floor(wordCount * 0.01))) // Fallback: 1% of word count, minimum 1
}

function generateSemanticKeywords(primaryKeyword: string): string {
  return safeExecute(() => {
    // Enhanced semantic keyword generation with LSI variations and contextual relevance
    
    // Validate input
    if (!primaryKeyword || typeof primaryKeyword !== 'string' || primaryKeyword.trim().length === 0) {
      return ''
    }
    
    // Clean and normalize the primary keyword
    const cleanKeyword = primaryKeyword.toLowerCase().trim()
    
    // Extract root concept (remove common modifiers)
    const rootConcept = cleanKeyword
      .replace(/^(best|top|how to|what is|why|guide|tutorial|tips|examples)/gi, '')
      .replace(/^(the|a|an)\s+/gi, '')
      .replace(/\s+(for|to|in|on|with|and|or)$/gi, '')
      .trim()
    
    // Generate semantic variations based on keyword patterns
    const semanticVariations = [
      // Primary keyword (always include)
      primaryKeyword,
      
      // Root concept variations
      rootConcept ? `${rootConcept} strategies` : '',
      rootConcept ? `${rootConcept} methods` : '',
      rootConcept ? `${rootConcept} techniques` : '',
      rootConcept ? `${rootConcept} approach` : '',
      
      // Action-oriented variations
      cleanKeyword.includes('how to') ? `${cleanKeyword.replace('how to', '').trim()} guide` : '',
      cleanKeyword.includes('best') ? `${cleanKeyword.replace('best', '').trim()} tips` : '',
      cleanKeyword.includes('top') ? `${cleanKeyword.replace('top', '').trim()} examples` : '',
      
      // Contextual variations
      `${primaryKeyword} best practices`,
      `${primaryKeyword} implementation`,
      `${primaryKeyword} optimization`,
      
      // Question-based variations (for FAQ content)
      `what is ${rootConcept || primaryKeyword}`,
      `how to implement ${rootConcept || primaryKeyword}`,
      `${primaryKeyword} best practices`,
      
      // Long-tail variations
      `${primaryKeyword} for beginners`,
      `${primaryKeyword} advanced techniques`,
      `${primaryKeyword} step by step`
    ]
    
    // Filter out empty strings and duplicates
    const uniqueKeywords = [...new Set(semanticVariations.filter(keyword => 
      keyword && 
      keyword.length > 3 && 
      keyword !== primaryKeyword &&
      !keyword.includes('undefined') &&
      !keyword.includes('  ') // no double spaces
    ))]
    
    // Return top 5-7 most relevant semantic keywords
    return [primaryKeyword, ...uniqueKeywords.slice(0, 6)].join(', ')
  }, primaryKeyword || '') // Fallback: return original keyword or empty string
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
  return safeExecute(() => {
    // Enhanced intent detection with multiple pattern matching and section-specific guidance
    
    // Validate inputs
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return 'Readers want to learn, understand, or discover information\nCharacteristics: Seeking knowledge, explanations, tutorials, and comprehensive guides\nSection Strategy: Start with comprehensive context, establish expertise, and preview what readers will learn\nContent Focus: Educational value and comprehensive coverage'
    }
    
    const intentMap = {
      informational: {
        description: 'Readers want to learn, understand, or discover information',
        characteristics: 'Seeking knowledge, explanations, tutorials, and comprehensive guides'
      },
      transactional: {
        description: 'Readers are ready to take action, purchase, or commit',
        characteristics: 'Looking to buy, sign up, download, or take specific actions'
      },
      commercial: {
        description: 'Readers are comparing options and evaluating choices',
        characteristics: 'Researching products, services, or alternatives before making decisions'
      },
      navigational: {
        description: 'Readers are looking for a specific resource or location',
        characteristics: 'Trying to find specific websites, pages, or physical locations'
      },
      local: {
        description: 'Readers seeking location-specific information or services',
        characteristics: 'Looking for businesses, services, or information in specific geographic areas'
      }
    }
    
    // Enhanced intent detection with weighted pattern matching
    const keywordLower = keyword.toLowerCase()
    
    // Informational patterns (highest priority for educational content)
    const informationalPatterns = [
      /how to|what is|why|guide|tutorial|learn|understand|explain|definition|meaning/i,
      /step by step|instructions|ways to|methods for|techniques of/i,
      /introduction to|basics of|fundamentals of|getting started with/i,
      /for beginners|for dummies|explained simply|easy guide/i
    ]
    
    // Transactional patterns
    const transactionalPatterns = [
      /buy|purchase|order|sign up|register|download|subscribe|join/i,
      /get started|start now|begin today|take action|act now/i,
      /free trial|demo|sample|example|template|checklist/i,
      /price|cost|pricing|rates|fees|discount|deal|offer/i
    ]
    
    // Commercial patterns
    const commercialPatterns = [
      /best|top|vs|versus|compare|review|rating|ranking|alternative/i,
      /which|choose|select|pick|recommend|suggestion|advice/i,
      /pros and cons|advantages|disadvantages|benefits|features/i,
      /analysis|evaluation|assessment|comparison|test|audit/i
    ]
    
    // Navigational patterns
    const navigationalPatterns = [
      /login|signin|access|enter|open|find|search|locate/i,
      /website|page|url|link|address|contact|support|help/i,
      /official|authentic|legitimate|real|actual/i
    ]
    
    // Local patterns
    const localPatterns = [
      /near me|local|nearby|in [a-z]+|at [a-z]+|city|state|country/i,
      /location|address|phone|hours|directions|map/i,
      /services|business|store|shop|office|branch/i
    ]
    
    // Calculate intent scores based on pattern matches
    let intentScores = {
      informational: 0,
      transactional: 0,
      commercial: 0,
      navigational: 0,
      local: 0
    }
    
    // Score each intent type
    informationalPatterns.forEach(pattern => {
      if (pattern.test(keywordLower)) intentScores.informational += 2
    })
    
    transactionalPatterns.forEach(pattern => {
      if (pattern.test(keywordLower)) intentScores.transactional += 2
    })
    
    commercialPatterns.forEach(pattern => {
      if (pattern.test(keywordLower)) intentScores.commercial += 2
    })
    
    navigationalPatterns.forEach(pattern => {
      if (pattern.test(keywordLower)) intentScores.navigational += 2
    })
    
    localPatterns.forEach(pattern => {
      if (pattern.test(keywordLower)) intentScores.local += 2
    })
    
    // Determine primary intent (highest score)
    const primaryIntent = Object.keys(intentScores).reduce((a, b) => 
      intentScores[a as keyof typeof intentScores] > intentScores[b as keyof typeof intentScores] ? a : b
    ) as keyof typeof intentMap
    
    // Section-specific strategy adjustments
    const sectionStrategies = {
      introduction: {
        informational: 'Start with comprehensive context, establish expertise, and preview what readers will learn',
        transactional: 'Begin with clear value proposition and immediate action-oriented benefits',
        commercial: 'Open with comparison framework and establish decision-making criteria',
        navigational: 'Provide clear path to resource with immediate accessibility',
        local: 'Establish geographic relevance and local context immediately'
      },
      h2: {
        informational: 'Deliver detailed explanations with examples and step-by-step guidance',
        transactional: 'Focus on implementation steps and practical application',
        commercial: 'Provide detailed comparisons and evaluation frameworks',
        navigational: 'Offer clear directions and resource accessibility',
        local: 'Emphasize location-specific benefits and accessibility'
      },
      h3: {
        informational: 'Provide specific details, examples, and deeper insights',
        transactional: 'Detail specific actions and implementation tips',
        commercial: 'Focus on specific features and comparative advantages',
        navigational: 'Give precise instructions and resource details',
        local: 'Highlight specific local features and benefits'
      },
      conclusion: {
        informational: 'Summarize key learnings and provide next steps for continued education',
        transactional: 'Reinforce action steps and provide clear conversion path',
        commercial: 'Final recommendation summary and decision reinforcement',
        navigational: 'Final resource direction and accessibility confirmation',
        local: 'Reinforce local value and next steps for engagement'
      },
      faq: {
        informational: 'Answer common questions with clear, educational explanations',
        transactional: 'Address implementation and action-related questions',
        commercial: 'Resolve comparison and decision-making questions',
        navigational: 'Clarify access and resource questions',
        local: 'Answer location-specific and service questions'
      }
    }
    
    const strategy = sectionStrategies[sectionType as keyof typeof sectionStrategies]?.[primaryIntent] || 
                     sectionStrategies.h2[primaryIntent] // fallback to h2 strategy
    
    const intentInfo = intentMap[primaryIntent]
    
    return `${intentInfo.description}
Characteristics: ${intentInfo.characteristics}
Section Strategy: ${strategy}
Content Focus: ${primaryIntent === 'informational' ? 'Educational value and comprehensive coverage' :
                   primaryIntent === 'transactional' ? 'Action-oriented content and clear conversion paths' :
                   primaryIntent === 'commercial' ? 'Comparative analysis and decision support' :
                   primaryIntent === 'navigational' ? 'Clear direction and resource accessibility' :
                   'Geographic relevance and local optimization'}`
  }, 'Readers want to learn, understand, or discover information\nCharacteristics: Seeking knowledge, explanations, tutorials, and comprehensive guides\nSection Strategy: Start with comprehensive context, establish expertise, and preview what readers will learn\nContent Focus: Educational value and comprehensive coverage') // Fallback to informational intent
}

function getStyleGuidance(style: string, audience: string): string {
  return safeExecute(() => {
    // Validate inputs
    if (!style || typeof style !== 'string' || style.trim().length === 0) {
      style = 'Professional' // Default fallback
    }
    
    const styleMap: Record<string, string> = {
      Professional: 'Use formal language, industry terminology, and authoritative tone. Cite sources frequently. Avoid casual expressions or humor.',
      Conversational: 'Write as if speaking to a friend. Use "you" and "your." Include relatable examples. Keep sentences short and punchy.',
      Technical: 'Use precise terminology. Include specifications, technical details, and in-depth explanations. Audience has domain expertise.',
      Casual: 'Relaxed, friendly tone. Use contractions, colloquialisms. Focus on relatability over formality.',
      Formal: 'Academic or business writing. No contractions. Objective, third-person perspective. Highly structured.',
    }
    
    return styleMap[style] || styleMap.Professional
  }, 'Use formal language, industry terminology, and authoritative tone. Cite sources frequently. Avoid casual expressions or humor.') // Fallback to professional style
}

function formatResearchSources(sources: TavilySource[]): string {
  return safeExecute(() => {
    // Validate inputs
    if (!Array.isArray(sources) || sources.length === 0) {
      return 'No research sources available.'
    }
    
    return sources.slice(0, 10).map((source, index) => {
      // Validate source structure
      if (!source || typeof source !== 'object') {
        return `${index + 1}. Invalid source format`
      }
      
      // Sanitize URL to prevent LLM from breaking it with spaces/newlines
      const cleanUrl = (source.url || '#').replace(/\s+/g, '').replace(/\n/g, '')
      
      const excerpt = (source as any).content?.slice(0, 200) || 'No excerpt available'
      const authority = cleanUrl?.includes('.edu') ? '🎓 Academic' :
                       cleanUrl?.includes('.gov') ? '🏛️ Government' :
                       '📰 Industry'
      
      return `${index + 1}. [${source.title || 'Untitled'}](${cleanUrl}) ${authority}
   Excerpt: ${excerpt}...
   Relevance: ${(source as any).relevanceScore || (source as any).relevance_score || 'High'}`
    }).join('\n\n')
  }, 'No research sources available.') // Fallback for error cases
}

/**
 * Calculate readability score based on Flesch-Kincaid Grade Level algorithm
 * Returns grade level (1-20 scale) where 10-12 is optimal for general audience
 */
function calculateReadabilityScore(content: string): number {
  return safeExecute(() => {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return 12.0 // Default to Grade 12 for empty content
    }

    // Clean content: remove markdown, URLs, and extra whitespace
    const cleanContent = content
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/[#*_`~]/g, '') // Remove markdown formatting
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    if (cleanContent.length < 20) {
      return 12.0 // Default for very short content
    }

    // Split into sentences and words
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = cleanContent.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((total, word) => {
      return total + countSyllables(word)
    }, 0)

    if (sentences.length === 0 || words.length === 0) {
      return 12.0
    }

    // Flesch-Kincaid Grade Level formula
    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length
    
    const score = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
    
    // Clamp to reasonable range (1-20)
    return Math.max(1, Math.min(20, Math.round(score * 10) / 10))
  }, 12.0) // Fallback to Grade 12
}

/**
 * Count syllables in a word using common English rules
 */
function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0
  
  word = word.toLowerCase()
  
  // Remove silent 'e' at the end
  if (word.endsWith('e') && word.length > 3) {
    word = word.slice(0, -1)
  }
  
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g)
  const count = vowelGroups ? vowelGroups.length : 0
  
  // Ensure at least 1 syllable for non-empty words
  return Math.max(1, count)
}

/**
 * Validate content structure follows proper H1-H3 hierarchy
 * Returns validation result with specific issues found
 */
function validateContentStructure(content: string): {
  isValid: boolean
  issues: string[]
  hierarchy: string[]
} {
  return safeExecute(() => {
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        issues: ['Content is empty or invalid'],
        hierarchy: []
      }
    }

    const issues: string[] = []
    const hierarchy: string[] = []
    
    // Extract all headings
    const headingMatches = content.matchAll(/^(#{1,6})\s+(.+)$/gm)
    const headings = Array.from(headingMatches)
    
    if (headings.length === 0) {
      return {
        isValid: false,
        issues: ['No headings found - content needs structure'],
        hierarchy: []
      }
    }

    let lastLevel = 0
    
    for (const [fullMatch, hashes, title] of headings) {
      const level = hashes.length
      
      // Check for skipped levels (e.g., H1 to H3 without H2)
      if (level > lastLevel + 1 && lastLevel > 0) {
        issues.push(`Skipped heading level: H${lastLevel} to H${level} in "${title.trim()}"`)
      }
      
      // Check for multiple H1 headings (should only have one)
      if (level === 1 && hierarchy.some(h => h.startsWith('H1'))) {
        issues.push(`Multiple H1 headings found: "${title.trim()}"`)
      }
      
      hierarchy.push(`H${level}: ${title.trim()}`)
      lastLevel = level
    }

    // Check if content starts with H1 or H2 (proper structure)
    const firstHeading = hierarchy[0]
    if (!firstHeading?.startsWith('H1') && !firstHeading?.startsWith('H2')) {
      issues.push('Content should start with H1 or H2 heading')
    }

    // Check for proper H2-H3 structure
    const hasH2 = hierarchy.some(h => h.startsWith('H2'))
    const hasH3 = hierarchy.some(h => h.startsWith('H3'))
    
    if (hasH3 && !hasH2) {
      issues.push('H3 headings found but no H2 headings - improper hierarchy')
    }

    return {
      isValid: issues.length === 0,
      issues,
      hierarchy
    }
  }, {
    isValid: false,
    issues: ['Structure validation failed'],
    hierarchy: []
  })
}

/**
 * Performance monitoring utility for SEO helper functions
 * Tracks execution time to verify <50ms performance requirement
 */
function measurePerformance<T>(fn: () => T, functionName: string): { result: T; executionTime: number } {
  const startTime = performance.now()
  const result = fn()
  const endTime = performance.now()
  const executionTime = Math.round((endTime - startTime) * 100) / 100 // Convert to ms with 2 decimal places
  
  // Log warning if exceeding 50ms threshold
  if (executionTime > 50) {
    console.warn(`[SectionProcessor] Performance: ${functionName} took ${executionTime}ms (exceeds 50ms target)`)
  } else {
    console.log(`[SectionProcessor] Performance: ${functionName} completed in ${executionTime}ms`)
  }
  
  return { result, executionTime }
}

function getEnhancedSectionGuidance(
  sectionType: string, 
  sectionTitle: string, 
  keyword: string, 
  targetWordCount: number
): string {
  const targetDensity = calculateTargetDensity(targetWordCount, sectionType)
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
    content_structure?: {
      is_valid: boolean
      issues: string[]
      hierarchy: string[]
    }
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

  // Track token usage and context optimization metrics for Story 20.5
  const tokenUsageStats = getTokenUsageStats(articleId)
  const cachePerformanceStats = getCachePerformanceStats()
  const contextPerformanceMetrics = getContextPerformanceMetrics()
  
  if (tokenUsageStats) {
    console.log(`[SectionProcessor] Context optimization: ${tokenUsageStats.optimizationMetrics.reduction}% reduction, ${tokenUsageStats.contextTokens} tokens`)
  }
  
  if (cachePerformanceStats.hitRate > 0) {
    console.log(`[SectionProcessor] Cache performance: ${cachePerformanceStats.hitRate * 100}% hit rate`)
  }

  // Use batch research optimization (Story 20.2: Batch Research Optimizer)
  let researchSources: TavilySource[] = []
  let researchQueryUsed = ''
  let researchFailed = false

  try {
    // Get section-specific research sources from batch research cache
    researchSources = getSectionResearchSources(articleId, sectionInfo.title)
    
    if (researchSources.length > 0) {
      console.log(`[SectionProcessor] Using batch research cache for section: "${sectionInfo.title}" (${researchSources.length} sources)`)
    } else {
      // Fallback: Perform section-specific research if batch research unavailable
      console.warn(`[SectionProcessor] No batch research found for section: "${sectionInfo.title}". Using fallback research.`)
      
      // Generate research query from section topic + keyword + previous sections
      researchQueryUsed = generateResearchQuery(sectionInfo.title, article.keyword as string, previousSections)
      
      // Normalize query for cache lookup
      const normalizedQuery = normalizeQuery(researchQueryUsed)
      
      // Check cache first (24-hour TTL)
      const cachedResults = await checkResearchCache(organizationId, normalizedQuery)
      
      if (cachedResults) {
        researchSources = cachedResults
        console.log(`[SectionProcessor] Using fallback cached research for query: "${researchQueryUsed}" (${researchSources.length} sources)`)
      } else {
        // Call Tavily API with retry logic as fallback
        console.log(`[SectionProcessor] Performing fallback Tavily research for query: "${researchQueryUsed}"`)
        researchSources = await researchQuery(researchQueryUsed, {
          maxRetries: 3,
          retryDelay: 1000,
          maxResults: 20,
          maxSources: 10
        })
        
        // Store results in cache (24-hour TTL)
        await storeResearchCache(organizationId, normalizedQuery, researchSources)
        
        // Track API cost ($0.08 per query)
        await trackApiCost(organizationId, 'tavily', 'section_research_fallback', 0.08)
        
        console.log(`[SectionProcessor] Fallback research completed: ${researchSources.length} sources cached and cost tracked`)
      }
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
    console.warn(`Section generated without research: ${sectionInfo.title}`)
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

  // Smart Quality Retry System (Story 20.4)
  // Use enhanced validation with critical/minor classification and auto-fix
  let qualityRetryCount = 0
  const targetWordCount = getTargetWordCount(sectionInfo.type)
  let enhancedQualityResult = validatePromptQuality(
    contentWithCitations, // Validate final content with citations
    targetWordCount,
    article.keyword as string,
    sectionInfo.type,
    qualityRetryCount
  )

  // Track initial quality metrics for Story 20.4
  performanceMonitor.recordQualityMetrics(
    articleId,
    enhancedQualityResult.passed,
    enhancedQualityResult.qualityScore
  )

  // Track context optimization metrics for Story 20.5
  if (tokenUsageStats) {
    performanceMonitor.recordContextOptimizationMetrics(
      articleId,
      tokenUsageStats.contextTokens,
      tokenUsageStats.optimizationMetrics.reduction,
      cachePerformanceStats.hitRate
    )
  }

  // Apply auto-fix for minor issues first with proper validation
  if (enhancedQualityResult.autoFixAvailable && enhancedQualityResult.minorIssues.length > 0) {
    console.log(`[SectionProcessor] Auto-fixing ${enhancedQualityResult.minorIssues.length} minor issues for section ${sectionIndex}`)
    
    const autoFixResult = autoFixMinorIssues(
      contentWithCitations,
      enhancedQualityResult.minorIssues,
      targetWordCount,
      article.keyword as string,
      sectionInfo.type
    )
    
    // Validate that auto-fix didn't break content structure
    if (autoFixResult.fixedContent && autoFixResult.fixedContent.length > 50) {
      contentWithCitations = autoFixResult.fixedContent
      console.log(`[SectionProcessor] Applied fixes: ${autoFixResult.fixesApplied.join(', ')}`)
      
      // Re-validate after auto-fix
      const preFixScore = enhancedQualityResult.qualityScore
      enhancedQualityResult = validatePromptQuality(
        contentWithCitations,
        targetWordCount,
        article.keyword as string,
        sectionInfo.type,
        qualityRetryCount
      )
      
      // Log improvement or degradation
      const scoreChange = enhancedQualityResult.qualityScore - preFixScore
      if (scoreChange > 0) {
        console.log(`[SectionProcessor] Auto-fix improved quality score by ${scoreChange.toFixed(1)} points`)
      } else if (scoreChange < 0) {
        console.warn(`[SectionProcessor] Auto-fix degraded quality score by ${Math.abs(scoreChange).toFixed(1)} points`)
      }
    } else {
      console.warn(`[SectionProcessor] Auto-fix produced invalid content, skipping fixes`)
    }
  }

  // Only retry if critical issues remain (1 retry max for performance)
  if (!enhancedQualityResult.passed && enhancedQualityResult.criticalIssues.length > 0 && qualityRetryCount < 1) {
    qualityRetryCount++
    console.warn(`Section ${sectionIndex} has ${enhancedQualityResult.criticalIssues.length} critical issues, retrying (attempt ${qualityRetryCount})`)
    
    try {
      // Generate targeted retry prompt
      const retryPrompt = generateTargetedRetryPrompt(
        enhancedQualityResult.issues,
        contentWithCitations,
        article.keyword as string,
        sectionInfo.type
      )
      
      // Regenerate with targeted prompt
      generationResult = await generateSectionContent(
        article.keyword as string,
        sectionInfo,
        optimizedContext,
        researchSources,
        organizationId,
        article.writing_style || 'Professional',
        article.target_audience || 'General',
        retryPrompt // Use targeted retry prompt instead of custom instructions
      )
      
      // Re-integrate citations
      contentWithCitations = formatCitationsForMarkdown(
        generationResult.content,
        researchSources,
        1, // minCitations
        3  // maxCitations
      )
      
      // Re-validate with enhanced system
      enhancedQualityResult = validatePromptQuality(
        contentWithCitations,
        targetWordCount,
        article.keyword as string,
        sectionInfo.type,
        qualityRetryCount
      )
      
      // Apply auto-fix again if needed
      if (enhancedQualityResult.autoFixAvailable && enhancedQualityResult.minorIssues.length > 0) {
        const autoFixResult = autoFixMinorIssues(
          contentWithCitations,
          enhancedQualityResult.minorIssues,
          targetWordCount,
          article.keyword as string,
          sectionInfo.type
        )
        
        contentWithCitations = autoFixResult.fixedContent
        console.log(`[SectionProcessor] Applied post-retry fixes: ${autoFixResult.fixesApplied.join(', ')}`)
      }
      
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

  // Calculate readability score for quality metrics
  const readabilityScore = calculateReadabilityScore(contentWithCitations)
  
  // Validate content structure hierarchy
  const structureValidation = validateContentStructure(contentWithCitations)

  // NEW: Apply format validation and corrections (Story 14-5)
  const formatValidationResult = validateContentWithErrorHandling(
    contentWithCitations, 
    sectionInfo.type, 
    `section-${sectionIndex}`
  )
  
  // Use the corrected content if format validation found issues
  const finalContent = formatValidationResult.content
  const formatValidation = formatValidationResult.validation

  // Enhance quality metrics with readability, structure, and format data
  const enhancedQualityMetrics = {
    ...enhancedQualityResult.metrics,
    readability_score: readabilityScore,
    content_structure: {
      is_valid: structureValidation.isValid,
      issues: structureValidation.issues,
      hierarchy: structureValidation.hierarchy
    },
    format_validation: {
      is_valid: formatValidation.isValid,
      issues: formatValidation.issues,
      suggestions: formatValidation.suggestions,
      processing_time: formatValidation.processingTime
    },
    smart_quality_metrics: {
      quality_score: enhancedQualityResult.qualityScore,
      critical_issues_count: enhancedQualityResult.criticalIssues.length,
      minor_issues_count: enhancedQualityResult.minorIssues.length,
      auto_fix_applied: enhancedQualityResult.autoFixAvailable,
      retry_count: qualityRetryCount
    }
  }

  const section: Section = {
    section_type: sectionInfo.type,
    section_index: sectionIndex,
    h2_index: sectionInfo.h2Index,
    h3_index: sectionInfo.h3Index,
    title: sectionInfo.title,
    content: finalContent, // Use format-corrected content (Story 14-5)
    word_count: finalContent.split(/\s+/).filter(w => w.length > 0).length,
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
    quality_metrics: enhancedQualityMetrics
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
  
  // Use performance monitoring for SEO helper functions
  const densityResult = measurePerformance(() => 
    calculateTargetDensity(targetWordCount, sectionInfo.type), 
    'calculateTargetDensity'
  )
  const semanticResult = measurePerformance(() => 
    generateSemanticKeywords(keyword), 
    'generateSemanticKeywords'
  )
  const intentResult = measurePerformance(() => 
    getUserIntentSignals(keyword, sectionInfo.type), 
    'getUserIntentSignals'
  )
  const styleResult = measurePerformance(() => 
    getStyleGuidance(writingStyle, targetAudience), 
    'getStyleGuidance'
  )
  
  const targetDensity = densityResult.result
  const semanticKeywords = semanticResult.result
  const intentSignals = intentResult.result
  const styleGuidance = styleResult.result
  
  // Enhanced SEO-optimized system prompt with E-E-A-T principles and readability targets
  const systemMessage = `You are an elite SEO content strategist and expert writer specializing in high-ranking, user-focused content that satisfies both search engines and human readers.

**Your Core Objectives:**
1. Create content that ranks on page 1 for target keywords while providing genuine value
2. Write naturally for humans first, optimize for search engines second
3. Demonstrate expertise, experience, authority, and trustworthiness (E-E-A-T) in every section
4. Match user search intent precisely with comprehensive coverage
5. Integrate citations seamlessly for credibility and trust building

**E-E-A-T Implementation Requirements:**
- **Expertise:** Show deep knowledge through accurate, detailed information and industry insights
- **Experience:** Share practical examples, case studies, and real-world applications
- **Authoritativeness:** Reference credible sources, cite experts, and demonstrate industry leadership
- **Trustworthiness:** Provide accurate information, be transparent, and build reader confidence

**Readability Standards:**
- Target Grade 10-12 reading level for broad accessibility and comprehension
- Use clear, concise sentences (15-20 words average)
- Structure content with proper hierarchy and logical flow
- Ensure content is easily scannable with strategic formatting

**SEO Writing Principles:**
- Use the primary keyword naturally in the first 100 words for search prominence
- Include semantic variations and LSI keywords throughout for topical depth
- Write in active voice with clear, scannable sentences for engagement
- Front-load important information (inverted pyramid style) for user value
- Use transition words for readability and logical flow between ideas
- Include specific examples, data, and actionable insights for expertise
- Optimize for featured snippets with concise definitions and structured content
- Write compelling meta-worthy content in opening paragraphs for click-through rates

**Content Structure Requirements:**
- Start each major section with a clear topic sentence containing relevant keywords
- Use H2/H3 hierarchy properly (never skip levels) for semantic structure
- Keep paragraphs 2-4 sentences for optimal readability (Grade 10-12 target)
- Use bullet points/lists only when they enhance clarity (not by default)
- Include relevant statistics within the first 200 words of sections for authority
- End sections with natural transitions to the next topic for flow

**Important - DO NOT Include Citations:**
- Write content without any citations, links, or references
- Do not use markdown links like [text](url)
- Citations will be added automatically after generation
- Focus only on writing high-quality, informative content
- Reference credible sources in your writing but do not include URLs or markdown links

**Semantic SEO Guidelines:**
- Include LSI (Latent Semantic Indexing) keywords naturally throughout content
- Use topic clusters and related concepts to build topical authority
- Create semantic relationships between primary and secondary keywords
- Ensure content comprehensively covers the topic for search engine understanding

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
  
  // Get section template for structured content generation (Story 14.3)
  const templateContext: TemplateContext = {
    sectionType: sectionInfo.type as 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq',
    keyword,
    targetAudience,
    contentType: 'blog_post' // Default content type
  }
  const sectionTemplate = getSectionTemplate(templateContext)
  const processedTemplate = processTemplate(sectionTemplate, templateContext)
  
  // Generate enhanced SEO strategy components
  const enhancedSemanticKeywords = generateEnhancedSemanticKeywords(keyword, sectionInfo.type)
  const keywordPlacementStrategy = createKeywordPlacementStrategy(keyword, enhancedSemanticKeywords, sectionInfo.type, targetWordCount)
  const targetAudienceGuidance = generateTargetAudienceGuidance(targetAudience, keyword, sectionInfo.type)
  const searchIntentGuidance = generateSearchIntentGuidance(keyword, sectionInfo.type)

  // Build comprehensive user message with enhanced SEO optimization
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
    `🎯 **ENHANCED SEO STRATEGY & KEYWORD TARGETING**`,
    '',
    `**Primary Keyword:** "${keyword}"`,
    `**Enhanced Semantic Keywords:** ${enhancedSemanticKeywords}`,
    `**Search Intent Strategy:**`,
    searchIntentGuidance,
    '',
    `**Strategic Keyword Placement:**`,
    keywordPlacementStrategy,
    '',
    `**Target Audience Alignment:**`,
    targetAudienceGuidance,
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
    `📋 **STRUCTURED TEMPLATE GUIDANCE**`,
    '',
    `**Template Type:** ${sectionTemplate.type}`,
    `**Target Word Count:** ${sectionTemplate.wordCount} words`,
    `**SEO Rules:**`,
    `- Keyword Placement: ${sectionTemplate.seoRules.keywordPlacement}`,
    `- Density Target: ${sectionTemplate.seoRules.densityTarget}%`,
    `- Hook Required: ${sectionTemplate.seoRules.hookRequired ? 'Yes' : 'No'}`,
    '',
    `**Template Structure Reference:**`,
    processedTemplate,
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
    `✅ **ENHANCED QUALITY CHECKLIST**`,
    '',
    `**SEO Optimization:**`,
    `☐ Primary keyword "${keyword}" appears ${targetDensity} times naturally`,
    `☐ Enhanced semantic keywords integrated: ${enhancedSemanticKeywords}`,
    `☐ Strategic keyword placement implemented per section type`,
    `☐ Search intent alignment: ${searchIntentGuidance.split('\n')[0]}`,
    `☐ Target audience considerations addressed`,
    `☐ Heading includes keyword or semantic variation`,
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
    `2. Implements enhanced SEO strategy with semantic keywords and strategic placement`,
    `3. Satisfies search intent completely with audience-aligned content`,
    `4. Establishes topical authority through depth and citations`,
    `5. Engages ${targetAudience} with ${writingStyle.toLowerCase()} writing`,
    `6. Integrates seamlessly with previous content`,
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
    model: 'perplexity/sonar' // Using Perplexity for consistency with other services
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
  calculateReadabilityScore,
  validateContentStructure,
  measurePerformance,
  getEnhancedSectionGuidance,
  createKeywordPlacementStrategy,
  generateEnhancedSemanticKeywords,
  generateTargetAudienceGuidance,
  generateSearchIntentGuidance
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

