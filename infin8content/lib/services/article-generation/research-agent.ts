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

// Re-export ResearchAgentOutput for other modules
export type { ResearchAgentOutput }

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
Limit searches to 10 maximum.

You MUST return ONLY valid JSON in this exact format:

{
  "queries": string[],
  "results": [
    {
      "query": string,
      "answer": string,
      "citations": string[]
    }
  ],
  "total_searches": number
}

Rules:
- Do not include markdown.
- Do not include triple backticks.
- Do not include explanations.
- Do not include commentary.
- Do not include any text before or after the JSON.
- Return ONLY raw JSON.`;

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
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Research timeout: 30 seconds exceeded')), 30000)
  })

  try {
    // Execute research with timeout and retry policy
    const result = await Promise.race([
      executeResearchWithRetry(userPrompt),
      timeoutPromise
    ])

    // 🛡️ Cleanup: Stop the timer if research succeeded
    if (timeoutId) clearTimeout(timeoutId)

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
    // 🛡️ Cleanup: Ensure timer is cleared on failure too
    if (timeoutId) clearTimeout(timeoutId)
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
      model: 'openai/gpt-4o-mini',
      maxTokens: 2000,
      temperature: 0,
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
    // Trim whitespace
    const trimmed = content.trim()

    // Fast path: direct JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      return validateResearch(parsed)
    }

    // Extract first valid JSON object safely
    const firstBrace = trimmed.indexOf('{')
    const lastBrace = trimmed.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('No JSON object found in research response')
    }

    const candidate = trimmed.slice(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(candidate)

    return validateResearch(parsed)

  } catch (error) {
    throw new Error('Invalid JSON response from research service')
  }
}

function validateResearch(parsed: any): ResearchAgentOutput {
  if (!Array.isArray(parsed.queries)) {
    throw new Error('Invalid research response: missing queries')
  }

  if (!Array.isArray(parsed.results)) {
    throw new Error('Invalid research response: missing results')
  }

  for (const r of parsed.results) {
    if (typeof r.query !== 'string') {
      throw new Error('Invalid research result: missing query')
    }
    if (typeof r.answer !== 'string') {
      throw new Error('Invalid research result: missing answer')
    }
    if (!Array.isArray(r.citations)) {
      throw new Error('Invalid research result: missing citations')
    }
  }

  return {
    queries: parsed.queries,
    results: parsed.results,
    totalSearches: parsed.total_searches ?? parsed.queries.length
  }
}


