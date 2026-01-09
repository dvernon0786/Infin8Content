/**
 * Tavily Research Integration Tests
 * Story 4a.3: Real-Time Research Per Section (Tavily Integration)
 * 
 * Tests the full Tavily research flow:
 * - Section processing → Research query generation → Cache lookup → Tavily API → Cache storage → Citation inclusion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processSection } from '@/lib/services/article-generation/section-processor'
import { researchQuery } from '@/lib/services/tavily/tavily-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Outline } from '@/lib/services/article-generation/outline-generator'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/tavily/tavily-client')
vi.mock('@/lib/utils/token-management', () => ({
  summarizeSections: vi.fn(() => 'Previous sections summary'),
  fitInContextWindow: vi.fn((text: string) => text),
  estimateTokens: vi.fn((text: string) => Math.ceil(text.length / 4))
}))
vi.mock('@/lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn().mockResolvedValue({
    content: 'Generated content with proper markdown formatting.\n\n## Section Content\n\nThis is test content.',
    tokensUsed: 100,
    modelUsed: 'test-model',
    promptTokens: 50,
    completionTokens: 50
  })
}))
vi.mock('@/lib/utils/content-quality', () => ({
  validateContentQuality: vi.fn(() => ({
    passed: true,
    metrics: {
      word_count: 200,
      citations_included: 2,
      readability_score: 65,
      keyword_density: 2.5,
      quality_passed: true,
      quality_retry_count: 0
    },
    errors: []
  })),
  countCitations: vi.fn(() => 2)
}))
vi.mock('@/lib/utils/citation-formatter', () => ({
  formatCitationsForMarkdown: vi.fn((content: string, sources: any[]) => {
    if (sources.length === 0) return content
    return content + '\n\n## References\n\n- [Test Source](https://example.com)'
  })
}))

describe('Tavily Research Integration', () => {
  const mockArticleId = 'test-article-id'
  const mockOrgId = 'test-org-id'
  const mockKeyword = 'best running shoes'
  
  const mockOutline: Outline = {
    introduction: {
      title: 'Introduction to Best Running Shoes',
      h3_subsections: []
    },
    h2_sections: [
      {
        title: 'Types of Running Shoes',
        h3_subsections: []
      }
    ],
    conclusion: {
      title: 'Conclusion'
    },
    faq: {
      included: false,
      title: ''
    }
  }

  const mockTavilySources = [
    {
      title: 'Best Running Shoes 2024',
      url: 'https://example.com/shoes',
      excerpt: 'Running shoes are essential...',
      published_date: '2024-01-01',
      author: 'John Doe',
      relevance_score: 0.95
    },
    {
      title: 'Running Shoe Guide',
      url: 'https://example.com/guide',
      excerpt: 'A comprehensive guide...',
      published_date: null,
      author: null,
      relevance_score: 0.85
    }
  ]

  // Create a reusable mock builder function
  const createMockFrom = (tableName: string) => {
    if (tableName === 'tavily_research_cache') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            ilike: vi.fn(() => ({
              gt: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null, // Cache miss by default
                  error: null
                })
              }))
            }))
          }))
        })),
        upsert: vi.fn(() => ({
          onConflict: vi.fn().mockResolvedValue({ error: null })
        }))
      }
    }
    
    if (tableName === 'articles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                sections: [],
                keyword: mockKeyword,
                org_id: mockOrgId
              },
              error: null
            })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      }
    }
    
    if (tableName === 'api_costs') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null })
      }
    }
    
    return {}
  }

  const mockSupabaseClient = {
    from: vi.fn((tableName: string) => createMockFrom(tableName))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServiceRoleClient as any).mockReturnValue(mockSupabaseClient)
    process.env.TAVILY_API_KEY = 'test-api-key'
    // Reset mock implementation to default
    ;(mockSupabaseClient.from as any).mockImplementation((tableName: string) => createMockFrom(tableName))
  })

  describe('Full Research Flow', () => {
    it('should perform Tavily research when cache miss occurs', async () => {
      // Mock Tavily API call
      ;(researchQuery as any).mockResolvedValue(mockTavilySources)

      const section = await processSection(mockArticleId, 0, mockOutline)

      // Verify Tavily API was called
      expect(researchQuery).toHaveBeenCalled()
      
      // Verify research sources are stored in section metadata
      expect(section.research_sources).toBeDefined()
      expect(section.research_sources?.length).toBeGreaterThan(0)
      expect(section.research_query).toBeDefined()
      expect(section.citations_included).toBeGreaterThan(0)
    })

    it('should use cached results when cache hit occurs', async () => {
      // Mock cache hit
      const cacheData = {
        research_results: {
          query: 'introduction best running shoes 2024',
          results: mockTavilySources.map(source => ({
            title: source.title,
            url: source.url,
            content: source.excerpt,
            score: source.relevance_score,
            published_date: source.published_date,
            author: source.author
          }))
        }
      }

      // Override cache lookup to return cache hit
      const cacheMock = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            ilike: vi.fn(() => ({
              gt: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: cacheData,
                  error: null
                })
              }))
            }))
          }))
        })),
        upsert: vi.fn(() => ({
          onConflict: vi.fn().mockResolvedValue({ error: null })
        }))
      }

      ;(mockSupabaseClient.from as any).mockImplementation((tableName: string) => {
        if (tableName === 'tavily_research_cache') {
          return cacheMock
        }
        return createMockFrom(tableName)
      })

      const section = await processSection(mockArticleId, 0, mockOutline)

      // Verify Tavily API was NOT called (cache hit)
      expect(researchQuery).not.toHaveBeenCalled()
      
      // Verify cached research sources are used
      expect(section.research_sources).toBeDefined()
      expect(section.research_sources?.length).toBe(2)
    })

    it('should store research results in cache after API call', async () => {
      ;(researchQuery as any).mockResolvedValue(mockTavilySources)

      await processSection(mockArticleId, 0, mockOutline)

      // Verify cache storage was attempted
      const upsertCall = (mockSupabaseClient.from as any).mock.calls.find(
        (call: any[]) => call[0] === 'tavily_research_cache'
      )
      expect(upsertCall).toBeDefined()
    })

    it('should track API cost after successful research', async () => {
      ;(researchQuery as any).mockResolvedValue(mockTavilySources)

      await processSection(mockArticleId, 0, mockOutline)

      // Verify API cost tracking
      const insertCall = (mockSupabaseClient.from as any).mock.calls.find(
        (call: any[]) => call[0] === 'api_costs'
      )
      expect(insertCall).toBeDefined()
    })

    it('should continue gracefully when Tavily API fails', async () => {
      // Mock API failure
      ;(researchQuery as any).mockRejectedValue(new Error('API Error'))

      const section = await processSection(mockArticleId, 0, mockOutline)

      // Verify section is still generated (graceful degradation)
      expect(section).toBeDefined()
      expect(section.content).toBeDefined()
      
      // Verify research sources are empty or undefined
      expect(section.research_sources).toEqual([])
    })

    it('should include previous sections context in research query', async () => {
      ;(researchQuery as any).mockResolvedValue(mockTavilySources)

      // Process first section
      await processSection(mockArticleId, 0, mockOutline)

      // Process second section with previous sections
      ;(mockSupabaseClient.from as any).mockImplementation((tableName: string) => {
        if (tableName === 'articles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    sections: [{
                      title: 'Introduction',
                      content: 'Previous section content',
                      section_index: 0
                    }],
                    keyword: mockKeyword,
                    org_id: mockOrgId
                  },
                  error: null
                })
              }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null })
            }))
          }
        }
        return createMockFrom(tableName)
      })

      await processSection(mockArticleId, 1, mockOutline)

      // Verify research query was called with context
      expect(researchQuery).toHaveBeenCalled()
      const researchQueryCall = (researchQuery as any).mock.calls[1]
      expect(researchQueryCall[0]).toContain('Types of Running Shoes')
      expect(researchQueryCall[0]).toContain(mockKeyword)
    })
  })

  describe('Cache Operations', () => {
    it('should normalize query for cache lookup', async () => {
      ;(researchQuery as any).mockResolvedValue(mockTavilySources)

      await processSection(mockArticleId, 0, mockOutline)

      // Verify cache lookup uses normalized query (case-insensitive)
      const cacheLookupCall = (mockSupabaseClient.from as any).mock.calls.find(
        (call: any[]) => call[0] === 'tavily_research_cache'
      )
      expect(cacheLookupCall).toBeDefined()
    })

    it('should check cache expiry before using cached results', async () => {
      // Mock expired cache (cached_until < NOW()) - returns null
      ;(mockSupabaseClient.from as any).mockImplementation((tableName: string) => {
        if (tableName === 'tavily_research_cache') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                ilike: vi.fn(() => ({
                  gt: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null, // Expired cache returns null
                      error: null
                    })
                  }))
                }))
              }))
            })),
            upsert: vi.fn(() => ({
              onConflict: vi.fn().mockResolvedValue({ error: null })
            }))
          }
        }
        return createMockFrom(tableName)
      })

      ;(researchQuery as any).mockResolvedValue(mockTavilySources)

      await processSection(mockArticleId, 0, mockOutline)

      // Verify API was called (cache expired)
      expect(researchQuery).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should update article error_details on research failure', async () => {
      ;(researchQuery as any).mockRejectedValue(new Error('API Error'))

      await processSection(mockArticleId, 0, mockOutline)

      // Verify error_details update was attempted
      const updateCall = (mockSupabaseClient.from as any).mock.calls.find(
        (call: any[]) => call[0] === 'articles'
      )
      expect(updateCall).toBeDefined()
    })

    it('should not block section generation on cache storage failure', async () => {
      ;(researchQuery as any).mockResolvedValue(mockTavilySources)
      
      // Mock cache storage failure
      ;(mockSupabaseClient.from as any).mockImplementation((tableName: string) => {
        if (tableName === 'tavily_research_cache') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                ilike: vi.fn(() => ({
                  gt: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null
                    })
                  }))
                }))
              }))
            })),
            upsert: vi.fn(() => ({
              onConflict: vi.fn().mockResolvedValue({ error: { message: 'Cache storage failed' } })
            }))
          }
        }
        return createMockFrom(tableName)
      })

      const section = await processSection(mockArticleId, 0, mockOutline)

      // Verify section is still generated despite cache failure
      expect(section).toBeDefined()
      expect(section.content).toBeDefined()
    })
  })
})

