/**
 * AI Autocomplete Service
 * Story A-5: Onboarding Agent AI Autocomplete
 * 
 * Provides AI-powered autocomplete suggestions for onboarding forms
 * with privacy-first design, caching, and rate limiting.
 */

import { generateContent } from '@/lib/services/openrouter/openrouter-client'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import type { 
  AutocompleteRequest, 
  AutocompleteResponse, 
  AutocompleteSuggestion,
  AutocompleteCacheEntry,
  AutocompleteRateLimit
} from '@/types/autocomplete'

// In-memory cache with TTL
const autocompleteCache = new Map<string, AutocompleteCacheEntry>()

// Rate limiting tracker (10 requests per minute per user)
const rateLimitTracker = new Map<string, AutocompleteRateLimit>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_COUNT = 10 // 10 requests per minute
const CACHE_TTL = 60 * 60 * 1000 // 1 hour cache TTL

// Inappropriate content filters (basic word list)
const INAPPROPRIATE_WORDS = [
  'spam', 'scam', 'fraud', 'illegal', 'hack', 'virus', 'malware',
  'adult', 'explicit', 'xxx', 'drugs', 'weapon', 'violence'
]

/**
 * Generate AI-powered autocomplete suggestions
 */
export async function generateAutocompleteSuggestions(
  request: AutocompleteRequest
): Promise<AutocompleteResponse> {
  const startTime = Date.now()

  // Authentication check
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    throw new Error('Authentication required')
  }

  // Organization access check
  if (!currentUser.org_id) {
    throw new Error('Organization access required')
  }

  // Input validation
  if (!['competitors', 'business', 'blog'].includes(request.context)) {
    throw new Error('Invalid context. Must be: competitors, business, or blog')
  }

  if (request.query.length < 2) {
    throw new Error('Query must be at least 2 characters')
  }

  if (request.limit && request.limit > 10) {
    throw new Error('Limit cannot exceed 10')
  }

  const limit = request.limit || 5
  const userId = currentUser.id
  const cacheKey = `${userId}:${request.context}:${request.query.toLowerCase()}`

  // Rate limiting check
  checkRateLimit(userId)

  // Check cache first
  const cached = checkCache(cacheKey)
  if (cached) {
    return {
      suggestions: cached.suggestions,
      cached: true,
      processingTime: Date.now() - startTime
    }
  }

  // Generate AI suggestions
  const suggestions = await generateAISuggestions(request, currentUser.org_id)

  // Cache the results
  setCache(cacheKey, suggestions)

  return {
    suggestions,
    cached: false,
    processingTime: Date.now() - startTime
  }
}

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): void {
  const now = Date.now()
  const current = rateLimitTracker.get(userId)

  if (!current) {
    rateLimitTracker.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
      windowMs: RATE_LIMIT_WINDOW
    })
    return
  }

  // Reset window if expired
  if (now > current.resetTime) {
    rateLimitTracker.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
      windowMs: RATE_LIMIT_WINDOW
    })
    return
  }

  // Check if rate limit exceeded
  if (current.count >= RATE_LIMIT_COUNT) {
    throw new Error(`Rate limit exceeded. Maximum ${RATE_LIMIT_COUNT} requests per ${RATE_LIMIT_WINDOW / 1000} seconds.`)
  }

  // Increment count
  current.count++
}

/**
 * Check cache for existing suggestions
 */
function checkCache(key: string): AutocompleteCacheEntry | null {
  const entry = autocompleteCache.get(key)
  if (!entry) {
    return null
  }

  // Check if cache entry is still valid
  if (Date.now() > entry.timestamp + entry.ttl) {
    autocompleteCache.delete(key)
    return null
  }

  return entry
}

/**
 * Set cache entry
 */
