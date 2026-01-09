/**
 * Research Optimizer for Article Generation
 * Implements batch research strategy to reduce API calls from 8-13 to 1-2 per article
 * Performance Optimization Story 4a-12
 */

import { researchQuery, type TavilySource } from '@/lib/services/tavily/tavily-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'

/**
 * Cached research data for an entire article
 */
export interface ArticleResearchCache {
  articleId: string
  keyword: string
  comprehensiveSources: TavilySource[]
  sectionSpecificSources: Map<string, TavilySource[]>
  generatedAt: string
  ttl: number // Time to live in milliseconds
}

/**
 * In-memory cache for research data
 */
const researchCache = new Map<string, ArticleResearchCache>()

/**
 * Cache TTL: 30 minutes
 */
const CACHE_TTL = 30 * 60 * 1000

/**
 * Perform comprehensive research for an entire article in one batch
 * 
 * @param articleId - Unique article identifier
 * @param keyword - Primary keyword
 * @param outline - Article outline with all sections
 * @param organizationId - Organization ID for cost tracking
 * @returns Research cache with comprehensive and section-specific sources
 */
export async function performBatchResearch(
  articleId: string,
  keyword: string,
  outline: Outline,
  organizationId: string
): Promise<ArticleResearchCache> {
  console.log(`[ResearchOptimizer] Starting batch research for article ${articleId}`)
  const startTime = Date.now()

  // Check cache first
  const cached = getCachedResearch(articleId)
  if (cached && !isCacheExpired(cached)) {
    console.log(`[ResearchOptimizer] Cache hit for article ${articleId}`)
    return cached
  }

  // Build comprehensive research query covering all sections
  const comprehensiveQuery = buildComprehensiveQuery(keyword, outline)
  
  // Fetch comprehensive research in ONE API call
  let comprehensiveSources: TavilySource[] = []
  try {
    comprehensiveSources = await researchQuery(comprehensiveQuery, { maxRetries: 3 })
    console.log(`[ResearchOptimizer] Fetched ${comprehensiveSources.length} comprehensive sources`)
    
    // Track API cost
    await trackApiCost(organizationId, 0.08)
  } catch (error) {
    console.warn(`[ResearchOptimizer] Comprehensive research failed: ${error instanceof Error ? error.message : String(error)}`)
    // Continue with empty sources - don't block generation
  }

  // Create section-specific source mapping
  const sectionSpecificSources = new Map<string, TavilySource[]>()
  
  // Get all section titles for targeted research
  const sectionTitles = [
    outline.introduction.title,
    ...outline.h2_sections.map(h2 => h2.title),
    outline.conclusion.title,
    ...(outline.faq?.included ? [outline.faq.title] : [])
  ]

  // For complex articles with many sections, do targeted research for key sections only
  const keySections = sectionTitles.slice(0, 5) // Top 5 most important sections
  
  if (keySections.length > 0 && comprehensiveSources.length < 10) {
    // Build targeted query for key sections
    const targetedQuery = buildTargetedQuery(keyword, keySections)
    
    try {
      const targetedSources = await researchQuery(targetedQuery, { maxRetries: 2 })
      console.log(`[ResearchOptimizer] Fetched ${targetedSources.length} targeted sources`)
      
      // Track additional API cost
      await trackApiCost(organizationId, 0.05)
      
      // Merge comprehensive and targeted sources
      const allSources = [...comprehensiveSources, ...targetedSources]
      
      // Remove duplicates (same URL)
      const uniqueSources = allSources.filter((source, index, self) => 
        index === self.findIndex(s => s.url === source.url)
      )
      
      comprehensiveSources = uniqueSources
    } catch (error) {
      console.warn(`[ResearchOptimizer] Targeted research failed: ${error instanceof Error ? error.message : String(error)}`)
      // Continue with comprehensive sources only
    }
  }

  // Rank and categorize sources by section relevance
  for (const sectionTitle of sectionTitles) {
    const relevantSources = rankSourcesByRelevance(comprehensiveSources, sectionTitle, keyword)
    sectionSpecificSources.set(sectionTitle, relevantSources.slice(0, 8)) // Top 8 per section
  }

  // Create cache entry
  const cacheEntry: ArticleResearchCache = {
    articleId,
    keyword,
    comprehensiveSources,
    sectionSpecificSources,
    generatedAt: new Date().toISOString(),
    ttl: CACHE_TTL
  }

  // Store in memory cache
  researchCache.set(articleId, cacheEntry)
  
  const duration = Date.now() - startTime
  console.log(`[ResearchOptimizer] Batch research completed in ${duration}ms for article ${articleId}`)
  
  return cacheEntry
}

/**
 * Get relevant research sources for a specific section
 * 
 * @param articleId - Article identifier
 * @param sectionTitle - Section title
 * @returns Array of relevant research sources
 */
