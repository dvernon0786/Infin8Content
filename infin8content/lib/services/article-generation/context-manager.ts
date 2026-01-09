/**
 * Context Manager for Article Generation
 * Optimizes token usage and reduces database operations
 * Performance Optimization Story 4a-12
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Section } from './section-processor'

/**
 * Cached context data for an article
 */
export interface ArticleContextCache {
  articleId: string
  keyword: string
  cumulativeSummary: string[]
  sectionKeyPoints: Map<string, string> // section index -> key points
  lastSectionIndex: number
  totalWordCount: number
  generatedAt: string
}

/**
 * In-memory cache for context data
 */
const contextCache = new Map<string, ArticleContextCache>()

/**
 * Maximum context size to prevent token bloat
 */
const MAX_CONTEXT_TOKENS = 2000
const MAX_SECTIONS_IN_CONTEXT = 6

/**
 * Get or create context cache for an article
 */
export function getArticleContext(articleId: string, keyword: string): ArticleContextCache {
  let cache = contextCache.get(articleId)
  
  if (!cache) {
    cache = {
      articleId,
      keyword,
      cumulativeSummary: [],
      sectionKeyPoints: new Map(),
      lastSectionIndex: -1,
      totalWordCount: 0,
      generatedAt: new Date().toISOString()
    }
    contextCache.set(articleId, cache)
  }
  
  return cache
}

/**
 * Build optimized context for section generation
 * 
 * @param articleId - Article identifier
 * @param currentSectionIndex - Current section being generated
 * @param previousSections - Array of previously generated sections
 * @param targetWordCount - Target word count for current section
 * @returns Optimized context string
 */
export function buildOptimizedContext(
  articleId: string,
  currentSectionIndex: number,
  previousSections: Section[],
  targetWordCount: number
): string {
  const cache = getArticleContext(articleId, '')
  
  // Only rebuild context if we have new sections
  if (previousSections.length > cache.lastSectionIndex + 1) {
    updateContextCache(cache, previousSections)
  }
  
  // Build context from cached data
  const contextParts: string[] = []
  
  // Add keyword focus
  contextParts.push(`Keyword Focus: ${cache.keyword}`)
  
  // Add cumulative summary (limited to last few sections)
  if (cache.cumulativeSummary.length > 0) {
    const recentSummaries = cache.cumulativeSummary.slice(-MAX_SECTIONS_IN_CONTEXT)
    contextParts.push('Previous Sections Summary:')
    contextParts.push(recentSummaries.join('\n'))
  }
  
  // Add section-specific context if available
  const sectionKeyPoints = cache.sectionKeyPoints.get(currentSectionIndex.toString())
  if (sectionKeyPoints) {
    contextParts.push('Section Context:')
    contextParts.push(sectionKeyPoints)
  }
  
  // Add word count guidance
  contextParts.push(`Target Word Count: ${targetWordCount} words`)
  
  let fullContext = contextParts.join('\n\n')
  
  // Truncate if too long (estimate tokens ~ chars/4)
  const estimatedTokens = fullContext.length / 4
  if (estimatedTokens > MAX_CONTEXT_TOKENS) {
    const maxChars = MAX_CONTEXT_TOKENS * 4
    fullContext = fullContext.substring(0, maxChars) + '...'
    console.warn(`[ContextManager] Context truncated from ${estimatedTokens} to ${MAX_CONTEXT_TOKENS} tokens`)
  }
  
  console.log(`[ContextManager] Built optimized context for section ${currentSectionIndex}: ${Math.round(fullContext.length / 4)} tokens`)
  
  return fullContext
}

/**
 * Update context cache with new sections
 */
function updateContextCache(cache: ArticleContextCache, sections: Section[]): void {
  console.log(`[ContextManager] Updating context cache for article ${cache.articleId}`)
  
  // Process new sections
  for (let i = cache.lastSectionIndex + 1; i < sections.length; i++) {
    const section = sections[i]
    
    if (!section) continue
    
    // Extract key points from section
    const keyPoints = extractKeyPoints(section.content, section.word_count)
    cache.sectionKeyPoints.set(section.section_index.toString(), keyPoints)
    
    // Add to cumulative summary
    const summaryLine = `${section.section_type === 'introduction' ? 'Introduction' : 
                        section.section_type === 'conclusion' ? 'Conclusion' : 
                        section.section_type === 'faq' ? 'FAQ' : 
                        `Section ${section.section_index}`}: ${keyPoints}`
    
    cache.cumulativeSummary.push(summaryLine)
    
    // Update totals
    cache.totalWordCount += section.word_count || 0
    cache.lastSectionIndex = section.section_index
  }
  
  // Limit summary size to prevent memory bloat
  if (cache.cumulativeSummary.length > MAX_SECTIONS_IN_CONTEXT * 2) {
    cache.cumulativeSummary = cache.cumulativeSummary.slice(-MAX_SECTIONS_IN_CONTEXT * 2)
    console.log(`[ContextManager] Trimmed cumulative summary to ${cache.cumulativeSummary.length} items`)
  }
}

