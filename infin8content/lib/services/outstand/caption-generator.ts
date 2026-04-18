/**
 * lib/services/outstand/caption-generator.ts
 *
 * Generates a platform-aware social caption from an article using
 * the project's existing OpenRouter client.
 */

import {
  generateContent,
  type OpenRouterMessage,
} from '@/lib/services/openrouter/openrouter-client'

export interface ArticleSnapshot {
  title: string
  /** Plain-text excerpt — first ~500 chars of article body */
  excerpt: string
  /** Fully-qualified published URL injected into the caption */
  articleUrl: string
  /** Optional — mirrors brand voice used during generation */
  writingStyle?: string | null
}

export const SOCIAL_CAPTION_SYSTEM_PROMPT = `You are a social media expert who writes high-converting posts for content marketing teams.
Your job is to take an article title and excerpt and produce a single, ready-to-post social caption.

Rules:
- Maximum 280 characters total (fits X/Twitter; other platforms use the same copy).
- Open with a hook: curiosity gap, bold claim, or provocative question.
- Include the article URL on its own line at the very end.
- At most 2 relevant hashtags — placed after the URL.
- Do NOT add preamble, explanation, quotation marks, or markdown around the output.
- Output only the caption text. Nothing else.`

/**
 * Generate a social-media caption for the given article.
 * Returns a ready-to-post string with the article URL embedded.
 */
export async function generateSocialCaption(article: ArticleSnapshot): Promise<string> {
  const styleNote = article.writingStyle
    ? `\nThe brand's writing style is: "${article.writingStyle}". Mirror that tone.`
    : ''

  const userMessage = `Article title: ${article.title}

Article excerpt:
${article.excerpt.slice(0, 500)}

Article URL: ${article.articleUrl}
${styleNote}

Write the social post now.`

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: SOCIAL_CAPTION_SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]

  const result = await generateContent(messages, {
    maxTokens: 200,
    temperature: 0.7,
    model: 'openai/gpt-4o-mini',
  })

  return result.content.trim()
}
