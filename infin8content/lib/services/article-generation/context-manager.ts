/**
 * Context Manager for Article Generation
 * Optimizes token usage and reduces database operations
 * Performance Optimization Story 4a-12
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Section } from './section-processor'
import { estimateTokens, trackTokenUsage, calculateTokenOptimization, validateTokenReduction } from '@/lib/utils/token-management'

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
 * In-memory cache for context data with performance tracking
 */
const contextCache = new Map<string, ArticleContextCache>()

/**
 * Cache performance tracking for Story 20.5
 */
const cacheStats = {
  hits: 0,
  misses: 0,
  totalRequests: 0
}

/**
 * Maximum context size to prevent token bloat (Story 20.5 requirement)
 */
const MAX_CONTEXT_TOKENS = 1500
const MAX_SECTIONS_IN_CONTEXT = 6
const MAX_LAST_SECTION_CHARS = 400
const MAX_EARLIER_SECTION_SENTENCES = 3

/**
 * Get or create context cache for an article with performance tracking
 */
export function getArticleContext(articleId: string, keyword: string): ArticleContextCache {
  cacheStats.totalRequests++
  
  let cache = contextCache.get(articleId)
  
  if (!cache) {
    cacheStats.misses++
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
    console.log(`[ContextManager] Cache miss for article ${articleId}`)
  } else {
    cacheStats.hits++
    console.log(`[ContextManager] Cache hit for article ${articleId}`)
  }
  
  return cache
}

/**
 * Build optimized context for section generation
 * Story 20.5: Context Management Optimization
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
  
  // Use internal function to avoid double cache tracking
  const fullContext = buildOptimizedContextInternal(articleId, currentSectionIndex, previousSections, targetWordCount, cache)
  
  console.log(`[ContextManager] Built optimized context for section ${currentSectionIndex}: ${Math.round(fullContext.length / 4)} tokens`)
  
  return fullContext
}

/**
 * Apply Story 20.5 incremental compression rules
 * - Last section: up to 400 characters with more detail
 * - Earlier sections: 2-3 sentences only
 */
function applyIncrementalCompression(
  summaries: string[], 
  sections: Section[]
): string {
  if (summaries.length === 0) return ''
  
  const compressedSummaries: string[] = []
  
  // Process all but the last section with 2-3 sentence compression
  for (let i = 0; i < summaries.length - 1; i++) {
    const summary = summaries[i]
    const section = sections[i]
    
    if (section) {
      // Extract 2-3 sentences for earlier sections
      const compressed = compressToSentences(summary, MAX_EARLIER_SECTION_SENTENCES)
      compressedSummaries.push(`${section.title}: ${compressed}`)
    } else {
      compressedSummaries.push(summary)
    }
  }
  
  // Add last section with up to 400 characters
  const lastSummary = summaries[summaries.length - 1]
  const lastSection = sections[sections.length - 1]
  
  if (lastSection && lastSummary) {
    const lastSectionContent = extractKeyPoints(lastSection.content, lastSection.word_count)
    const limitedContent = lastSectionContent.length > MAX_LAST_SECTION_CHARS 
      ? lastSectionContent.substring(0, MAX_LAST_SECTION_CHARS - 3) + '...'
      : lastSectionContent
    compressedSummaries.push(`${lastSection.title}: ${limitedContent}`)
  }
  
  return compressedSummaries.join('\n')
}

/**
 * Compress text to specified number of sentences
 */
function compressToSentences(text: string, maxSentences: number): string {
  if (!text || maxSentences <= 0) return ''
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const selectedSentences = sentences.slice(0, maxSentences)
  
  return selectedSentences.join('. ').trim() + (selectedSentences.length > 0 ? '.' : '')
}

/**
 * Truncate context and add truncation indicator
 */
