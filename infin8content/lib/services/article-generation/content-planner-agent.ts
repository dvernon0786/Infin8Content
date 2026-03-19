/**
 * Content Planner Agent Service
 * Phase 4: Build + Unit Test Agents
 * 
 * Transforms raw subtopic data and keywords into a structured article plan.
 * Validates output against a strict Zod schema.
 */

import { z } from 'zod'
import { generateContent, type OpenRouterMessage } from '../openrouter/openrouter-client'

// Forbidden header prefixes are applied deterministically during schema parsing
// so the sanitization runs for both primary and fallback model outputs.
const FORBIDDEN_HEADER_PREFIXES = [
    /^how do\s+/i,
    /^how to use\s+/i,
    /^how to\s+/i,
    /^what (is|are)\s+/i,
    /^why\s+/i,
    /^choose\s+/i,
    /^find\s+/i,
    /^use\s+/i,
]

/**
 * STRICT PLANNER SCHEMA (Per Phase 4 Spec)
 */
export const PlannerSchema = z.object({
    article_title: z.string(),
    content_style: z.enum(['informative', 'listicle']),
    target_keyword: z.string(),
    semantic_keywords: z.array(z.string()).min(5).max(12),
    article_structure: z.array(
        z.object({
            section_type: z.enum(['introduction', 'h2', 'h3', 'conclusion', 'faq']),
            header: z.string(),
            supporting_points: z.array(z.string()),
            research_questions: z.array(z.string()),
            supporting_elements: z.string(),
            estimated_words: z.number().min(80).max(1500)
        })
    ),
    total_estimated_words: z.number()
}).transform(plan => ({
    ...plan,
    article_structure: plan.article_structure.map((section: any) => {
        const sanitizedHeader = FORBIDDEN_HEADER_PREFIXES.reduce(
            (h: string, pattern: RegExp) => h.replace(pattern, ''),
            (section.header || '')
        ).trim()

        const finalHeader = sanitizedHeader || section.header || 'Section'

        return {
            ...section,
            header: finalHeader
        }
    })
}))

export type PlannerAgentOutput = z.infer<typeof PlannerSchema>

export interface PlannerAgentInput {
    targetKeyword: string
    subtopicData: any[]
    organizationContext: {
        name: string
        description: string
        icpText: string
        target_audiences?: string[]
        industry?: string
    }
    generationConfig: {
        tone: string
        style: string
        target_word_count: number
        language: string
        add_youtube_video: boolean
        add_cta: boolean
        add_infographics: boolean
        add_emojis: boolean
        num_internal_links: number
        image_style: string
        brand_color: string
    }
}

/**
 * PLANNER SYSTEM PROMPT (LOCKED)
 */
export const PLANNER_AGENT_SYSTEM_PROMPT = `Role
You are an expert blog article planner specializing in creating detailed, research-driven content outlines. Your purpose is to develop comprehensive article structures that balance SEO optimization with reader value, ensuring each piece is thoroughly researched, informative, and perfectly aligned with the target audience’s needs and search intent.

Constraints
 Always create outlines that match the specified content style (informative or listicle)
 Every section in article_structure must cover a unique concept.
 Section headers must be declarative noun phrases or short title-case statements (e.g. "Key Services for Growing Businesses"). Never start a header with "How to", "How do", "What is", "Why", or any question word. Never start a header with an instruction verb like "Use", "Choose", "Find".
 Never create two sections with semantically similar headers (e.g. "Benefits of X" and "Top Benefits of X"). If two planned sections overlap, merge them into one.
 Include 2–3 specific supporting points for each header that guide content creation
 Generate actionable research questions for each section to ensure thorough coverage
 Maintain semantic keyword integration throughout the structure without keyword stuffing
 Design content flow that naturally incorporates facts, statistics, tables, and multimedia elements
 Ensure each section builds upon the previous one for logical progression
 Create structures that support 2,000–4,000 word articles with substantial depth
 Never create thin or superficial content outlines — each section must add unique value
 Section order is strictly enforced: body sections (h2) → faq → conclusion. The faq section must always be second-to-last. The conclusion section must always be last.
 The conclusion section header must NOT start with the word "Conclusion". Use a specific named header: "Bottom Line", "Your Next Move", "Making It Work", or similar action-oriented phrasing.

Inputs
 ICP (Ideal Customer Profile): Detailed information about the target audience including demographics, pain points, goals, challenges, current solutions they use, and their content consumption preferences
 Subtopic: The specific subject area to be covered in the article
 Keyword: Primary keyword to target with natural semantic variations throughout
 Content Style: Either “informative” (educational, problem-solving focus) or “listicle” (numbered list format with actionable items)

Tools
No external tools required for this planning phase

Instructions
For Informative Style Articles:
1. Analyze the ICP to understand their knowledge level, specific challenges, and information gaps
2. Structure the article with:
	 Compelling introduction that addresses a core problem or question
 5–8 main sections that progressively build understanding
 Each section solving a specific aspect of the broader topic
 Natural transition sentences between sections
 Comprehensive conclusion with actionable takeaways
3. For each main header, provide:
 2–3 specific supporting points that directly address ICP needs
 2–3 research questions focused on finding data, examples, or expert insights
 Notes on potential visual elements (charts, infographics, embedded videos)
4. Example Structure (from “How to Make Money on Twitter” document):
 Opening with current state/problem
 Foundation concepts clearly explained
 Progressive depth into specific strategies
 Real-world examples and case studies
 Practical implementation tips
 Future-looking considerations

For Listicle Style Articles:
1. Design the list to be comprehensive yet scannable
2. Structure with:
 Brief introduction explaining the value of the list
 7–12 numbered items (depending on topic depth)
 Each item as a self-contained mini-lesson
 Comparison table or summary chart
 Action-oriented conclusion
3. For each list item, include:
 Clear, benefit-driven header
 2–3 key implementation points
 Research questions for statistics, examples, or tool recommendations
 Practical tips or common pitfalls to avoid
4. Example Structure (from “Document Management Best Practices”):
 Each item addresses a specific practice or solution
 Consistent format: What it is – Why it matters – How to implement
 Real-world examples for each point
 Pros/cons or challenges discussed
 Comparison table summarizing all items

Research Question Guidelines:
 Focus on finding recent statistics (within last 2 years)
 Seek industry-specific examples relevant to the ICP
 Look for expert quotes or authoritative sources
 Identify tools, platforms, or resources the ICP would actually use
 Research common mistakes or misconceptions to address

Semantic Keyword Integration:
 Identify 5–10 semantic variations of the main keyword
 Plan natural placement throughout headers and supporting points
 Avoid forced keyword insertion – prioritize readability
 Include long-tail variations that match user search intent

Conclusions (Expected Outputs)
Article Flow and Structure: Complete outline with logical progression tailored to content style
Detailed Headers: Each with:
   2–3 supporting key points written as brief, clear statements
   2–3 specific research questions to ensure comprehensive coverage
   Notes on supporting elements (statistics, examples, visuals)
 Research Focus Areas: Compiled list of all research questions organized by priority
 Keyword Map: Primary keyword and semantic variations with suggested placement
 Estimated Word Count: Per section to ensure balanced coverage
 Supporting Elements Plan: Where to include tables, statistics, videos, or other media

Solutions (Error Handling)
 If ICP information is vague, create assumptions based on the keyword and subtopic, noting these for validation
 If the subtopic is too broad, narrow focus to the most valuable aspect for the ICP
 If keyword seems misaligned with subtopic, suggest alternative keywords or reframe the angle
 If content style doesn’t match the topic well, note this and suggest the more appropriate style
 If research questions yield limited results, provide alternative research angles
 If the topic lacks sufficient depth for a full article, suggest related subtopics to expand coverage
 
Return ONLY valid JSON.
Do not include explanations.
Do not include markdown.
Do not include trailing commas.
JSON only.

Output schema:
{
  "article_title": "string",
  "content_style": "informative | listicle",
  "target_keyword": "string",
  "semantic_keywords": ["string"],
  "article_structure": [
    {
      "section_type": "introduction | h2 | h3 | conclusion | faq",
      "header": "string",
      "supporting_points": ["string"],
      "research_questions": ["string"],
      "supporting_elements": "string",
      "estimated_words": number
    }
  ],
  "total_estimated_words": number
}`

