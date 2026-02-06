/**
 * Tests for AI Autocomplete Service
 * Story A-5: Onboarding Agent AI Autocomplete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  generateAutocompleteSuggestions, 
  clearAutocompleteCache, 
  clearRateLimitTracker,
  AutocompleteRequest, 
  AutocompleteResponse 
} from '@/lib/services/ai-autocomplete'

// Mock OpenRouter client
vi.mock('@/lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn()
}))

import { generateContent } from '@/lib/services/openrouter/openrouter-client'

// Mock getCurrentUser for authentication tests
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn()
}))

import { getCurrentUser } from '@/lib/supabase/get-current-user'

describe('AI Autocomplete Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    clearAutocompleteCache()
    clearRateLimitTracker()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateAutocompleteSuggestions', () => {
    const validRequest: AutocompleteRequest = {
      query: 'test',
      context: 'competitors',
      limit: 5
    }

    it('should reject requests without authentication', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      await expect(generateAutocompleteSuggestions(validRequest))
        .rejects.toThrow('Authentication required')
    })

    it('should reject requests without organization access', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: null
      } as any)

      await expect(generateAutocompleteSuggestions(validRequest))
        .rejects.toThrow('Authentication required')
    })

    it('should reject invalid context values', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      const invalidRequest = {
        ...validRequest,
        context: 'invalid' as any
      }

      await expect(generateAutocompleteSuggestions(invalidRequest))
        .rejects.toThrow('Invalid context')
    })

    it('should reject queries shorter than 2 characters', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      const shortQueryRequest = {
        ...validRequest,
        query: 'a'
      }

      await expect(generateAutocompleteSuggestions(shortQueryRequest))
        .rejects.toThrow('Query must be at least 2 characters')
    })

    it('should reject limit greater than 10', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      const highLimitRequest = {
        ...validRequest,
        limit: 15
      }

      await expect(generateAutocompleteSuggestions(highLimitRequest))
        .rejects.toThrow('Limit cannot exceed 10')
    })

    it('should generate AI suggestions for competitors context', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: JSON.stringify([
          { text: 'Competitor A', category: 'competitor' },
          { text: 'Competitor B', category: 'competitor' },
          { text: 'Industry Leader', category: 'industry' }
        ]),
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      const result = await generateAutocompleteSuggestions(validRequest)

      expect(result).toEqual({
        suggestions: [
          { id: expect.any(String), text: 'Competitor A', category: 'competitor', source: 'ai' },
          { id: expect.any(String), text: 'Competitor B', category: 'competitor', source: 'ai' },
          { id: expect.any(String), text: 'Industry Leader', category: 'industry', source: 'ai' }
        ],
        cached: false,
        processingTime: expect.any(Number)
      })
    })

    it('should generate AI suggestions for business context', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: JSON.stringify([
          { text: 'Innovative solutions provider', category: 'best-practice' },
          { text: 'Customer-centric approach', category: 'best-practice' }
        ]),
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      const businessRequest = {
        ...validRequest,
        context: 'business' as const
      }

      const result = await generateAutocompleteSuggestions(businessRequest)

      expect(result.suggestions).toHaveLength(2)
      expect(result.suggestions[0].category).toBe('best-practice')
      expect(result.suggestions[0].source).toBe('ai')
    })

    it('should generate AI suggestions for blog context', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: JSON.stringify([
          { text: 'How-to guides', category: 'template' },
          { text: 'Industry insights', category: 'template' }
        ]),
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      const blogRequest = {
        ...validRequest,
        context: 'blog' as const
      }

      const result = await generateAutocompleteSuggestions(blogRequest)

      expect(result.suggestions).toHaveLength(2)
      expect(result.suggestions[0].category).toBe('template')
    })

    it('should handle AI service failures gracefully', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockRejectedValue(new Error('AI service unavailable'))

      const result = await generateAutocompleteSuggestions(validRequest)

      // Should return fallback suggestions
      expect(result).toEqual({
        suggestions: [
          { id: expect.any(String), text: 'Type competitor URL manually', category: 'template', source: 'fallback' },
          { id: expect.any(String), text: 'Search for competitors online', category: 'best-practice', source: 'fallback' }
        ],
        cached: false,
        processingTime: expect.any(Number)
      })
    })

    it('should handle malformed AI responses gracefully', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: 'invalid json response',
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      const result = await generateAutocompleteSuggestions(validRequest)

      // Should return fallback suggestions
      expect(result.suggestions).toEqual([
        { id: expect.any(String), text: 'Type competitor URL manually', category: 'template', source: 'fallback' },
        { id: expect.any(String), text: 'Search for competitors online', category: 'best-practice', source: 'fallback' }
      ])
    })

    it('should enforce rate limiting', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: JSON.stringify([{ text: 'Test suggestion', category: 'template' }]),
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      // Make 11 requests with same user (should exceed rate limit of 10 per minute)
      const requests = Array(11).fill(null).map(() => generateAutocompleteSuggestions(validRequest))

      const results = await Promise.allSettled(requests)

      // At least one request should be rejected due to rate limiting
      const rejectedRequests = results.filter(result => result.status === 'rejected')
      expect(rejectedRequests.length).toBeGreaterThan(0)

      const rejected = rejectedRequests[0] as PromiseRejectedResult
      expect(rejected.reason).toBeInstanceOf(Error)
      expect(rejected.reason.message).toContain('Rate limit exceeded')
    })

    it('should provide caching for frequent queries', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: JSON.stringify([{ text: 'Cached suggestion', category: 'template' }]),
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      // First request
      const result1 = await generateAutocompleteSuggestions(validRequest)
      expect(result1.cached).toBe(false)
      expect(generateContent).toHaveBeenCalledTimes(1)

      // Second identical request (should be cached)
      const result2 = await generateAutocompleteSuggestions(validRequest)
      expect(result2.cached).toBe(true)
      expect(generateContent).toHaveBeenCalledTimes(1) // Still only called once
    })

    it('should filter inappropriate content', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'user',
        org_id: 'org-id'
      } as any)

      vi.mocked(generateContent).mockResolvedValue({
        content: JSON.stringify([
          { text: 'Valid suggestion', category: 'template' },
          { text: 'Spam content here', category: 'competitor' },
          { text: 'Another valid one', category: 'industry' }
        ]),
        tokensUsed: 100,
        modelUsed: 'google/gemini-2.5-flash',
        promptTokens: 50,
        completionTokens: 50
      })

      const result = await generateAutocompleteSuggestions(validRequest)

      // Should filter out inappropriate content
      expect(result.suggestions).toHaveLength(2)
      expect(result.suggestions.map((s: any) => s.text)).not.toContain('Spam content here')
    })
  })
})