function truncateContextWithIndicator(context: string, maxTokens: number): string {
  const maxChars = maxTokens * 4
  
  if (context.length <= maxChars) {
    return context
  }
  
  // Find a good truncation point (end of a section)
  let truncated = context.substring(0, maxChars - 3) // Leave room for '...'
  
  // Try to end at a section boundary
  const lastSectionIndex = Math.max(
    truncated.lastIndexOf('## '),
    truncated.lastIndexOf('\n\n'),
    truncated.lastIndexOf('. ')
  )
  
  if (lastSectionIndex > 0 && lastSectionIndex < truncated.length - 10) {
    truncated = truncated.substring(0, lastSectionIndex)
  }
  
  return truncated + '...'
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
    
    // Add to cumulative summary with section title for Story 20.5
    const summaryLine = `${section.title}: ${keyPoints}`
    
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
 * Get context statistics for monitoring (without affecting cache stats)
 */
export function getContextStats(articleId: string): {
  sectionsCached: number
  summaryLength: number
  estimatedTokens: number
  totalWordCount: number
} | null {
  const cache = contextCache.get(articleId)
  if (!cache) return null
  
  // Build context without affecting cache stats - directly use cache
  const contextParts: string[] = []
  
  // Add keyword focus
  contextParts.push(`Keyword Focus: ${cache.keyword}`)
  
  // Add cumulative summary with incremental compression (Story 20.5 AC #1, #2)
  if (cache.cumulativeSummary.length > 0) {
    contextParts.push('Previous Sections Summary:')
    contextParts.push(cache.cumulativeSummary.slice(-MAX_SECTIONS_IN_CONTEXT).join('\n'))
  }
  
  // Add word count guidance
  contextParts.push(`Target Word Count: 0 words`)
  
  const fullContext = contextParts.join('\n\n')
  const estimatedTokens = fullContext.length / 4
  
  return {
    sectionsCached: cache.sectionKeyPoints.size,
    summaryLength: cache.cumulativeSummary.length,
    estimatedTokens: Math.round(estimatedTokens),
    totalWordCount: cache.totalWordCount
  }
}

/**
 * Get token usage statistics for Story 20.5 AC #4
 */
export function getTokenUsageStats(articleId: string): {
  contextTokens: number
  optimizationMetrics: {
    reduction: number
    originalTokens: number
    optimizedTokens: number
    savings: number
  }
  validation: {
    achieved: boolean
    actualReduction: number
    targetReduction: number
    message: string
  }
} | null {
  const cache = contextCache.get(articleId)
  if (!cache) return null
  
  // Build optimized context
  const optimizedContext = buildOptimizedContext(articleId, 0, [], 0)
  
  // Estimate original context (without optimization)
  const originalContext = buildOriginalContext(cache)
  
  // Calculate optimization metrics
  const optimizationMetrics = calculateTokenOptimization(originalContext, optimizedContext)
  
  // Validate against Story 20.5 requirements
  const validation = validateTokenReduction(originalContext, optimizedContext)
  
  return {
    contextTokens: estimateTokens(optimizedContext),
    optimizationMetrics,
    validation
  }
}

/**
 * Build original context (without optimization) for comparison
 */
function buildOriginalContext(cache: ArticleContextCache): string {
  const contextParts: string[] = []
  
  // Add keyword focus
  contextParts.push(`Keyword Focus: ${cache.keyword}`)
  
  // Add full cumulative summary (no compression)
  if (cache.cumulativeSummary.length > 0) {
    contextParts.push('Previous Sections Summary:')
    contextParts.push(cache.cumulativeSummary.join('\n'))
  }
  
  // Add word count guidance
  contextParts.push(`Target Word Count: 0 words`)
  
  return contextParts.join('\n\n')
}

/**
 * Internal context building function (without cache tracking)
 */
function buildOptimizedContextInternal(
  articleId: string,
  currentSectionIndex: number,
  previousSections: Section[],
  targetWordCount: number,
  cache: ArticleContextCache
): string {
  // Only rebuild context if we have new sections
  if (previousSections.length > cache.lastSectionIndex + 1) {
    updateContextCache(cache, previousSections)
  }
  
  // Build context from cached data with Story 20.5 requirements
  const contextParts: string[] = []
  
  // Add keyword focus
  contextParts.push(`Keyword Focus: ${cache.keyword}`)
  
  // Add cumulative summary with incremental compression (Story 20.5 AC #1, #2)
  if (cache.cumulativeSummary.length > 0) {
    contextParts.push('Previous Sections Summary:')
    
    // Apply Story 20.5 compression rules:
    // - Last section: up to 400 characters with more detail
    // - Earlier sections: 2-3 sentences only
    const compressedSummaries = applyIncrementalCompression(cache.cumulativeSummary, previousSections)
    contextParts.push(compressedSummaries)
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
  
  // Apply Story 20.5 token limit (1500 tokens)
  const estimatedTokens = estimateTokens(fullContext)
  if (estimatedTokens > MAX_CONTEXT_TOKENS) {
    fullContext = truncateContextWithIndicator(fullContext, MAX_CONTEXT_TOKENS)
    console.warn(`[ContextManager] Context truncated from ${estimatedTokens} to ${MAX_CONTEXT_TOKENS} tokens`)
  }
  
  return fullContext
}

/**
 * Clear all cache entries (useful for testing)
 */
export function clearAllCache(): void {
  const size = contextCache.size
  contextCache.clear()
  console.log(`[ContextManager] Cleared all ${size} cache entries`)
}

/**
 * Clear context cache for an article with stats update
 */
export function clearContextCache(articleId: string): void {
  const existed = contextCache.has(articleId)
  contextCache.delete(articleId)
  
  if (existed) {
    console.log(`[ContextManager] Cleared context cache for article ${articleId}`)
  } else {
    console.log(`[ContextManager] No cache entry found for article ${articleId}`)
  }
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
 * Enhanced for Story 20.5 with fallback mechanisms
 */
export async function batchUpdateSections(
  articleId: string,
  sections: Section[]
): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    // Update all sections in one database operation
    const { error } = await supabase
      .from('articles' as any)
      .update({
        sections: sections,
        current_section_index: sections.length > 0 ? sections[sections.length - 1].section_index : 0
      })
      .eq('id', articleId)
    
    if (error) {
      console.error(`[ContextManager] Batch update failed, attempting fallback:`, error)
      await fallbackIndividualUpdates(articleId, sections)
    } else {
      console.log(`[ContextManager] Batch updated ${sections.length} sections for article ${articleId}`)
    }
  } catch (error) {
    console.error(`[ContextManager] Critical error in batch update, attempting fallback:`, error)
    await fallbackIndividualUpdates(articleId, sections)
  }
}

/**
 * Fallback mechanism for individual section updates when batch fails
 */
async function fallbackIndividualUpdates(
  articleId: string,
  sections: Section[]
): Promise<void> {
  const supabase = createServiceRoleClient()
  let successCount = 0
  let failureCount = 0
  
  console.log(`[ContextManager] Executing fallback: individual updates for ${sections.length} sections`)
  
  // Update sections one by one as fallback
  for (const section of sections) {
    try {
      const { error } = await supabase
        .from('articles' as any)
        .update({
          sections: sections,
          current_section_index: section.section_index
        })
        .eq('id', articleId)
      
      if (error) {
        console.error(`[ContextManager] Failed to update section ${section.section_index}:`, error)
        failureCount++
      } else {
        successCount++
      }
    } catch (sectionError) {
      console.error(`[ContextManager] Critical error updating section ${section.section_index}:`, sectionError)
      failureCount++
    }
  }
  
  if (successCount === sections.length) {
    console.log(`[ContextManager] Fallback successful: updated all ${successCount} sections individually`)
  } else {
    console.warn(`[ContextManager] Fallback partial success: ${successCount}/${sections.length} sections updated, ${failureCount} failed`)
    throw new Error(`Failed to update ${failureCount} sections even with fallback`)
  }
}

/**
 * Get cache performance statistics for Story 20.5 AC #4
 */
export function getCachePerformanceStats(): {
  hits: number
  misses: number
  totalRequests: number
  hitRate: number
  missRate: number
} {
  const hitRate = cacheStats.totalRequests > 0 ? cacheStats.hits / cacheStats.totalRequests : 0
  const missRate = cacheStats.totalRequests > 0 ? cacheStats.misses / cacheStats.totalRequests : 0
  
  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    totalRequests: cacheStats.totalRequests,
    hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
    missRate: Math.round(missRate * 100) / 100
  }
}

/**
 * Reset cache statistics (useful for testing)
 */
export function resetCacheStats(): void {
  cacheStats.hits = 0
  cacheStats.misses = 0
  cacheStats.totalRequests = 0
  console.log('[ContextManager] Cache statistics reset')
}

/**
 * Get performance metrics for context optimization with cache stats
 */
export function getPerformanceMetrics(): {
  totalCached: number
  averageSectionsPerArticle: number
  averageContextTokens: number
  memoryUsageEstimate: number
  cacheHitRate: number
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
  
  const cachePerformance = getCachePerformanceStats()
  
  return {
    totalCached: cacheCount,
    averageSectionsPerArticle: cacheCount > 0 ? totalSections / cacheCount : 0,
    averageContextTokens: cacheCount > 0 ? totalTokens / cacheCount : 0,
    memoryUsageEstimate,
    cacheHitRate: cachePerformance.hitRate
  }
}

// Auto-cleanup every 30 minutes
setInterval(cleanupContextCache, 30 * 60 * 1000)
