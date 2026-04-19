/**
 * lib/services/llm-visibility/prompt-suggester.ts
 *
 * Crawls brand website via Tavily, then generates 15 seed prompts
 * covering all three categories (informational, commercial, competitor).
 */

import {
  generateContent,
  type OpenRouterMessage,
} from '@/lib/services/openrouter/openrouter-client'

interface SuggestedPrompt {
  promptText: string
  category: 'informational' | 'commercial' | 'competitor'
}

interface SuggesterInput {
  brandName: string
  websiteUrl: string
  businessDescription?: string | null
  competitorNames?: string[]
}

export async function suggestPrompts(input: SuggesterInput): Promise<SuggestedPrompt[]> {
  const { brandName, websiteUrl, businessDescription, competitorNames = [] } = input

  // Step 1: Crawl the website via Tavily
  let crawlSummary = businessDescription ?? ''
  try {
    const tavilyKey = process.env.TAVILY_API_KEY
    if (tavilyKey) {
      const res = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, urls: [websiteUrl] }),
      })
      if (res.ok) {
        const data = await res.json()
        const content = data?.results?.[0]?.raw_content ?? ''
        crawlSummary = content.slice(0, 2000) // cap for prompt length
      }
    }
  } catch {
    // Non-fatal — fall back to business description
  }

  // Step 2: Generate prompts via LLM
  const competitorContext = competitorNames.length > 0
    ? `Known competitors: ${competitorNames.join(', ')}.`
    : ''

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `You are an AI search optimization expert. Generate prompts that real users type into ChatGPT, Perplexity, or Gemini when searching for tools and services like the brand being described. Output ONLY valid JSON — an array of objects with keys: promptText (string) and category ("informational" | "commercial" | "competitor"). No preamble, no markdown.`,
    },
    {
      role: 'user',
      content: `Brand: ${brandName}
Website: ${websiteUrl}
${crawlSummary ? `Website content summary:\n${crawlSummary}\n` : ''}
${competitorContext}

Generate 15 prompts:
- 5 informational (learning intent, e.g. "how to automate blog content creation")
- 5 commercial (buying/comparison intent, e.g. "best AI content writing tool for SEO teams")  
- 5 competitor (alternative/comparison queries, e.g. "${competitorNames[0] ?? 'Competitor'} alternatives for content marketing")

Return JSON array only.`,
    },
  ]

  try {
    const result = await generateContent(messages, {
      maxTokens: 800,
      temperature: 0.6,
      model: 'openai/gpt-4o-mini',
    })

    const cleaned = result.content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) return getFallbackPrompts(brandName)

    return parsed
      .filter((p: any) => p.promptText && p.category)
      .slice(0, 15)
      .map((p: any) => ({
        promptText: String(p.promptText),
        category: ['informational', 'commercial', 'competitor'].includes(p.category)
          ? p.category
          : 'informational',
      }))
  } catch {
    return getFallbackPrompts(brandName)
  }
}

function getFallbackPrompts(brandName: string): SuggestedPrompt[] {
  return [
    { promptText: 'best AI content writing tools for SEO', category: 'commercial' },
    { promptText: 'how to generate long-form blog articles with AI', category: 'informational' },
    { promptText: 'AI tools for content marketing teams', category: 'commercial' },
    { promptText: `what is ${brandName}`, category: 'informational' },
    { promptText: `${brandName} alternatives`, category: 'competitor' },
    { promptText: 'how to scale content production with AI', category: 'informational' },
    { promptText: 'best AI writing assistant for agencies', category: 'commercial' },
    { promptText: 'AI SEO content generation tools comparison', category: 'competitor' },
    { promptText: 'how does AI content generation work', category: 'informational' },
    { promptText: 'top tools for automated blog writing', category: 'commercial' },
  ]
}
