/**
 * Research Optimizer for Article Generation
 * Implements batch research strategy to reduce API calls from 8-13 to 1-2 per article
 * Performance Optimization Story 4a-12
 */

import { researchQuery, type TavilySource } from '@/lib/services/tavily/tavily-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'
import { performanceMonitor } from './performance-monitor'

/**
 * Article research cache interface with enhanced performance tracking
 */
export interface ArticleResearchCache {
  articleId: string
  keyword: string
  comprehensiveSources: TavilySource[]
  sectionSpecificSources: Map<string, TavilySource[]>
  generatedAt: string
  ttl: number // TTL in milliseconds (default: 24 hours)
  cacheHits: number // Track cache hit count
  lastAccessed: string // Track when cache was last accessed
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  totalCached: number
  expiredCount: number
  averageSourcesPerArticle: number
  cacheHitRate: number // Percentage of cache hits
  totalApiCallsSaved: number
  costSavings: number // Estimated cost savings in USD
}

/**
 * In-memory cache for research data
 */
const researchCache = new Map<string, ArticleResearchCache>()

/**
 * Track total cache requests for accurate hit rate calculation
 */
let totalCacheRequests = 0

/**
 * Cache TTL: 24 hours for consistency with story requirements
 */
const CACHE_TTL = 24 * 60 * 60 * 1000

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
    
    // Track API call for performance monitoring
    performanceMonitor.recordApiCall(articleId, 'research')
    
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
      
      // Track additional API call for performance monitoring
      performanceMonitor.recordApiCall(articleId, 'research')
      
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
    ttl: CACHE_TTL,
    cacheHits: 0,
    lastAccessed: new Date().toISOString()
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
  
  // Collect all section titles for comprehensive coverage
  const allSectionTitles = [
    outline.introduction.title,
    ...outline.h2_sections.map(h2 => h2.title),
    outline.conclusion.title,
    ...(outline.faq?.included ? [outline.faq.title] : [])
  ]
  
  // Build semantic variations of the main keyword
  const keywordVariations = [
    keyword,
    `${keyword} strategies`,
    `${keyword} techniques`,
    `${keyword} best practices`,
    `${keyword} guide`
  ]
  
  // Combine keyword variations with top section themes
  const topSections = outline.h2_sections
    .slice(0, 4) // Top 4 most important sections
    .map(h2 => h2.title)
    .join(' ')
  
  // Build comprehensive query with semantic coverage
  const query = `${keywordVariations.join(' ')} ${topSections} ${year} comprehensive guide strategies best practices latest trends`
  
  // Optimize for API limits (200 chars for comprehensive research)
  return query.length > 200 ? query.substring(0, 200).trim() : query
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
 * Rank sources by relevance to a specific section with enhanced algorithm
 */
