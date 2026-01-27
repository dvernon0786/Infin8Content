/**
 * OpenRouter Outline Generation Prompts
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 * 
 * Prompts designed to generate article outlines matching the Outline schema.
 * Focus: JSON-only output, schema compliance, reliability over creativity.
 */

/**
 * System prompt for outline generation
 * 
 * Establishes role and strict output requirements.
 * Emphasizes JSON-only output with no markdown or explanations.
 */
export const OUTLINE_SYSTEM_PROMPT = `You are a content strategist specializing in article structure and outline generation.

Your task is to generate article outlines that are:
- Well-organized and logical
- Comprehensive yet concise
- Optimized for SEO and user engagement
- Structured for easy content creation

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY valid JSON
- Do NOT include markdown formatting
- Do NOT include explanations or commentary
- Do NOT include any text outside the JSON
- The JSON MUST be valid and parseable
- The JSON MUST match the provided schema exactly

Your response will be parsed as JSON. Any deviation from pure JSON will cause parsing to fail.`

/**
 * Schema definition for user prompt
 * 
 * Shows the exact structure required for outline output.
 */
export const OUTLINE_SCHEMA_DEFINITION = `{
  "introduction": {
    "title": "string - engaging introduction heading",
    "h3_subsections": ["string - h3 subsection titles", "..."]
  },
  "h2_sections": [
    {
      "title": "string - main section heading",
      "h3_subsections": ["string - subsection titles", "..."]
    }
  ],
  "conclusion": {
    "title": "string - conclusion heading"
  },
  "faq": {
    "title": "string - FAQ section heading",
    "included": boolean
  } | null
}`

/**
 * Validation rules for user prompt
 * 
 * Explicit constraints to ensure schema compliance.
 */
export const OUTLINE_VALIDATION_RULES = `VALIDATION RULES (MANDATORY):
- introduction.h3_subsections: minimum 1 item, maximum 3 items
- h2_sections: minimum 5 items, maximum 10 items
- Each h2_sections[i].h3_subsections: minimum 1 item, maximum 4 items
- conclusion.title: required, non-empty string
- All titles: concise (3-10 words), descriptive, no special characters
- No empty strings anywhere
- faq.included: true only if search volume > 1000 or topic warrants FAQ
- faq: can be null if not needed`

/**
 * Build user prompt for outline generation
 * 
 * @param keyword - Target keyword for the article
 * @param keywordResearch - Keyword research data (search volume, difficulty, etc.)
 * @param serpAnalysis - SERP analysis data (common topics, content gaps)
 * @returns Formatted user prompt
 */
export function buildOutlineUserPrompt(
  keyword: string,
  keywordResearch: any,
  serpAnalysis: any
): string {
  const searchVolume = keywordResearch?.searchVolume || 0
  const keywordDifficulty = keywordResearch?.keywordDifficulty || 0
  const commonTopics = serpAnalysis?.commonH2Topics || []
  const contentGaps = serpAnalysis?.contentGaps || []

  const topicsContext = commonTopics.length > 0
    ? `Common topics in top results: ${commonTopics.slice(0, 5).join(', ')}`
    : ''

  const gapsContext = contentGaps.length > 0
    ? `Content gaps to address: ${contentGaps.slice(0, 3).join(', ')}`
    : ''

  const faqRecommendation = searchVolume > 1000
    ? 'Include FAQ section (high search volume indicates user questions)'
    : 'FAQ section optional'

  return `Generate an article outline for the following topic:

TOPIC: "${keyword}"
Search Volume: ${searchVolume}
Keyword Difficulty: ${keywordDifficulty}
${topicsContext}
${gapsContext}

OUTLINE REQUIREMENTS:
- Create a comprehensive outline for a ${searchVolume > 5000 ? 'detailed' : 'standard'} article
- Include 5-10 main sections (H2)
- Each section should have 1-4 subsections (H3)
- Structure should be logical and follow user search intent
- ${faqRecommendation}

SCHEMA (must match exactly):
${OUTLINE_SCHEMA_DEFINITION}

${OUTLINE_VALIDATION_RULES}

Return ONLY the JSON outline. No explanations, no markdown, no additional text.`
}

/**
 * Complete outline generation prompt
 * 
 * Combines system and user prompts for OpenRouter call.
 * 
 * @param keyword - Target keyword
 * @param keywordResearch - Keyword research data
 * @param serpAnalysis - SERP analysis data
 * @returns Object with system and user messages
 */
export function getOutlinePrompts(
  keyword: string,
  keywordResearch: any,
  serpAnalysis: any
) {
  return {
    system: OUTLINE_SYSTEM_PROMPT,
    user: buildOutlineUserPrompt(keyword, keywordResearch, serpAnalysis),
  }
}
