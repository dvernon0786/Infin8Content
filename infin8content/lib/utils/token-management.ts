// Token management utilities for LLM context window handling
// Story 4a.2: Section-by-Section Architecture and Outline Generation

/**
 * Estimate token count for text (approximation)
 * 
 * Uses simple approximation: 4 characters ≈ 1 token for English text
 * For accurate counting, use tiktoken library (recommended for production)
 * 
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Simple approximation: 4 chars ≈ 1 token
  // TODO: Replace with tiktoken for accurate GPT token counting
  return Math.ceil(text.length / 4)
}

/**
 * Summarize previous sections for context window management
 * 
 * Strategy: Extract key points, maintain keyword focus, preserve section titles
 * 
 * @param sections - Array of completed sections
 * @param maxTokens - Maximum tokens allowed for summary
 * @returns Summarized text for context
 */
export function summarizeSections(
  sections: Array<{ title: string; content: string; section_type: string }>,
  maxTokens: number
): string {
  if (sections.length === 0) {
    return ''
  }

  // Extract section titles and first/last sentences
  const summaries: string[] = []
  
  for (const section of sections) {
    const sentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const firstSentence = sentences[0]?.trim() || ''
    const lastSentence = sentences[sentences.length - 1]?.trim() || ''
    
    summaries.push(
      `## ${section.title}\n${firstSentence}${lastSentence && lastSentence !== firstSentence ? ' ' + lastSentence : ''}`
    )
  }

  let summary = summaries.join('\n\n')
  let currentTokens = estimateTokens(summary)

  // If summary exceeds max tokens, truncate from oldest sections
  if (currentTokens > maxTokens) {
    const targetLength = Math.floor((maxTokens / currentTokens) * summary.length)
    summary = summary.slice(0, targetLength)
    
    // Ensure we end at a complete section
    const lastSectionIndex = summary.lastIndexOf('##')
    if (lastSectionIndex > 0) {
      summary = summary.slice(0, lastSectionIndex)
    }
  }

  return summary
}

/**
 * Check if content fits within context window
 * 
 * @param prompt - Prompt text
 * @param research - Research data text
 * @param summaries - Previous sections summary
 * @param maxTokens - Maximum tokens allowed (default: 6000 for GPT-4 safe limit)
 * @returns True if fits within context window
 */
export function fitInContextWindow(
  prompt: string,
  research: string,
  summaries: string,
  maxTokens: number = 6000
): boolean {
  const promptTokens = estimateTokens(prompt)
  const researchTokens = estimateTokens(research)
  const summariesTokens = estimateTokens(summaries)
  
  const totalTokens = promptTokens + researchTokens + summariesTokens
  
  // Leave room for new section content (~3000 tokens)
  const availableTokens = maxTokens - totalTokens
  
  return availableTokens >= 3000
}