function rankSourcesByRelevance(
  sources: TavilySource[],
  sectionTitle: string,
  keyword: string
): TavilySource[] {
  const sectionKeywords = sectionTitle.toLowerCase().split(' ')
  const mainKeyword = keyword.toLowerCase()
  
  // Determine section type for specialized scoring
  const sectionType = determineSectionType(sectionTitle)
  
  return sources
    .map(source => {
      let relevanceScore = 0
      const title = source.title.toLowerCase()
      const excerpt = source.excerpt?.toLowerCase() || ''
      const url = source.url.toLowerCase()
      
      // Keyword relevance scoring (enhanced weights)
      if (title.includes(mainKeyword)) relevanceScore += 4 // Increased from 3
      if (excerpt.includes(mainKeyword)) relevanceScore += 3 // Increased from 2
      
      // Section-specific keyword relevance
      sectionKeywords.forEach(sk => {
        if (sk.length > 2) { // Skip very short words
          if (title.includes(sk)) relevanceScore += 3 // Increased from 2
          if (excerpt.includes(sk)) relevanceScore += 2 // Increased from 1
        }
      })
      
      // Section type-specific scoring
      relevanceScore += calculateSectionTypeScore(title, excerpt, sectionType, mainKeyword)
      
      // Authority bonus for high-quality sources
      if (url.includes('.edu') || url.includes('.gov')) relevanceScore += 2
      if (url.includes('wikipedia') || url.includes('wiki')) relevanceScore += 1
      
      // Freshness bonus for current year mentions
      const currentYear = new Date().getFullYear().toString()
      if (title.includes(currentYear) || excerpt.includes(currentYear)) relevanceScore += 1
      
      return { ...source, relevanceScore }
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
}

/**
 * Determine section type for specialized scoring
 */
function determineSectionType(sectionTitle: string): 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq' {
  const title = sectionTitle.toLowerCase()
  if (title.includes('introduction') || title.includes('intro')) return 'introduction'
  if (title.includes('conclusion') || title.includes('summary')) return 'conclusion'
  if (title.includes('faq') || title.includes('question')) return 'faq'
  if (title.includes('how to') || title.includes('step')) return 'h3' // Usually more specific
  return 'h2' // Default to main section
}

/**
 * Calculate section type-specific relevance score
 */
function calculateSectionTypeScore(
  title: string, 
  excerpt: string, 
  sectionType: string, 
  mainKeyword: string
): number {
  let score = 0
  
  switch (sectionType) {
    case 'introduction':
      // Introduction benefits from overview and foundational content
      if (title.includes('overview') || title.includes('guide') || title.includes('basics')) score += 2
      if (excerpt.includes('comprehensive') || excerpt.includes('complete')) score += 1
      break
      
    case 'h2':
      // Main sections benefit from detailed and strategic content
      if (title.includes('strategies') || title.includes('advanced') || title.includes('implementation')) score += 2
      if (excerpt.includes('detailed') || excerpt.includes('in-depth')) score += 1
      break
      
    case 'h3':
      // Subsections benefit from specific and practical content
      if (title.includes('step') || title.includes('example') || title.includes('specific')) score += 2
      if (excerpt.includes('practical') || excerpt.includes('example')) score += 1
      break
      
    case 'conclusion':
      // Conclusion benefits from summary and future-focused content
      if (title.includes('summary') || title.includes('future') || title.includes('next')) score += 2
      if (excerpt.includes('key takeaways') || excerpt.includes('final')) score += 1
      break
      
    case 'faq':
      // FAQ benefits from question-and-answer format
      if (title.includes('answer') || title.includes('solution') || title.includes('common')) score += 2
      if (excerpt.includes('question') || excerpt.includes('answer')) score += 1
      break
  }
  
  return score
}

/**
 * Get cached research data with hit tracking
 */
function getCachedResearch(articleId: string): ArticleResearchCache | null {
  totalCacheRequests++ // Track all cache requests
  
  const cache = researchCache.get(articleId)
  if (cache) {
    // Update cache hit statistics
    cache.cacheHits++
    cache.lastAccessed = new Date().toISOString()
    console.log(`[ResearchOptimizer] Cache hit for article ${articleId} (hits: ${cache.cacheHits})`)
  }
  return cache || null
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
 * Get cache statistics for monitoring with enhanced metrics
 */
export function getResearchCacheStats(): CacheStats {
  const caches = Array.from(researchCache.values())
  const expiredCount = caches.filter(cache => isCacheExpired(cache)).length
  const totalCacheHits = caches.reduce((sum, cache) => sum + cache.cacheHits, 0)
  const totalSources = caches.reduce((sum, cache) => sum + cache.comprehensiveSources.length, 0)
  
  // Calculate estimated API calls saved (assuming 8-13 calls per article without optimization)
  const estimatedOriginalCalls = caches.length * 10 // Average of 8-13
  const actualCalls = caches.length * 2 // 1-2 calls with optimization
  const apiCallsSaved = Math.max(0, estimatedOriginalCalls - actualCalls)
  
  // Calculate cost savings ($0.08 per call)
  const costSavings = apiCallsSaved * 0.08
  
  return {
    totalCached: caches.length,
    expiredCount,
    averageSourcesPerArticle: caches.length > 0 ? totalSources / caches.length : 0,
    cacheHitRate: totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0,
    totalApiCallsSaved: apiCallsSaved,
    costSavings
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
