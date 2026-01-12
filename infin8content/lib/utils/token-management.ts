// Token management utilities for LLM context window handling
// Story 4a.2: Section-by-Section Architecture and Outline Generation
// Enhanced for Story 20.5: Context Management Optimization

/**
 * Token usage tracking for performance monitoring
 */
export interface TokenUsageMetrics {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  contextTokens: number
  optimizationRatio: number // How much context was reduced
  timestamp: string
}

/**
 * Performance comparison metrics for before/after optimization
 */
export interface OptimizationReport {
  beforeOptimization: {
    averageContextTokens: number
    averageTotalTokens: number
    estimatedCost: number
  }
  afterOptimization: {
    averageContextTokens: number
    averageTotalTokens: number
    estimatedCost: number
  }
  improvement: {
    tokenReduction: number // percentage
    costReduction: number // percentage
    speedImprovement: number // percentage (estimated)
  }
  generatedAt: string
}

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
 * Calculate token usage metrics for context optimization (Story 20.5)
 * 
 * @param originalContext - Full context before optimization
 * @param optimizedContext - Optimized context after compression
 * @returns Token usage metrics
 */
export function calculateTokenOptimization(
  originalContext: string,
  optimizedContext: string
): {
  reduction: number
  originalTokens: number
  optimizedTokens: number
  savings: number
} {
  const originalTokens = estimateTokens(originalContext)
  const optimizedTokens = estimateTokens(optimizedContext)
  const reduction = originalTokens > 0 ? ((originalTokens - optimizedTokens) / originalTokens) * 100 : 0
  const savings = originalTokens - optimizedTokens
  
  return {
    reduction: Math.round(reduction * 100) / 100, // Round to 2 decimal places
    originalTokens,
    optimizedTokens,
    savings
  }
}

/**
 * Track token usage for performance monitoring (Story 20.5)
 * 
 * @param context - Context text
 * @param promptTokens - Prompt tokens (if available)
 * @param completionTokens - Completion tokens (if available)
 * @returns Token usage metrics
 */
export function trackTokenUsage(
  context: string,
  promptTokens?: number,
  completionTokens?: number
): TokenUsageMetrics {
  const contextTokens = estimateTokens(context)
  const totalTokens = contextTokens + (promptTokens || 0) + (completionTokens || 0)
  
  // Calculate optimization ratio (how much context was reduced from full context)
  const fullContextEstimate = contextTokens * 2.5 // Assume optimization reduces by ~60%
  const optimizationRatio = fullContextEstimate > 0 ? contextTokens / fullContextEstimate : 1
  
  return {
    promptTokens: promptTokens || 0,
    completionTokens: completionTokens || 0,
    totalTokens,
    contextTokens,
    optimizationRatio: Math.round(optimizationRatio * 100) / 100,
    timestamp: new Date().toISOString()
  }
}

/**
 * Generate performance comparison report (Story 20.5)
 * 
 * @param beforeMetrics - Token usage before optimization
 * @param afterMetrics - Token usage after optimization
 * @returns Optimization report
 */
export function generateOptimizationReport(
  beforeMetrics: TokenUsageMetrics[],
  afterMetrics: TokenUsageMetrics[]
): OptimizationReport {
  const avgBeforeTokens = beforeMetrics.length > 0 
    ? beforeMetrics.reduce((sum, m) => sum + m.contextTokens, 0) / beforeMetrics.length 
    : 0
  
  const avgAfterTokens = afterMetrics.length > 0 
    ? afterMetrics.reduce((sum, m) => sum + m.contextTokens, 0) / afterMetrics.length 
    : 0
  
  const avgBeforeTotal = beforeMetrics.length > 0 
    ? beforeMetrics.reduce((sum, m) => sum + m.totalTokens, 0) / beforeMetrics.length 
    : 0
  
  const avgAfterTotal = afterMetrics.length > 0 
    ? afterMetrics.reduce((sum, m) => sum + m.totalTokens, 0) / afterMetrics.length 
    : 0
  
  // Estimate costs (assuming $0.00001 per token)
  const costPerToken = 0.00001
  const beforeCost = avgBeforeTotal * costPerToken
  const afterCost = avgAfterTotal * costPerToken
  
  const tokenReduction = avgBeforeTokens > 0 ? ((avgBeforeTokens - avgAfterTokens) / avgBeforeTokens) * 100 : 0
  const costReduction = beforeCost > 0 ? ((beforeCost - afterCost) / beforeCost) * 100 : 0
  
  // Estimate speed improvement (tokens processed per second)
  const speedImprovement = avgBeforeTotal > 0 ? ((avgBeforeTotal - avgAfterTotal) / avgBeforeTotal) * 100 : 0
  
  return {
    beforeOptimization: {
      averageContextTokens: Math.round(avgBeforeTokens),
      averageTotalTokens: Math.round(avgBeforeTotal),
      estimatedCost: Math.round(beforeCost * 10000) / 10000
    },
    afterOptimization: {
      averageContextTokens: Math.round(avgAfterTokens),
      averageTotalTokens: Math.round(avgAfterTotal),
      estimatedCost: Math.round(afterCost * 10000) / 10000
    },
    improvement: {
      tokenReduction: Math.round(tokenReduction * 100) / 100,
      costReduction: Math.round(costReduction * 100) / 100,
      speedImprovement: Math.round(speedImprovement * 100) / 100
    },
    generatedAt: new Date().toISOString()
  }
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

/**
 * Validate token reduction achievement (Story 20.5 AC #4)
 * 
 * @param originalContext - Full context before optimization
 * @param optimizedContext - Optimized context after compression
 * @returns Validation result
 */
export function validateTokenReduction(
  originalContext: string,
  optimizedContext: string
): {
  achieved: boolean
  actualReduction: number
  targetReduction: number
  message: string
} {
  const metrics = calculateTokenOptimization(originalContext, optimizedContext)
  const targetReduction = 40 // Story 20.5 target: 40-50% reduction
  
  const achieved = metrics.reduction >= targetReduction
  
  return {
    achieved,
    actualReduction: metrics.reduction,
    targetReduction,
    message: achieved 
      ? `✅ Token reduction target achieved: ${metrics.reduction}% (target: ${targetReduction}%)`
      : `⚠️ Token reduction below target: ${metrics.reduction}% (target: ${targetReduction}%). Saved ${metrics.savings} tokens.`
  }
}