/**
 * Run content planner agent
 */
export async function runContentPlannerAgent(
    input: PlannerAgentInput
): Promise<PlannerAgentOutput> {
    const userMessage = `ICP:
${input.organizationContext.icpText}

Subtopic:
${JSON.stringify(input.subtopicData)}

Keyword:
${input.targetKeyword}

Content Style:
${input.generationConfig.style}

Generation Config:
- Tone: ${input.generationConfig.tone}
- Language: ${input.generationConfig.language}
- Add YouTube video: ${input.generationConfig.add_youtube_video}
- Add CTA: ${input.generationConfig.add_cta}
- Add Infographics: ${input.generationConfig.add_infographics}
- Add Emojis: ${input.generationConfig.add_emojis}
- Number of internal links: ${input.generationConfig.num_internal_links}
- Image style: ${input.generationConfig.image_style}
- Brand color: ${input.generationConfig.brand_color}`

    const messages: OpenRouterMessage[] = [
        {
            role: 'system',
            content: PLANNER_AGENT_SYSTEM_PROMPT
        },
        {
            role: 'user',
            content: userMessage
        }
    ]

    let lastError: any = null

    // 🔄 RETRY ONCE (Per Phase 4 Spec)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            console.log(`[PlannerAgent] Attempt ${attempt}/2 using openai/gpt-4o-mini`)

            const response = await generateContent(messages, {
                model: 'openai/gpt-4o-mini',
                temperature: 0.3, // Lower temp for structural stability
                maxTokens: 4000
            })

            const rawJson = extractJson(response.content)
            const validated = PlannerSchema.parse(rawJson)

            console.log('[PlannerAgent] Plan generated and validated successfully')
            return validated

        } catch (error) {
            lastError = error
            console.warn(`[PlannerAgent] Attempt ${attempt} failed:`, error instanceof Error ? error.message : error)

            if (attempt < 2) {
                console.log('[PlannerAgent] Retrying in 2 seconds...')
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }
    }

    // 🚀 FALLBACK (use an alternate model for recovery)
    console.warn('[PlannerAgent] primary model failed after 2 attempts, seeking fallback claude')
    try {
        const response = await generateContent(messages, {
            model: 'anthropic/claude-3.5-haiku',
            temperature: 0.3,
            maxTokens: 4000
        })

        const rawJson = extractJson(response.content)
        const validated = PlannerSchema.parse(rawJson)

        console.log('[PlannerAgent] Plan generated via fallback (claude)')
        return validated
    } catch (fallbackError) {
        throw new Error(`Planner failed on all models. Last: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
    }
}

/**
 * Safely extract JSON from LLM output
 */
function extractJson(content: string): any {
    let trimmed = content.trim();

    // 1️⃣ Strip ALL markdown code fences (glm-5 sometimes wraps with extra text before/after)
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

        // Steps 1–5 exhausted — apostrophe replacement omitted (corrupts valid content like "McKinsey's")
    }

    throw new Error('LLM output contained unparseable JSON structure');
}
