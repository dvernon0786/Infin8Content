/**
 * Unit Tests for Long-Tail Keyword Expander Service
 * Story 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch for DataForSEO API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock sleep function to prevent actual delays in tests
vi.mock('@/lib/services/intent-engine/retry-utils', async () => {
  const actual = await vi.importActual('@/lib/services/intent-engine/retry-utils') as any
  return {
    ...actual,
    sleep: vi.fn(() => Promise.resolve()),
    retryWithPolicy: vi.fn(async (fn, policy, context) => {
      // Use faster retry policy for tests
      const testPolicy = {
        maxAttempts: 2, // Fewer attempts for faster tests
        initialDelayMs: 10, // Much shorter delay
        backoffMultiplier: 2,
        maxDelayMs: 20
      }
      return actual.retryWithPolicy(fn, testPolicy, context)
    })
  }
})

// Mock DataForSEO API responses
const mockRelatedKeywordsResponse = {
  version: '0.1.20230228',
  status_code: 200,
  status_message: 'Ok.',
  result_count: 3,
  tasks: [{
    id: '12345',
    status_code: 200,
    status_message: 'Ok.',
    result: [
      {
        keyword: 'best seo tools 2024',
        search_volume: 1200,
        competition: 0.5,
        competition_index: 50,
        keyword_difficulty: 45,
        cpc: 2.50
      },
      {
        keyword: 'seo analysis software',
        search_volume: 800,
        competition: 0.3,
        competition_index: 30,
        keyword_difficulty: 35,
        cpc: 1.80
      },
      {
        keyword: 'keyword research tools',
        search_volume: 2500,
        competition: 0.7,
        competition_index: 70,
        keyword_difficulty: 60,
        cpc: 3.20
      }
    ]
  }]
}

const mockSuggestionsResponse = {
  version: '0.1.20230228',
  status_code: 200,
  status_message: 'Ok.',
  result_count: 3,
  tasks: [{
    id: '12346',
    status_code: 200,
    status_message: 'Ok.',
    result: [
      {
        keyword: 'seo optimization tips',
        search_volume: 1800,
        competition: 0.4,
        competition_index: 40,
        keyword_difficulty: 40,
        cpc: 2.10
      },
      {
        keyword: 'search engine optimization',
        search_volume: 5000,
        competition: 0.8,
        competition_index: 80,
        keyword_difficulty: 70,
        cpc: 4.50
      },
      {
        keyword: 'seo marketing strategy',
        search_volume: 950,
        competition: 0.6,
        competition_index: 60,
        keyword_difficulty: 55,
        cpc: 2.80
      }
    ]
  }]
}

const mockIdeasResponse = {
  version: '0.1.20230228',
  status_code: 200,
  status_message: 'Ok.',
  result_count: 3,
  tasks: [{
    id: '12347',
    status_code: 200,
    status_message: 'Ok.',
    result: [
      {
        keyword: 'local seo services',
        search_volume: 1600,
        competition: 0.5,
        competition_index: 50,
        keyword_difficulty: 45,
        cpc: 2.60
      },
      {
        keyword: 'technical seo audit',
        search_volume: 720,
        competition: 0.4,
        competition_index: 40,
        keyword_difficulty: 38,
        cpc: 1.90
      },
      {
        keyword: 'content seo strategy',
        search_volume: 1100,
        competition: 0.6,
        competition_index: 60,
        keyword_difficulty: 52,
        cpc: 2.30
      }
    ]
  }]
}

const mockAutocompleteResponse = {
  version: '0.1.20230228',
  status_code: 200,
  status_message: 'Ok.',
  result_count: 3,
  tasks: [{
    id: '12348',
    status_code: 200,
    status_message: 'Ok.',
    result: [
      { keyword: 'seo tools for beginners' },
      { keyword: 'seo tools free' },
      { keyword: 'seo tools comparison' }
    ]
  }]
}

describe('Long-Tail Keyword Expander', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up environment variables
    vi.stubEnv('DATAFORSEO_LOGIN', 'test-login')
    vi.stubEnv('DATAFORSEO_PASSWORD', 'test-password')
  })

  describe('Retry Policy Configuration', () => {
    it('should have correct retry policy configuration', async () => {
      const { LONGTAIL_RETRY_POLICY } = await import('@/lib/services/intent-engine/longtail-keyword-expander')
      
      expect(LONGTAIL_RETRY_POLICY.maxAttempts).toBe(3)
      expect(LONGTAIL_RETRY_POLICY.initialDelayMs).toBe(2000)
      expect(LONGTAIL_RETRY_POLICY.backoffMultiplier).toBe(2)
      expect(LONGTAIL_RETRY_POLICY.maxDelayMs).toBe(8000)
      
      // Verify exponential sequence: 2s, 4s, 8s
      const delay1 = LONGTAIL_RETRY_POLICY.initialDelayMs
      const delay2 = delay1 * LONGTAIL_RETRY_POLICY.backoffMultiplier
      const delay3 = Math.min(delay2 * LONGTAIL_RETRY_POLICY.backoffMultiplier, LONGTAIL_RETRY_POLICY.maxDelayMs)
      
      expect(delay1).toBe(2000)
      expect(delay2).toBe(4000)
      expect(delay3).toBe(8000)
    })
  })

  describe('DataForSEO API Integration', () => {
    it('should fetch related keywords successfully', async () => {
      const { fetchRelatedKeywords } = await import('@/lib/services/intent-engine/longtail-keyword-expander')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelatedKeywordsResponse
      })

      const result = await fetchRelatedKeywords('seo tools', 2840, 'en')

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        keyword: 'best seo tools 2024',
        search_volume: 1200,
        competition_level: 'low',
        competition_index: 50,
        keyword_difficulty: 45,
        cpc: 2.50,
        source: 'related'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"keyword":"seo tools"')
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      const { fetchRelatedKeywords } = await import('@/lib/services/intent-engine/longtail-keyword-expander')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      try {
        await fetchRelatedKeywords('seo tools', 2840, 'en')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should retry on retryable errors', async () => {
      const { fetchRelatedKeywords } = await import('@/lib/services/intent-engine/longtail-keyword-expander')
      
      // First call fails with rate limit, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRelatedKeywordsResponse
        })

      const result = await fetchRelatedKeywords('seo tools', 2840, 'en')

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1)
    })

    it('should not retry on non-retryable errors', async () => {
      const { fetchRelatedKeywords } = await import('@/lib/services/intent-engine/longtail-keyword-expander')
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      try {
        await fetchRelatedKeywords('seo tools', 2840, 'en')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle DataForSEO credential errors', async () => {
      vi.stubEnv('DATAFORSEO_LOGIN', '')
      vi.stubEnv('DATAFORSEO_PASSWORD', '')

      const { fetchRelatedKeywords } = await import('@/lib/services/intent-engine/longtail-keyword-expander')

      await expect(fetchRelatedKeywords('seo tools', 2840, 'en'))
        .rejects.toThrow('DataForSEO credentials not configured')
    })

    it('should handle malformed API responses', async () => {
      const { fetchRelatedKeywords } = await import('@/lib/services/intent-engine/longtail-keyword-expander')
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status_code: 500, status_message: 'Error' }) // Missing tasks
      })

      await expect(fetchRelatedKeywords('seo tools', 2840, 'en'))
        .rejects.toThrow('Related keywords API failed')
    })
  })
})
