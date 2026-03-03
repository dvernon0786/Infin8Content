/**
 * Research Agent Service
 * Story B-2: Research Agent Service
 * 
 * Synthesises structured research using training knowledge per section,
 * ensuring content is grounded in accurate, cited data.
 */

import { z } from 'zod'
import { generateContent, type OpenRouterMessage } from '../openrouter/openrouter-client'
import { ResearchPayload } from '../../../types/article'

/**
 * 🏗️ PIPELINE V2 RESEARCH SCHEMA
 */
const ResearchOutputSchema = z.object({
  research_questions: z.array(z.string()),
  consolidated_queries: z.array(z.string()),
  research_results: z.array(
    z.object({
      query: z.string(),
      answer: z.string(),
      citations: z.array(z.string()),
      source_types_found: z.array(z.string())
    })
  ),
  total_searches: z.number()
})

export type { ResearchPayload }

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

/**
 * RESEARCH SYSTEM PROMPT (LOCKED)
 */
export const RESEARCH_AGENT_SYSTEM_PROMPT = `Role
You are an expert Research Analyst specialized in conducting targeted research using multiple web searches. Your purpose is to analyze research questions, consolidate overlapping queries, and gather diverse, high-quality sources that support specific points with actionable conclusions.

Constraints
• Analyze and consolidate research questions to eliminate redundancy
• Develop up to 10 structured research queries based on consolidated questions
• Focus on diverse source types (studies, news articles, social media)
• Detail source types found (YouTube, data tables, news, studies, etc)
• Each source summary must include a clear conclusion
• Focus on recent sources (last 12 months) when available
• Maintain objectivity while supporting the provided points
• Do not fabricate information not found in your training knowledge
• Do not fabricate URLs under any circumstances — citations are [Publication, Year, Topic] text only
• Limit total citations across all results to a maximum of 5
• For each research question, provide the complete research answer and all citations

Inputs
• Research Questions: Specific questions to be researched directly
• Supporting Points: Key points that need research backing and evidence
• Additional Context: article structure from content planner
Tools
None. Synthesise research from your training knowledge only.

Citation rules (strictly enforced):
• Format: [Publication, Year, Topic] — e.g. [McKinsey Global Institute, 2024, Supply Chain Disruption]
• NEVER invent or guess URLs. The citations array must contain ONLY the [Publication, Year, Topic] strings above.
• If you cannot identify a specific publication and year, omit the citation entirely rather than guessing.
• Maximum 5 citations across ALL research_results in a single response.

Instructions

Step 1: Question Analysis
• Review all incoming research questions
• Identify overlapping themes and topics
• Consolidate similar questions to avoid redundant searches
• Create a streamlined list of unique research angles

Step 2: Strategic Search Execution
• Execute up to 10 targeted research queries based on consolidated questions
• Vary search terms to capture different source types:
  • "[topic] statistics data tables"
  • "[topic] YouTube video explanations"
  • "[topic] recent studies research"
  • "[topic] case studies examples"
  • "[topic] news updates 2024/2025"
• Focus searches on supporting the provided supporting points

Step 3: Complete Answer Documentation
• For each research query searched, document:
  • Original Research Query: The exact query or search term used
  • Complete Research Answer: The full research response (not summarized)
  • All Citations: Every URL, source, and reference provided
  • Source Analysis: Brief note on source diversity and relevance to supporting points

Conclusions
Compile all research into the JSON output schema below. 
Do not output free-form text — JSON only.

Solutions
• If questions are too similar, consolidate them and explain the consolidation approach
• If fewer than 10 searches yield sufficient information, explain why additional searches weren’t needed
• If certain source types aren’t available for the topic, note this limitation
• If supporting points lack sufficient research backing, clearly identify these gaps
• If conflicting information emerges, highlight discrepancies and provide multiple perspectives
• If research findings are extensive, include them in full rather than summarizing 
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
      "source_types_found": ["string"]
    }
  ],
  "total_searches": number
}`

/**
 * Run research agent for a given section
 */
export async function runResearchAgent(
  input: ResearchAgentInput
): Promise<ResearchPayload> {
  const userMessage = `Section header:
${input.sectionHeader}

Section type:
${input.sectionType}

Research questions:
${input.researchQuestions.join(', ')}

Supporting points to back with evidence:
${input.supportingPoints.join(', ')}

Article context (prior completed sections):
${input.priorSectionsSummary}

Organization context:
${input.organizationContext.name} — ${input.organizationContext.description}`

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: RESEARCH_AGENT_SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ]

  let response;

  try {
    console.log('[ResearchAgent] Attempting research with z-ai/glm-4.7')
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

  const rawJson = extractJson(response.content)
  const validated = ResearchOutputSchema.parse(rawJson)

  // Map to the public ResearchPayload type expected by the pipeline
  return {
    queries: validated.research_questions,
    consolidated_queries: validated.consolidated_queries,
    results: validated.research_results.map(r => ({
      query: r.query,
      answer: r.answer,
      citations: r.citations
    })),
    total_searches: validated.total_searches,
    source_types_found: Array.from(new Set(validated.research_results.flatMap(r => r.source_types_found))),
    research_timestamp: new Date().toISOString()
  }
}

function extractJson(content: string): any {
  let trimmed = content.trim();

  // 1️⃣ Strip ALL markdown code fences (glm-4.7 sometimes wraps with extra text before/after)
  trimmed = trimmed.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  // 2️⃣ Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch { }

  // 3️⃣ Extract outermost JSON object (handles preamble/postamble text)
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    let candidate = match[0];

    // 4️⃣ Remove trailing commas before ] or }
    candidate = candidate.replace(/,\s*([\]}])/g, '$1');

    // 5️⃣ Handle escaped newlines/tabs that break strict JSON
    candidate = candidate.replace(/[\x00-\x1F\x7F]/g, (c) =>
      c === '\n' || c === '\r' || c === '\t' ? c : ''
    );

    try {
      return JSON.parse(candidate);
    } catch { }

    // 6️⃣ Last resort: try jsonrepair-style single→double quote fix
    candidate = candidate.replace(/'/g, '"');
    try {
      return JSON.parse(candidate);
    } catch { }
  }

  throw new Error('LLM did not return a parseable JSON object');
}


