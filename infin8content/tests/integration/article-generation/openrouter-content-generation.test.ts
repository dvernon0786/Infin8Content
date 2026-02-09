/**
 * OpenRouter Content Generation Integration Tests
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 * 
 * Tests the full content generation flow:
 * - Section processing → OpenRouter API → Content generation → Quality validation → Citation integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processSection } from '@/lib/services/article-generation/section-processor'
import { generateContent } from '@/lib/services/openrouter/openrouter-client'
import { validateContentQuality } from '@/lib/utils/content-quality'
import { formatCitationsForMarkdown } from '@/lib/utils/citation-formatter'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Outline } from '@/lib/services/article-generation/outline-generator'
import type { TavilySource } from '@/lib/services/tavily/tavily-client'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/openrouter/openrouter-client')
vi.mock('@/lib/utils/content-quality')
vi.mock('@/lib/utils/citation-formatter')
vi.mock('@/lib/services/tavily/tavily-client', () => ({
  researchQuery: vi.fn()
}))

describe('OpenRouter Content Generation Integration', () => {
  const mockArticleId = 'test-article-id'
  const mockOrgId = 'test-org-id'
  const mockKeyword = 'best running shoes'
  
  const mockOutline: Outline = {
    introduction: { title: 'Introduction to Running Shoes', h3_subsections: [] },
    h2_sections: [
      {
        title: 'Types of Running Shoes',
        h3_subsections: ['Trail Running Shoes', 'Road Running Shoes']
      }
    ],
    conclusion: { title: 'Conclusion' },
    faq: { title: 'Frequently Asked Questions', included: false }
  }

  const mockResearchSources: TavilySource[] = [
    {
      title: 'Best Running Shoes 2024',
      url: 'https://example.com/running-shoes',
      excerpt: 'Comprehensive guide to running shoes',
      published_date: '2024-01-15',
      author: 'John Doe',
      relevance_score: 0.95
    },
    {
      title: 'Running Shoe Guide',
      url: 'https://example.com/guide',
      excerpt: 'Everything you need to know about running shoes',
      published_date: '2024-02-01',
      author: 'Jane Smith',
      relevance_score: 0.88
    }
  ]

  const mockGeneratedContent = `## Types of Running Shoes

Running shoes come in various types designed for different running surfaces and styles. Each type offers unique features to enhance your running experience.

Trail running shoes provide superior grip and protection for off-road adventures, while road running shoes prioritize cushioning and responsiveness for pavement running.`

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: mockArticleId,
          org_id: mockOrgId,
          keyword: mockKeyword,
          sections: []
        },
        error: null
      })
    }
    
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Full Content Generation Flow', () => {
    it('should generate content with OpenRouter, validate quality, and integrate citations', async () => {
      // Mock OpenRouter API response
      vi.mocked(generateContent).mockResolvedValue({
        content: mockGeneratedContent,
        tokensUsed: 150,
        modelUsed: 'tns-standard/tns-standard-8-7.5-chimera',
        promptTokens: 100,
        completionTokens: 50
      })

      // Mock quality validation (passes)
      vi.mocked(validateContentQuality).mockReturnValue({
        passed: true,
        metrics: {
          word_count: 75,
          citations_included: 2,
          readability_score: 65,
          keyword_density: 0.02,
          quality_passed: true,
          quality_retry_count: 0
        },
        errors: []
      })

      // Mock citation formatter
      const contentWithCitations = mockGeneratedContent + '\n\nAccording to [Best Running Shoes 2024](https://example.com/running-shoes), '
      vi.mocked(formatCitationsForMarkdown).mockReturnValue(contentWithCitations)

      // Mock Tavily research
      const { researchQuery } = await import('@/lib/services/tavily/tavily-client')
      vi.mocked(researchQuery).mockResolvedValue(mockResearchSources)

      // Execute section processing
      const section = await processSection(mockArticleId, 1, mockOutline)

      // Verify OpenRouter was called
      expect(generateContent).toHaveBeenCalled()
      
      // Verify quality validation was called on content WITH citations
      expect(validateContentQuality).toHaveBeenCalledWith(
        expect.stringContaining('According to'),
        expect.any(Number),
        mockKeyword,
        'h2',
        0
      )

      // Verify citations were integrated
      expect(formatCitationsForMarkdown).toHaveBeenCalledWith(
        mockGeneratedContent,
        expect.any(Array),
        1,
        3
      )

      // Verify section was created with quality metrics
      expect(section).toBeDefined()
      expect(section.content).toBe(contentWithCitations)
      expect(section.quality_metrics).toBeDefined()
      expect(section.quality_metrics?.quality_passed).toBe(true)
      expect(section.citations_included).toBeGreaterThan(0)
    })

    it('should retry generation if quality validation fails', async () => {
      // Mock OpenRouter API response (first attempt)
      vi.mocked(generateContent)
        .mockResolvedValueOnce({
          content: 'Short content', // Too short, will fail quality
          tokensUsed: 50,
          modelUsed: 'tns-standard/tns-standard-8-7.5-chimera',
          promptTokens: 30,
          completionTokens: 20
        })
        .mockResolvedValueOnce({
          content: mockGeneratedContent, // Second attempt passes
          tokensUsed: 150,
          modelUsed: 'tns-standard/tns-standard-8-7.5-chimera',
          promptTokens: 100,
          completionTokens: 50
        })

      // Mock quality validation (fails first time, passes second)
      vi.mocked(validateContentQuality)
        .mockReturnValueOnce({
          passed: false,
          metrics: {
            word_count: 10,
            citations_included: 0,
            readability_score: 50,
            keyword_density: 0.01,
            quality_passed: false,
            quality_retry_count: 0
          },
          errors: ['Word count 10 is outside 10% tolerance of target 600']
        })
        .mockReturnValueOnce({
          passed: true,
          metrics: {
            word_count: 75,
            citations_included: 2,
            readability_score: 65,
            keyword_density: 0.02,
            quality_passed: true,
            quality_retry_count: 1
          },
          errors: []
        })

      // Mock citation formatter
      const contentWithCitations = mockGeneratedContent + '\n\nAccording to [Best Running Shoes 2024](https://example.com/running-shoes), '
      vi.mocked(formatCitationsForMarkdown).mockReturnValue(contentWithCitations)

      // Mock Tavily research
      const { researchQuery } = await import('@/lib/services/tavily/tavily-client')
      vi.mocked(researchQuery).mockResolvedValue(mockResearchSources)

      // Execute section processing
      const section = await processSection(mockArticleId, 1, mockOutline)

      // Verify OpenRouter was called twice (retry)
      expect(generateContent).toHaveBeenCalledTimes(2)
      
      // Verify quality validation was called twice
      expect(validateContentQuality).toHaveBeenCalledTimes(2)
      
      // Verify final section has quality metrics from retry
      expect(section.quality_metrics?.quality_retry_count).toBe(1)
      expect(section.quality_metrics?.quality_passed).toBe(true)
    })

    it('should track API costs per section', async () => {
      // Mock OpenRouter API response
      vi.mocked(generateContent).mockResolvedValue({
        content: mockGeneratedContent,
        tokensUsed: 150,
        modelUsed: 'tns-standard/tns-standard-8-7.5-chimera',
        promptTokens: 100,
        completionTokens: 50
      })

      // Mock quality validation
      vi.mocked(validateContentQuality).mockReturnValue({
        passed: true,
        metrics: {
          word_count: 75,
          citations_included: 2,
          readability_score: 65,
          keyword_density: 0.02,
          quality_passed: true,
          quality_retry_count: 0
        },
        errors: []
      })

      // Mock citation formatter
      vi.mocked(formatCitationsForMarkdown).mockReturnValue(mockGeneratedContent)

      // Mock Tavily research
      const { researchQuery } = await import('@/lib/services/tavily/tavily-client')
      vi.mocked(researchQuery).mockResolvedValue(mockResearchSources)

      // Execute section processing
      await processSection(mockArticleId, 1, mockOutline)

      // Verify API cost was tracked (check that insert was called)
      const mockSupabase = vi.mocked(createServiceRoleClient)()
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should handle OpenRouter API errors gracefully', async () => {
      // Mock OpenRouter API error
      vi.mocked(generateContent).mockRejectedValue(
        new Error('OpenRouter API error: 500 Internal Server Error')
      )

      // Mock Tavily research
      const { researchQuery } = await import('@/lib/services/tavily/tavily-client')
      vi.mocked(researchQuery).mockResolvedValue(mockResearchSources)

      // Execute section processing (should throw)
      await expect(
        processSection(mockArticleId, 1, mockOutline)
      ).rejects.toThrow('Content generation failed')

      // Verify error details were updated
      const mockSupabase = vi.mocked(createServiceRoleClient)()
      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })

  describe('Citation Integration', () => {
    it('should integrate citations naturally into content', async () => {
      // Mock OpenRouter API response
      vi.mocked(generateContent).mockResolvedValue({
        content: mockGeneratedContent,
        tokensUsed: 150,
        modelUsed: 'tns-standard/tns-standard-8-7.5-chimera',
        promptTokens: 100,
        completionTokens: 50
      })

      // Mock quality validation
      vi.mocked(validateContentQuality).mockReturnValue({
        passed: true,
        metrics: {
          word_count: 75,
          citations_included: 2,
          readability_score: 65,
          keyword_density: 0.02,
          quality_passed: true,
          quality_retry_count: 0
        },
        errors: []
      })

      // Mock citation formatter to insert citations naturally
      const contentWithCitations = mockGeneratedContent.replace(
        'Running shoes come in',
        'According to [Best Running Shoes 2024](https://example.com/running-shoes), running shoes come in'
      )
      vi.mocked(formatCitationsForMarkdown).mockReturnValue(contentWithCitations)

      // Mock Tavily research
      const { researchQuery } = await import('@/lib/services/tavily/tavily-client')
      vi.mocked(researchQuery).mockResolvedValue(mockResearchSources)

      // Execute section processing
      const section = await processSection(mockArticleId, 1, mockOutline)

      // Verify citations were integrated
      expect(formatCitationsForMarkdown).toHaveBeenCalledWith(
        mockGeneratedContent,
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Best Running Shoes 2024',
            url: 'https://example.com/running-shoes'
          })
        ]),
        1,
        3
      )

      // Verify section includes citations
      expect(section.citations_included).toBeGreaterThan(0)
      expect(section.content).toContain('According to')
    })
  })

  describe('Quality Validation', () => {
    it('should validate content quality after citation integration', async () => {
      // Mock OpenRouter API response
      vi.mocked(generateContent).mockResolvedValue({
        content: mockGeneratedContent,
        tokensUsed: 150,
        modelUsed: 'tns-standard/tns-standard-8-7.5-chimera',
        promptTokens: 100,
        completionTokens: 50
      })

      // Mock citation formatter
      const contentWithCitations = mockGeneratedContent + '\n\nAccording to [Best Running Shoes 2024](https://example.com/running-shoes), '
      vi.mocked(formatCitationsForMarkdown).mockReturnValue(contentWithCitations)

      // Mock quality validation
      vi.mocked(validateContentQuality).mockReturnValue({
        passed: true,
        metrics: {
          word_count: 80, // Includes citations
          citations_included: 2,
          readability_score: 65,
          keyword_density: 0.02,
          quality_passed: true,
          quality_retry_count: 0
        },
        errors: []
      })

      // Mock Tavily research
      const { researchQuery } = await import('@/lib/services/tavily/tavily-client')
      vi.mocked(researchQuery).mockResolvedValue(mockResearchSources)

      // Execute section processing
      await processSection(mockArticleId, 1, mockOutline)

      // Verify quality validation was called on content WITH citations
      expect(validateContentQuality).toHaveBeenCalledWith(
        contentWithCitations, // Content with citations
        expect.any(Number),
        mockKeyword,
        'h2',
        0
      )
    })
  })
})