function setCache(key: string, suggestions: AutocompleteSuggestion[]): void {
  autocompleteCache.set(key, {
    suggestions,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

/**
 * Generate AI suggestions using OpenRouter
 */
async function generateAISuggestions(
  request: AutocompleteRequest,
  organizationId: string
): Promise<AutocompleteSuggestion[]> {
  try {
    const systemPrompt = createSystemPrompt(request.context)
    const userPrompt = createUserPrompt(request.query, request.context)

    const response = await generateContent([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      maxTokens: 500,
      temperature: 0.7,
      model: 'google/gemini-2.5-flash'
    })

    // Parse AI response
    let suggestions: AutocompleteSuggestion[] = []
    
    try {
      const parsed = JSON.parse(response.content)
      if (Array.isArray(parsed)) {
        suggestions = parsed
          .filter(item => typeof item === 'object' && item.text)
          .map((item, index) => ({
            id: `ai-${Date.now()}-${index}`,
            text: item.text,
            category: validateCategory(item.category, request.context),
            source: 'ai' as const
          }))
          .filter(suggestion => !containsInappropriateContent(suggestion.text))
          .slice(0, request.limit || 5)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Return fallback suggestions for parse errors
      return getFallbackSuggestions(request.context)
    }

    // If AI suggestions are empty, return fallback
    if (suggestions.length === 0) {
      return getFallbackSuggestions(request.context)
    }

    return suggestions

  } catch (error) {
    console.error('AI service error:', error)
    // Graceful fallback
    return getFallbackSuggestions(request.context)
  }
}

/**
 * Create system prompt based on context
 */
function createSystemPrompt(context: string): string {
  const basePrompt = `You are an AI assistant helping users with onboarding. Generate relevant, helpful suggestions that are:
- Professional and business-appropriate
- Generic and not personalized (no PII)
- Focused on the specific context
- Categorized appropriately

Return suggestions as a JSON array with objects containing:
- text: The suggestion text
- category: One of: competitor, industry, best-practice, template

Keep suggestions concise (max 60 characters each).`

  switch (context) {
    case 'competitors':
      return `${basePrompt}

For competitors context, suggest:
- Common competitor websites in tech/SaaS
- Industry leader websites
- Popular business websites
Categories: competitor, industry`

    case 'business':
      return `${basePrompt}

For business description context, suggest:
- Professional business descriptions
- Industry best practices
- Common business value propositions
Categories: best-practice, industry`

    case 'blog':
      return `${basePrompt}

For blog settings context, suggest:
- Common blog topics
- Blog post templates
- Content strategy ideas
Categories: template, best-practice`

    default:
      return basePrompt
  }
}

/**
 * Create user prompt
 */
function createUserPrompt(query: string, context: string): string {
  return `Generate 3-5 autocomplete suggestions for the partial input: "${query}" in the context of ${context}.`
}

/**
 * Validate and normalize category
 */
function validateCategory(category: any, context: string): 'competitor' | 'industry' | 'best-practice' | 'template' {
  const validCategories = ['competitor', 'industry', 'best-practice', 'template']
  
  if (validCategories.includes(category)) {
    return category
  }

  // Default category based on context
  switch (context) {
    case 'competitors':
      return 'competitor'
    case 'business':
      return 'best-practice'
    case 'blog':
      return 'template'
    default:
      return 'template'
  }
}

/**
 * Check for inappropriate content
 */
function containsInappropriateContent(text: string): boolean {
  const lowerText = text.toLowerCase()
  return INAPPROPRIATE_WORDS.some(word => lowerText.includes(word))
}

/**
 * Get fallback suggestions when AI fails
 */
function getFallbackSuggestions(context: string): AutocompleteSuggestion[] {
  const fallbacks = {
    competitors: [
      { text: 'Type competitor URL manually', category: 'template' as const },
      { text: 'Search for competitors online', category: 'best-practice' as const }
    ],
    business: [
      { text: 'Describe your business manually', category: 'template' as const },
      { text: 'Focus on value proposition', category: 'best-practice' as const }
    ],
    blog: [
      { text: 'Enter blog topics manually', category: 'template' as const },
      { text: 'Consider your audience needs', category: 'best-practice' as const }
    ]
  }

  return fallbacks[context as keyof typeof fallbacks].map((suggestion, index) => ({
    id: `fallback-${Date.now()}-${index}`,
    text: suggestion.text,
    category: suggestion.category,
    source: 'fallback' as const
  }))
}

/**
 * Clear cache (for testing/admin purposes)
 */
export function clearAutocompleteCache(): void {
  autocompleteCache.clear()
}

/**
 * Clear rate limit tracker (for testing/admin purposes)
 */
export function clearRateLimitTracker(): void {
  rateLimitTracker.clear()
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): {
  size: number
  entries: Array<{ key: string; timestamp: number; ttl: number }>
} {
  const entries = Array.from(autocompleteCache.entries()).map(([key, entry]) => ({
    key,
    timestamp: entry.timestamp,
    ttl: entry.ttl
  }))

  return {
    size: autocompleteCache.size,
    entries
  }
}

/**
 * Get rate limit statistics (for monitoring)
 */
export function getRateLimitStats(): {
  size: number
  entries: Array<{ userId: string; count: number; resetTime: number }>
} {
  const entries = Array.from(rateLimitTracker.entries()).map(([userId, limit]) => ({
    userId,
    count: limit.count,
    resetTime: limit.resetTime
  }))

  return {
    size: rateLimitTracker.size,
    entries
  }
}
