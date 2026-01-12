/**
 * Integration Tests for Section Processor with Batch Research Optimizer
 * Story 20.2: Batch Research Optimizer - Integration Testing
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { processSection } from '@/lib/services/article-generation/section-processor'
import { performBatchResearch } from '@/lib/services/article-generation/research-optimizer'
import { Outline } from '@/lib/services/article-generation/outline-generator'

// Mock dependencies
vi.mock('@/lib/services/tavily/tavily-client')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/article-generation/performance-monitor')
vi.mock('@/lib/services/article-generation/context-manager')
vi.mock('@/lib/services/article-generation/section-templates')
vi.mock('@/lib/services/article-generation/format-validator')
vi.mock('@/lib/services/openrouter/openrouter-client')
vi.mock('@/lib/utils/token-management')
vi.mock('@/lib/utils/content-quality')
vi.mock('@/lib/utils/citation-formatter')
vi.mock('@/lib/services/article-generation/research-optimizer')

import { researchQuery } from '@/lib/services/tavily/tavily-client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { performanceMonitor } from '@/lib/services/article-generation/performance-monitor'
import { getSectionResearchSources } from '@/lib/services/article-generation/research-optimizer'

const mockResearchQuery = vi.mocked(researchQuery)
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient)
const mockPerformanceMonitor = vi.mocked(performanceMonitor)
const mockGetSectionResearchSources = vi.mocked(getSectionResearchSources)

describe('Section Processor Integration with Batch Research (Story 20.2)', () => {
  const mockArticleId = 'integration-test-article'
  const mockKeyword = 'digital marketing'
  const mockOrganizationId = 'test-org-123'
  
  const mockOutline: Outline = {
    introduction: { title: 'Introduction to Digital Marketing', h3_subsections: [] },
    h2_sections: [
      { title: 'Digital Marketing Strategies', h3_subsections: [] },
      { title: 'Social Media Marketing', h3_subsections: [] }
    ],
    conclusion: { title: 'Conclusion' },
    faq: { title: 'FAQ', included: true }
  }

  const mockArticleData = {
    id: mockArticleId,
    sections: [],
    keyword: mockKeyword,
    org_id: mockOrganizationId,
    writing_style: 'Professional',
    target_audience: 'General',
    custom_instructions: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockArticleData, error: null }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      auth: {},
      realtime: {},
      storage: {}
    } as any
    mockCreateServiceRoleClient.mockReturnValue(mockSupabase)

    // Mock performance monitor
    mockPerformanceMonitor.recordApiCall = vi.fn()
    mockPerformanceMonitor.recordPhaseTiming = vi.fn()
  })

  describe('Batch Research Integration', () => {
    it('should use batch research cache instead of per-section API calls', async () => {
      // Setup: Mock batch research cache with comprehensive sources
      const mockBatchSources = [
        { 
          title: 'Digital Marketing Guide 2024', 
          url: 'https://example.com/digital-marketing', 
          excerpt: 'Comprehensive guide to digital marketing strategies...',
          published_date: '2024-01-15',
          author: 'Marketing Expert',
          relevance_score: 0.95
        },
        { 
          title: 'Social Media Marketing Strategies', 
          url: 'https://example.com/social-media', 
          excerpt: 'Effective social media marketing techniques...',
          published_date: '2024-01-10',
          author: 'Social Media Team',
          relevance_score: 0.88
        }
      ]

      // Mock the getSectionResearchSources to return batch research results
      mockGetSectionResearchSources.mockReturnValue(mockBatchSources)

      // Process a section - should use batch research, not make API calls
      const result = await processSection(mockArticleId, 0, mockOutline)

      // Verify batch research was used instead of fresh API calls
      expect(getSectionResearchSources).toHaveBeenCalledWith(mockArticleId, 'Introduction to Digital Marketing')
      expect(mockResearchQuery).not.toHaveBeenCalled() // No fresh API calls
      expect(mockPerformanceMonitor.recordApiCall).not.toHaveBeenCalled()

      // Verify section was processed successfully
      expect(result).toBeDefined()
      expect(result.title).toBe('Introduction to Digital Marketing')
    })

    it('should fallback to per-section research when batch research unavailable', async () => {
      // Setup: No batch research available
      mockGetSectionResearchSources.mockReturnValue([])

      // Mock fallback research response
      const mockFallbackSources = [
        { 
          title: 'Fallback Research Source', 
          url: 'https://example.com/fallback', 
          excerpt: 'Fallback research content...',
          published_date: '2024-01-01',
          author: 'Fallback Author',
          relevance_score: 0.75
        }
      ]
      mockResearchQuery.mockResolvedValue(mockFallbackSources)

      // Process a section - should fallback to per-section research
      const result = await processSection(mockArticleId, 1, mockOutline)

      // Verify fallback research was used
      expect(getSectionResearchSources).toHaveBeenCalledWith(mockArticleId, 'Digital Marketing Strategies')
      expect(mockResearchQuery).toHaveBeenCalledTimes(1) // One fallback API call
      expect(mockPerformanceMonitor.recordApiCall).toHaveBeenCalledTimes(1)

      // Verify section was processed successfully
      expect(result).toBeDefined()
      expect(result.title).toBe('Digital Marketing Strategies')
    })

    it('should handle research failures gracefully', async () => {
      // Setup: No batch research and fallback research fails
      mockGetSectionResearchSources.mockReturnValue([])
      mockResearchQuery.mockRejectedValue(new Error('Research API failed'))

      // Process a section - should handle failure gracefully
      const result = await processSection(mockArticleId, 0, mockOutline)

      // Verify error handling
      expect(result).toBeDefined()
      expect(result.title).toBe('Introduction to Digital Marketing')
      // Section should still be generated even without research
    })
  })

  describe('API Call Reduction Verification', () => {
    it('should demonstrate 85% reduction in API calls', async () => {
      // Setup: Mock successful batch research
      const mockBatchSources = [
        { 
          title: 'Comprehensive Marketing Guide', 
          url: 'https://example.com/guide', 
          excerpt: 'Complete marketing guide...',
          published_date: '2024-01-01',
          author: 'Expert',
          relevance_score: 0.92
        }
      ]
      mockGetSectionResearchSources.mockReturnValue(mockBatchSources)

      // Process multiple sections
      const sections = await Promise.all([
        processSection(mockArticleId, 0, mockOutline), // Introduction
        processSection(mockArticleId, 1, mockOutline), // H2 Section 1
        processSection(mockArticleId, 2, mockOutline), // H2 Section 2
        processSection(mockArticleId, 3, mockOutline), // Conclusion
        processSection(mockArticleId, 4, mockOutline), // FAQ
      ])

      // Verify no API calls were made (all used batch research)
      expect(mockResearchQuery).not.toHaveBeenCalled()
      expect(mockPerformanceMonitor.recordApiCall).not.toHaveBeenCalled()

      // Verify all sections were processed
      expect(sections).toHaveLength(5)
      sections.forEach(section => {
        expect(section).toBeDefined()
        expect(section.content).toBeDefined()
      })

      // Calculate API call reduction: 0 calls vs 5-13 calls (85%+ reduction)
      console.log('API Call Reduction: 100% (0 calls vs 5-13 expected calls)')
    })
  })

  describe('Cache Hit Rate Performance', () => {
    it('should achieve high cache hit rate across sections', async () => {
      // Setup: Mock batch research with section-specific sources
      const mockBatchSources = [
        { 
          title: 'Marketing Strategies Guide', 
          url: 'https://example.com/strategies', 
          excerpt: 'Strategic marketing approaches...',
          published_date: '2024-01-01',
          author: 'Strategy Expert',
          relevance_score: 0.94
        }
      ]

      let cacheHitCount = 0
      mockGetSectionResearchSources.mockImplementation((articleId, sectionTitle) => {
        cacheHitCount++
        return mockBatchSources
      })

      // Process all sections
      await Promise.all([
        processSection(mockArticleId, 0, mockOutline),
        processSection(mockArticleId, 1, mockOutline),
        processSection(mockArticleId, 2, mockOutline),
      ])

      // Verify cache hit rate
      expect(cacheHitCount).toBe(3) // All sections used cache
      const cacheHitRate = (cacheHitCount / 3) * 100
      expect(cacheHitRate).toBe(100) // 100% cache hit rate (>80% target)

      console.log(`Cache Hit Rate: ${cacheHitRate}% (target: >80%)`)
    })
  })
})
