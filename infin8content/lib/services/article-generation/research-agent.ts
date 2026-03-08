/**
 * Research Agent Service
 * Story B-2: Research Agent Service
 *
 * Synthesises structured research grounded in real Tavily web sources.
 * The LLM synthesises FROM provided sources only — it never invents citations.
 *
 * Architecture:
 *   1. Tavily fetches real sources (title, excerpt, published_date, domain)
 *   2. Sources are injected into the LLM prompt as grounding context
 *   3. LLM synthesises answers and extracts citations FROM those sources only
 *   4. Writing agent receives grounded [Publication, Year, Topic](URL) citations from verified sources only
 */

import { z } from 'zod'
import { generateContent, type OpenRouterMessage } from '../openrouter/openrouter-client'
import { researchQuery, type TavilySource } from '../tavily/tavily-client'
import { ResearchPayload } from '../../../types/article'

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const ResearchOutputSchema = z.object({
  research_questions: z.array(z.string()),
  consolidated_queries: z.array(z.string()),
  research_results: z.array(
    z.object({
      query: z.string(),
      answer: z.string(),
      citations: z.array(z.string()),
      source_urls: z.array(z.string()).default([]), // 🔗 NEW: Capture URLs per result (Phase 6)
      source_types_found: z.array(z.string())
    })
  ),
  total_searches: z.number()
})

