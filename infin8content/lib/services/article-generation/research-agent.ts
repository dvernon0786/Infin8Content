/**
 * Research Agent Service
 * Story B-2: Research Agent Service
 * 
 * Calls Perplexity Sonar with fixed prompt to gather current information
 * for each article section, ensuring content is grounded in accurate data.
 */

import { generateContent } from '../openrouter/openrouter-client'
import { retryWithPolicy, DEFAULT_RETRY_POLICY } from '../intent-engine/retry-utils'
import { ResearchAgentOutput, ArticleSection } from '../../../types/article'

// Export the input interface for API endpoint use
export interface ResearchAgentInput {
  sectionHeader: string
  sectionType: string
  priorSections: ArticleSection[]
  organizationContext: {
    name: string
    description: string
    website?: string
    industry?: string
  }
}

/**
 * Research Agent Retry Policy
 * Centralized to prevent drift and ensure consistency
 */
export const RESEARCH_AGENT_RETRY_POLICY = {
  ...DEFAULT_RETRY_POLICY,
  initialDelayMs: 2000, // 2s, 4s, 8s backoff
  maxAttempts: 3
} as const

/**
 * Fixed system prompt - LOCKED, never to be modified or configurable
 * This is the exact specification from Story B-2 requirements
 */
export const RESEARCH_AGENT_SYSTEM_PROMPT = `You are a research assistant. Your task is to research the following section:

Section: {section_header}
Type: {section_type}

Context from prior sections:
{prior_sections_summary}

Organization context:
{organization_description}

Provide comprehensive research with:
1. Direct answers to the section topic
2. Current data and statistics
3. Expert perspectives
4. Actionable insights

Include citations for all claims.
Limit searches to 10 maximum.`

/**
 * Run research agent for a given section
 * 
 * @param input - Section context and requirements
 * @returns Research results with queries, answers, and citations
 */
export async function runResearchAgent(
  input: ResearchAgentInput
): Promise<ResearchAgentOutput> {
  const { sectionHeader, sectionType, priorSections, organizationContext } = input

  // Build structured user prompt per story specification
  const priorSectionsSummary = priorSections.length > 0 
    ? priorSections.map(section => `- ${section.section_header}: ${section.section_type}`).join('\n')
    : 'No prior sections'
  
  const organizationDescription = `${organizationContext.name} - ${organizationContext.description}${organizationContext.industry ? ` (${organizationContext.industry})` : ''}`

  const userPrompt = `Section: ${sectionHeader}
Type: ${sectionType}

Context from prior sections:
${priorSectionsSummary}

Organization context:
${organizationDescription}`.trim()

  // Create timeout promise (30 seconds)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Research timeout: 30 seconds exceeded')), 30000)
  })

  try {
    // Execute research with timeout and retry policy
    const result = await Promise.race([
      executeResearchWithRetry(userPrompt),
      timeoutPromise
    ])

    // Parse and validate response
    const researchData = parseResearchResponse(result.content)
    
    // Enforce 10 search limit
    if (researchData.queries.length > 10) {
      researchData.queries = researchData.queries.slice(0, 10)
      researchData.results = researchData.results.slice(0, 10)
      researchData.totalSearches = 10
    }

    return researchData
  } catch (error) {
    console.error('Research agent failed:', error)
    throw error
  }
}

/**
 * Execute research with retry policy
 */
async function executeResearchWithRetry(userPrompt: string) {
  return retryWithPolicy(
    () => generateContent([
      {
        role: 'system',
        content: RESEARCH_AGENT_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userPrompt
      }
    ], {
      model: 'perplexity/llama-3.1-sonar-small-128k-online',
      maxTokens: 2000,
      temperature: 0.7,
      maxRetries: 3,
      retryDelay: 2000
    }),
    RESEARCH_AGENT_RETRY_POLICY,
    'research-agent'
  )
}

/**
 * Parse and validate research response from Perplexity
 */
function parseResearchResponse(content: string): ResearchAgentOutput {
  try {
    const parsed = JSON.parse(content)
    
    // Validate structure
    if (!parsed.queries || !Array.isArray(parsed.queries)) {
      throw new Error('Invalid research response: missing queries array')
    }
    
    if (!parsed.results || !Array.isArray(parsed.results)) {
      throw new Error('Invalid research response: missing results array')
    }

    // Validate each result has required fields
    for (const result of parsed.results) {
      if (!result.query || typeof result.query !== 'string') {
        throw new Error('Invalid research response: result missing query')
      }
      if (!result.answer || typeof result.answer !== 'string') {
        throw new Error('Invalid research response: result missing answer')
      }
      if (!result.citations || !Array.isArray(result.citations)) {
        throw new Error('Invalid research response: result missing citations array')
      }
    }

    return {
      queries: parsed.queries,
      results: parsed.results,
      totalSearches: parsed.total_searches || parsed.queries.length
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from research service')
    }
    throw error
  }
}