/**
 * Extract key points from section content
 */
function extractKeyPoints(content: string, wordCount: number): string {
  if (!content || wordCount === 0) return 'No content available'
  
  // For short sections, use first sentence
  if (wordCount < 200) {
    const firstSentence = content.split(/[.!?]/)[0]
    return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence
  }
  
  // For longer sections, extract first and last sentences plus key headings
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10)
  
  let keyPoints: string[] = []
  
  // Add first sentence
  if (sentences.length > 0) {
    keyPoints.push(sentences[0].trim())
  }
  
  // Look for headings or bold text (markdown format)
  const headings = content.match(/#{1,3}\s+(.+)/g) || []
  headings.slice(0, 2).forEach(heading => {
    const cleanHeading = heading.replace(/#{1,3}\s+/, '').trim()
    if (cleanHeading.length < 100) {
      keyPoints.push(cleanHeading)
    }
  })
  
  // Add last sentence if different from first
  if (sentences.length > 1) {
    const lastSentence = sentences[sentences.length - 1].trim()
    if (lastSentence !== keyPoints[0]) {
      keyPoints.push(lastSentence)
    }
  }
  
  // Combine and limit length
  let combined = keyPoints.join('. ')
  
  if (combined.length > 200) {
    combined = combined.substring(0, 200) + '...'
  }
  
  return combined
}

/**
 * Get context statistics for monitoring
 */
export function getContextStats(articleId: string): {
  sectionsCached: number
  summaryLength: number
  estimatedTokens: number
  totalWordCount: number
} | null {
  const cache = contextCache.get(articleId)
  if (!cache) return null
  
  const fullContext = buildOptimizedContext(articleId, 0, [], 0)
  const estimatedTokens = fullContext.length / 4
  
  return {
    sectionsCached: cache.sectionKeyPoints.size,
    summaryLength: cache.cumulativeSummary.length,
    estimatedTokens: Math.round(estimatedTokens),
    totalWordCount: cache.totalWordCount
  }
}

/**
 * Clear context cache for an article
 */
export function clearContextCache(articleId: string): void {
  contextCache.delete(articleId)
  console.log(`[ContextManager] Cleared context cache for article ${articleId}`)
}

/**
 * Clean up expired or old cache entries
 */
export function cleanupContextCache(): void {
  const maxAge = 2 * 60 * 60 * 1000 // 2 hours
  const now = Date.now()
  const toDelete: string[] = []
  
  for (const [articleId, cache] of contextCache.entries()) {
    const age = now - new Date(cache.generatedAt).getTime()
    if (age > maxAge) {
      toDelete.push(articleId)
    }
  }
  
  toDelete.forEach(articleId => contextCache.delete(articleId))
  
  if (toDelete.length > 0) {
    console.log(`[ContextManager] Cleaned up ${toDelete.length} expired context cache entries`)
  }
}

/**
 * Batch update sections to reduce database operations
 */
export async function batchUpdateSections(
  articleId: string,
  sections: Section[]
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    // Update all sections in one database operation
    await supabase
      .from('articles' as any)
      .update({
        sections: sections,
        current_section_index: sections.length > 0 ? sections[sections.length - 1].section_index : 0
      })
      .eq('id', articleId)
    
    console.log(`[ContextManager] Batch updated ${sections.length} sections for article ${articleId}`)
  } catch (error) {
    console.error(`[ContextManager] Failed to batch update sections:`, error)
    throw error
  }
}

/**
 * Get performance metrics for context optimization
 */
export function getPerformanceMetrics(): {
  totalCached: number
  averageSectionsPerArticle: number
  averageContextTokens: number
  memoryUsageEstimate: number
} {
  let totalSections = 0
  let totalTokens = 0
  let cacheCount = 0
  
  for (const cache of contextCache.values()) {
    totalSections += cache.sectionKeyPoints.size
    totalTokens += cache.cumulativeSummary.join(' ').length / 4 // Rough token estimate
    cacheCount++
  }
  
  // Rough memory usage estimate (each character ~ 1 byte + overhead)
  const memoryUsageEstimate = totalTokens * 4 + totalSections * 100 // 100 bytes per section overhead
  
  return {
    totalCached: cacheCount,
    averageSectionsPerArticle: cacheCount > 0 ? totalSections / cacheCount : 0,
    averageContextTokens: cacheCount > 0 ? totalTokens / cacheCount : 0,
    memoryUsageEstimate
  }
}

// Auto-cleanup every 30 minutes
setInterval(cleanupContextCache, 30 * 60 * 1000)