export type { ResearchPayload }

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ResearchAgentInput {
  sectionHeader: string
  sectionType: string
  researchQuestions: string[]
  supportingPoints: string[]
  priorSectionsSummary: string
  organizationContext: {
    name: string
    description: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

export const RESEARCH_AGENT_SYSTEM_PROMPT = `Role
You are an expert Research Analyst. Your purpose is to analyse research questions and synthesise accurate, well-cited answers EXCLUSIVELY from the real web sources provided to you in the user message.

Core Rule
You must ONLY use information present in the provided GROUNDING SOURCES.
Do NOT draw on training knowledge for facts, statistics, or data.
Do NOT invent or extrapolate any information not present in the sources.
If the provided sources do not answer a question, respond with "Insufficient data found in provided sources" for that query — do not guess.

Constraints
• Analyse and consolidate research questions to eliminate redundancy
• Develop up to 10 structured research queries based on consolidated questions
• Each source summary must include a clear conclusion drawn from the source text
• Maintain objectivity while supporting the provided points
• Do NOT fabricate statistics, percentages, dollar figures, or named studies
• Do NOT fabricate URLs under any circumstances
• Citations must be extracted from the provided source metadata only
• Limit total citations across all results to a maximum of 5
• For each research question, provide the complete synthesised answer from the sources

Inputs
• Research Questions: Specific questions to be researched
• Supporting Points: Key points that need evidence backing
• Grounding Sources: Real web sources fetched by the system — your ONLY permitted evidence base
• Additional Context: article structure from content planner

Tools
None. Synthesise research from the GROUNDING SOURCES provided in the user message only.

Citation Rules (strictly enforced)
• Citations must be derived ONLY from the GROUNDING SOURCES list provided
• Format: [Publication Name, Year, Topic](URL)
  — Publication Name: extracted from the source Title or Domain field
  — Year: extracted from the source Published Date field, or omit if unavailable
  — Topic: a 2–5 word description of what the source covers
  — URL: the exact URL from the source's URL field
  — Example: [Gartner, 2025, CRM Failure Rates](https://gartner.com/...)
• NEVER invent a URL not present in the GROUNDING SOURCES
• Maximum 5 citations across ALL research_results in a single response
• If no sources are available for a query, state "Insufficient data found in provided sources" — do not guess.

Instructions

Step 1: Question Analysis
• Review all incoming research questions
• Identify overlapping themes and topics
• Consolidate similar questions to avoid redundant searches
• Create a streamlined list of unique research angles

Step 2: Source Review
• Read all GROUNDING SOURCES carefully
• Map each source to the research questions it can answer
• Note which questions have strong source coverage and which have gaps
• For gaps, record "Insufficient data found in provided sources"

Step 3: Synthesis and Documentation
• For each consolidated query, synthesise an answer drawing only from mapped sources
• Document:
  • Query: the research question being answered
  • Answer: full synthesised response from source content (not summarised)
  • Citations: extracted from source metadata using the citation format above
  • Source URLs: list the raw URL strings for every source used in this result's answer
  • Source Types Found: describe the type of each source used (news, study, report, blog, etc.)

Conclusions
Compile all research into the JSON output schema below.
Do not output free-form text — JSON only.

Return ONLY valid JSON.
Do not include explanations.
Do not include markdown.
Do not include trailing commas.
JSON only.

Output schema:
{
  "research_questions": ["string"],
  "consolidated_queries": ["string"],
  "research_results": [
    {
      "query": "string",
      "answer": "string",
      "citations": ["string"],
      "source_urls": ["string"],
      "source_types_found": ["string"]
    }
  ],
  "total_searches": number
}`

// ─────────────────────────────────────────────────────────────────────────────
// TAVILY GROUNDING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch real web sources for the top research questions.
 * Caps at 3 Tavily queries and 8 total sources to control cost and context size.
 * Falls back gracefully to empty array if Tavily is unavailable or errors.
 */
async function fetchGroundingSources(
  researchQuestions: string[]
): Promise<TavilySource[]> {
  // Only query the top 3 questions to cap Tavily API cost
  const topQuestions = researchQuestions.slice(0, 3)

  const settled = await Promise.allSettled(
    topQuestions.map(q =>
      researchQuery(q, {
        maxResults: 5,  // fetch 5 candidates from Tavily per query
        maxSources: 3,  // keep top 3 by relevance score after ranking
      })
    )
  )

  // Log any Tavily failures so config issues (e.g. bad API key) are visible in logs
  settled.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[ResearchAgent] Tavily query ${i + 1} failed:`, r.reason)
    }
  })

  const sources: TavilySource[] = settled
    .filter((r): r is PromiseFulfilledResult<TavilySource[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    // Deduplicate by URL
    .filter((source, index, arr) => arr.findIndex(s => s.url === source.url) === index)
    // Hard cap: max 8 sources passed to the LLM to control context size
    .slice(0, 8)

  if (sources.length === 0) {
    console.warn('[ResearchAgent] Tavily returned no sources — LLM will have no grounding context.')
  } else {
    console.log(`[ResearchAgent] Fetched ${sources.length} grounding sources from Tavily.`)
  }

  return sources
}

/**
 * Format Tavily sources into a structured block for the LLM prompt.
 *
 * URLs are intentionally excluded — the LLM must derive citations from
 * title/domain/date metadata only, never from raw URLs.
 * This prevents the "sentence wrapped as markdown hyperlink to homepage" bug.
 */
function formatGroundingSources(sources: TavilySource[]): string {
  if (sources.length === 0) {
    return 'No external sources were retrieved. State "Insufficient data found" for all queries rather than drawing on training knowledge.'
  }

  return sources
    .map((s, i) => {
      // Extract a clean domain name for citation derivation
      let domain = 'Unknown'
      try {
        domain = new URL(s.url).hostname.replace(/^www\./, '')
      } catch {
        // malformed URL — leave as Unknown
      }

      // Extract year from published_date for citation use
      const year = s.published_date
        ? new Date(s.published_date).getFullYear().toString()
        : null

      return [
        `[Source ${i + 1}]`,
        `Title: ${s.title || 'No title'}`,
        `Domain: ${domain}`,
        `URL: ${s.url}`,                    // 🔗 ADDED: For LLM hyperlinking (Phase 6)
        `Published: ${year ?? 'n/a'}`,      // 🔗 RELAXED: Don't block citation if undated
        `Relevance Score: ${s.relevance_score.toFixed(2)}`,
        `Excerpt: ${s.excerpt.slice(0, 500).trim()}`,
      ].join('\n')
    })
    .join('\n\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MESSAGE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildUserMessage(
  input: ResearchAgentInput,
  groundingSources: TavilySource[]
): string {
  return `Section header:
${input.sectionHeader}

Section type:
${input.sectionType}

Research questions:
${input.researchQuestions.join('\n')}

Supporting points to back with evidence:
${input.supportingPoints.join('\n')}

Article context (prior completed sections):
${input.priorSectionsSummary}

Organization context:
${input.organizationContext.name} — ${input.organizationContext.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUNDING SOURCES — synthesise from these only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatGroundingSources(groundingSources)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REMINDER: Cite sources using the exact format: [Publication Name, Year, Topic](URL)
— Use the URL field from the GROUNDING SOURCE block above.
— Never invent a URL. Only use URLs explicitly listed in the sources.
— If a source has no URL, omit the link: [Publication Name, Year, Topic]
— Also populate source_urls with the raw URL for each source cited in this result.
Do NOT invent any data, statistics, or claims not present in the excerpts above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run research agent for a given section.
 *
 * Flow:
 *   1. Fetch real Tavily sources for the top research questions
 *   2. Inject sources as grounding context into the LLM prompt
 *   3. LLM synthesises answers and extracts citations from source metadata only
 *   4. Returns structured ResearchPayload with grounded [Publication, Year, Topic](URL) citations
 */
export async function runResearchAgent(
  input: ResearchAgentInput
): Promise<ResearchPayload> {

  // ── Step 1: Fetch real grounding sources from Tavily ──────────────────────
  let groundingSources = await fetchGroundingSources(input.researchQuestions)

  // Broaden fallback if queries were too specific and returned no sources
  if (groundingSources.length === 0 && input.researchQuestions.length > 0) {
    console.log('[ResearchAgent] Queries too specific (0 sources). Falling back to broader query.')
    groundingSources = await fetchGroundingSources([input.sectionHeader])
  }

  // ── Step 2: Build grounded prompt ─────────────────────────────────────────
  const userMessage = buildUserMessage(input, groundingSources)

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: RESEARCH_AGENT_SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ]

  // ── Step 3: LLM synthesis ─────────────────────────────────────────────────
  let response

  try {
    console.log('[ResearchAgent] Attempting synthesis with z-ai/glm-4.7')
    response = await generateContent(messages, {
      model: 'z-ai/glm-4.7',
      temperature: 0.0,
      maxTokens: 4000
    })
  } catch (error) {
    console.warn('[ResearchAgent] Primary model failed, using fallback gpt-4o-mini')
    response = await generateContent(messages, {
      model: 'openai/gpt-4o-mini',
      temperature: 0.0,
      maxTokens: 4000
    })
  }

  // ── Step 4: Parse and validate ────────────────────────────────────────────
  const rawJson = extractJson(response.content)
  const validated = ResearchOutputSchema.parse(rawJson)

  // 🔗 VALIDATION LOG: Check if LLM followed source_urls schema
  const totalUrls = validated.research_results.reduce((n, r) => n + (r.source_urls?.length ?? 0), 0)
  if (totalUrls === 0 && groundingSources.length > 0) {
    console.warn('[ResearchAgent] source_urls empty across all results — LLM may not have followed schema')
  }

  // ── Step 5: Map to ResearchPayload ────────────────────────────────────────
  return {
    queries: validated.research_questions,
    consolidated_queries: validated.consolidated_queries,
    results: validated.research_results.map(r => ({
      query: r.query,
      answer: r.answer,
      citations: r.citations,
      source_urls: r.source_urls ?? [], // 🔗 NEW: Map to payload (Phase 6)
    })),
    total_searches: validated.total_searches,
    source_types_found: Array.from(
      new Set(validated.research_results.flatMap(r => r.source_types_found))
    ),
    research_timestamp: new Date().toISOString()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON EXTRACTION UTILITY (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function extractJson(content: string): unknown {
  let trimmed = content.trim()

  // Strip ALL markdown code fences (glm-4.7 sometimes wraps with extra text)
  trimmed = trimmed.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()

  // Try direct parse first
  try {
    return JSON.parse(trimmed)
  } catch { /* continue */ }

  // Extract outermost JSON object (handles preamble/postamble text)
  const match = trimmed.match(/\{[\s\S]*\}/)
  if (match) {
    let candidate = match[0]

    // Remove trailing commas before ] or }
    candidate = candidate.replace(/,\s*([\]}])/g, '$1')

    // Handle control characters that break strict JSON
    candidate = candidate.replace(/[\x00-\x1F\x7F]/g, c =>
      c === '\n' || c === '\r' || c === '\t' ? c : ''
    )

    try {
      return JSON.parse(candidate)
    } catch { /* continue */ }

    // Last resort: single → double quote fix
    candidate = candidate.replace(/'/g, '"')
    try {
      return JSON.parse(candidate)
    } catch { /* continue */ }
  }

  throw new Error('[ResearchAgent] LLM did not return a parseable JSON object')
}