export function getSectionResearchSources(
  articleId: string,
  sectionTitle: string
): TavilySource[] {
  const cached = getCachedResearch(articleId)
  if (!cached) {
    console.warn(`[ResearchOptimizer] No research cache found for article ${articleId}`)
    return []
  }

  const sources = cached.sectionSpecificSources.get(sectionTitle) || []
  console.log(`[ResearchOptimizer] Returning ${sources.length} sources for section: ${sectionTitle}`)
  
  return sources
}

/**
 * Build comprehensive research query covering entire article
 */
function buildComprehensiveQuery(keyword: string, outline: Outline): string {
  const year = new Date().getFullYear()
  
  // Include main keyword and top H2 sections
  const topH2Sections = outline.h2_sections
    .slice(0, 5)
    .map(h2 => h2.title)
    .join(' ')

  const query = `${keyword} ${topH2Sections} ${year} comprehensive guide best practices latest trends`
  
  // Limit to ~150 characters for optimal API results
  return query.length > 150 ? query.substring(0, 150).trim() : query
}

/**
 * Build targeted research query for specific sections
 */
function buildTargetedQuery(keyword: string, sectionTitles: string[]): string {
  const year = new Date().getFullYear()
  const sections = sectionTitles.slice(0, 3).join(' ') // Top 3 sections
  
  const query = `${keyword} ${sections} ${year} detailed analysis examples`
  
  return query.length > 120 ? query.substring(0, 120).trim() : query
}

/**
 * Rank sources by relevance to a specific section
 */
function rankSourcesByRelevance(
  sources: TavilySource[],
  sectionTitle: string,
  keyword: string
): TavilySource[] {
  const sectionKeywords = sectionTitle.toLowerCase().split(' ')
  const mainKeyword = keyword.toLowerCase()
  
  return sources
    .map(source => {
      let relevanceScore = 0
      
      // Title relevance (highest weight)
      const title = source.title.toLowerCase()
      if (title.includes(mainKeyword)) relevanceScore += 3
      sectionKeywords.forEach(sk => {
        if (title.includes(sk)) relevanceScore += 2
      })
      
      // Content/excerpt relevance (medium weight)
      if (source.excerpt) {
        const excerpt = source.excerpt.toLowerCase()
        if (excerpt.includes(mainKeyword)) relevanceScore += 2
        sectionKeywords.forEach(sk => {
          if (excerpt.includes(sk)) relevanceScore += 1
        })
      }
      
      // URL relevance (low weight)
      const url = source.url.toLowerCase()
      if (url.includes(mainKeyword)) relevanceScore += 1
      
      return { ...source, relevanceScore }
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
}

/**
 * Get cached research data
 */
function getCachedResearch(articleId: string): ArticleResearchCache | null {
  return researchCache.get(articleId) || null
}

/**
 * Check if cache entry has expired
 */
function isCacheExpired(cache: ArticleResearchCache): boolean {
  return Date.now() - new Date(cache.generatedAt).getTime() > cache.ttl
}

/**
 * Clear research cache for an article
 */
export function clearResearchCache(articleId: string): void {
  researchCache.delete(articleId)
  console.log(`[ResearchOptimizer] Cleared cache for article ${articleId}`)
}

/**
 * Clear expired cache entries
 */
export function cleanupExpiredCache(): void {
  const expiredEntries: string[] = []
  
  for (const [articleId, cache] of researchCache.entries()) {
    if (isCacheExpired(cache)) {
      expiredEntries.push(articleId)
    }
  }
  
  expiredEntries.forEach(articleId => researchCache.delete(articleId))
  
  if (expiredEntries.length > 0) {
    console.log(`[ResearchOptimizer] Cleaned up ${expiredEntries.length} expired cache entries`)
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getResearchCacheStats(): {
  totalCached: number
  expiredCount: number
  averageSourcesPerArticle: number
} {
  let expiredCount = 0
  let totalSources = 0
  
  for (const cache of researchCache.values()) {
    if (isCacheExpired(cache)) {
      expiredCount++
    }
    totalSources += cache.comprehensiveSources.length
  }
  
  return {
    totalCached: researchCache.size,
    expiredCount,
    averageSourcesPerArticle: researchCache.size > 0 ? totalSources / researchCache.size : 0
  }
}

/**
 * Track API cost for research operations
 */
async function trackApiCost(organizationId: string, cost: number): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    await (supabase
      .from('api_costs' as any)
      .insert({
        organization_id: organizationId,
        service: 'tavily',
        operation: 'batch_research',
        cost
      }) as unknown as Promise<{ error: any }>)
  } catch (error) {
    console.error('Failed to track batch research API cost:', error)
    // Don't throw - cost tracking failure shouldn't block article generation
  }
}

// Auto-cleanup expired cache every 15 minutes
setInterval(cleanupExpiredCache, 15 * 60 * 1000)
