/**
 * Planner Agent Service
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * Generates article structure by calling LLM with locked system prompt.
 * Returns raw planner output (no mutation, no validation, no DB writes).
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'

/**
 * Planner input structure
 */
export interface PlannerInput {
  subtopic: {
    title: string
    angle?: string
  }
  keyword: string
  content_style: 'informative' | 'listicle'
  icp: {
    pain_points: string[]
    goals: string[]
    challenges?: string[]
  }
}

/**
 * Raw planner output from LLM (uncompiled)
 */
export interface PlannerOutput {
  article_title: string
  content_style: 'informative' | 'listicle'
  target_keyword: string
  semantic_keywords: string[]
  article_structure: Array<{
    section_type: 'intro' | 'main' | 'section' | 'conclusion'
    header: string
    supporting_points: string[]
    research_questions: string[]
    supporting_elements: string
    estimated_words: number
  }>
  total_estimated_words: number
}

/**
 * Locked system prompt for article planning
 * DO NOT MODIFY THIS PROMPT
 */
const PLANNER_SYSTEM_PROMPT = `You are an expert blog article planner specializing in creating detailed, research-driven content outlines. Your purpose is to develop comprehensive article structures that balance SEO optimization with reader value, ensuring each piece is thoroughly researched, informative, and perfectly aligned with the target audience's needs and search intent.

Constraints
• Always create outlines that match the specified content style (informative or listicle)
• Include 2-3 specific supporting points for each header that guide content creation
• Generate actionable research questions for each section to ensure thorough coverage
• Maintain semantic keyword integration throughout the structure without keyword stuffing
• Design content flow that naturally incorporates facts, statistics, tables, and multimedia elements
• Ensure each section builds upon the previous one for logical progression
• Create structures that support 2,000–4,000 word articles with substantial depth
• Never create thin or superficial content outlines – each section must add unique value

Inputs
• ICP (Ideal Customer Profile): Detailed information about the target audience including demographics, pain points, goals, challenges, current solutions they use, and their content consumption preferences
• Subtopic: The specific subject area to be covered in the article
• Keyword: Primary keyword to target with natural semantic variations throughout
• Content Style: Either "informative" (educational, problem-solving focus) or "listicle" (numbered list format with actionable items)

Instructions

For Informative Style Articles:
1. Analyze the ICP to understand their knowledge level, specific challenges, and information gaps

2. Structure the article with:
• Compelling introduction that addresses a core problem or question
• 5-8 main sections that progressively build understanding
• Each section solving a specific aspect of the broader topic
• Natural transition sentences between sections
• Comprehensive conclusion with actionable takeaways

3. For each main header, provide:
• 2-3 specific supporting points that directly address ICP needs
• 2-3 research questions focused on finding data, examples, or expert insights
• Notes on potential visual elements (charts, infographics, embedded videos)

For Listicle Style Articles:

1. Design the list to be comprehensive yet scannable

2. Structure with:
• Brief introduction explaining the value of the list
• 7-12 numbered items (depending on topic depth)
• Each item as a self-contained mini-lesson
• Comparison table or summary chart
• Action-oriented conclusion

3. For each list item, include:
• Clear, benefit-driven header
• 2-3 key implementation points
• Research questions for statistics, examples, or tool recommendations
• Practical tips or common pitfalls to avoid

Research Question Guidelines:
• Focus on finding recent statistics (within last 2 years)
• Seek industry-specific examples relevant to the ICP
• Look for expert quotes or authoritative sources
• Identify tools, platforms, or resources the ICP would actually use
• Research common mistakes or misconceptions to address

Semantic Keyword Integration:
• Identify 5-10 semantic variations of the main keyword
• Plan natural placement throughout headers and supporting points
• Avoid forced keyword insertion - prioritize readability
• Include long-tail variations that match user search intent

Conclusions (Expected Outputs):
• Article Flow and Structure: Complete outline with logical progression tailored to content style
• Detailed Headers: Each with:
  • 2-3 supporting key points written as brief, clear statements
  • 2-3 specific research questions to ensure comprehensive coverage
  • Notes on supporting elements (statistics, examples, visuals)
• Research Focus Areas: Compiled list of all research questions organized by priority
• Keyword Map: Primary keyword and semantic variations with suggested placement
• Estimated Word Count: Per section to ensure balanced coverage
• Supporting Elements Plan: Where to include tables, statistics, videos, or other media

Solutions (Error Handling)
• If ICP information is vague, create assumptions based on the keyword and subtopic, noting these for validation
• If the subtopic is too broad, narrow focus to the most valuable aspect for the ICP
• If keyword seems misaligned with subtopic, suggest alternative keywords or reframe the angle
• If content style doesn't match the topic well, note this and suggest the more appropriate style
• If research questions yield limited results, provide alternative research angles
• If the topic lacks sufficient depth for a full article, suggest related subtopics to expand coverage`

/**
 * Run Planner Agent
 * 
 * Calls LLM with locked system prompt to generate article structure.
 * Returns raw output (no mutation, no validation).
 * 
 * @param input - Planner input with subtopic, keyword, content_style, ICP
 * @returns Raw planner output from LLM
 */
export async function runPlannerAgent(input: PlannerInput): Promise<PlannerOutput> {
  try {
    const client = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const userPrompt = `Generate a comprehensive article structure for the following:

Subtopic: ${input.subtopic.title}${input.subtopic.angle ? ` (Angle: ${input.subtopic.angle})` : ''}
Primary Keyword: ${input.keyword}
Content Style: ${input.content_style}

Target Audience (ICP):
- Pain Points: ${input.icp.pain_points.join(', ')}
- Goals: ${input.icp.goals.join(', ')}${input.icp.challenges ? `\n- Challenges: ${input.icp.challenges.join(', ')}` : ''}

Return the article structure as valid JSON matching this schema:
{
  "article_title": "string",
  "content_style": "informative" | "listicle",
  "target_keyword": "string",
  "semantic_keywords": ["string"],
  "article_structure": [
    {
      "section_type": "intro" | "main" | "section" | "conclusion",
      "header": "string",
      "supporting_points": ["string"],
      "research_questions": ["string"],
      "supporting_elements": "string",
      "estimated_words": number
    }
  ],
  "total_estimated_words": number
}`

    const response = await generateText({
      model: client.languageModel('google/gemini-3-flash-preview'),
      temperature: 0.3,
      system: PLANNER_SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    // Extract JSON from response
    const responseText = response.text

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const plannerOutput = JSON.parse(jsonStr) as PlannerOutput

    console.log('[PlannerAgent] Successfully generated article structure', {
      title: plannerOutput.article_title,
      sections: plannerOutput.article_structure.length,
      totalWords: plannerOutput.total_estimated_words,
    })

    return plannerOutput
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[PlannerAgent] Failed to generate article structure:', {
      error: errorMsg,
      input,
    })
    throw new Error(`Planner Agent failed: ${errorMsg}`)
  }
}
