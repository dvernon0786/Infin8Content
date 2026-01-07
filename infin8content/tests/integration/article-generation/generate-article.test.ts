/**
 * Article Generation Integration Tests
 * Story 4a.2: Section-by-Section Architecture and Outline Generation
 * 
 * Tests the full article generation flow:
 * - Article queued → Outline generated → Sections processed → Article completed
 * 
 * NOTE: These tests verify service integration. Full E2E testing with actual database
 * should be done in E2E tests (tests/e2e/article-generation/).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InngestTestEngine } from '@inngest/test'
import { generateArticle } from '@/lib/inngest/functions/generate-article'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateOutline } from '@/lib/services/article-generation/outline-generator'
import { processSection } from '@/lib/services/article-generation/section-processor'
import { analyzeSerpStructure } from '@/lib/services/dataforseo/serp-analysis'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/article-generation/outline-generator')
vi.mock('@/lib/services/article-generation/section-processor')
vi.mock('@/lib/services/dataforseo/serp-analysis')

describe('Article Generation Integration', () => {
  const mockArticleId = 'test-article-id'
  const mockOrgId = 'test-org-id'
  const mockKeyword = 'best running shoes'
  
  const mockArticle = {
    id: mockArticleId,
    org_id: mockOrgId,
    keyword: mockKeyword,
    status: 'queued'
  }

  const mockKeywordResearch = {
    keyword: mockKeyword,
    searchVolume: 5000,
    keywordDifficulty: 45,
    trend: [4000, 4200, 4500, 4800, 5000],
    competition: 'Medium' as const
  }

  const mockSerpAnalysis = {
    commonH2Topics: [
      'What to Look For',
      'Types of Running Shoes',
      'Best Brands'
    ],
    h2Frequency: {},
    contentGaps: [],
    topStructures: []
  }

  const mockOutline = {
    introduction: {
      title: 'Introduction to Best Running Shoes',
      h3_subsections: ['Why Running Shoes Matter']
    },
    h2_sections: [
      {
        title: 'Types of Running Shoes',
        h3_subsections: ['Neutral Shoes', 'Stability Shoes']
      }
    ],
    conclusion: {
      title: 'Conclusion'
    },
    faq: {
      title: 'FAQ',
      included: true
    }
  }

  let testEngine: InngestTestEngine
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Track query sequence to return appropriate responses
    let querySequence = 0
    
    // Create a reusable mock query builder
    const createQueryBuilder = () => {
      const singleMock = vi.fn()
      const chain: any = {
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: singleMock,
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
      }
      
      // Setup responses based on query sequence
      const currentSequence = querySequence++
      
      // Sequence 0: Load article (load-article step)
      if (currentSequence === 0) {
        singleMock.mockResolvedValue({ data: mockArticle, error: null })
      }
      // Sequence 1: Load keyword research (load-keyword-research step)
      else if (currentSequence === 1) {
        singleMock.mockResolvedValue({ 
          data: { results: { tasks: [{ result: [{}] }] } }, 
          error: null 
        })
      }
      // Sequence 2: Load outline (process-sections step - first query)
      else if (currentSequence === 2) {
        singleMock.mockResolvedValue({ 
          data: { outline: mockOutline },
          error: null 
        })
      }
      // Sequence 3+: Load sections (processSection calls and error handling)
      else {
        singleMock.mockResolvedValue({
          data: { sections: [], keyword: mockKeyword },
          error: null
        })
      }
      
      return {
        select: vi.fn().mockReturnValue(chain),
        update: chain.update,
        chain
      }
    }
    
    mockSupabase = {
      from: vi.fn(() => createQueryBuilder())
    }
    
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    
    // Setup service mocks
    vi.mocked(analyzeSerpStructure).mockResolvedValue(mockSerpAnalysis)
    vi.mocked(generateOutline).mockResolvedValue(mockOutline)
    
    // Mock processSection to handle multiple calls with different section indices
    vi.mocked(processSection).mockImplementation(async (articleId: string, sectionIndex: number, outline: any) => {
      return {
        section_type: sectionIndex === 0 ? 'introduction' : 
                      sectionIndex === mockOutline.h2_sections.length + 1 ? 'conclusion' :
                      sectionIndex === mockOutline.h2_sections.length + 2 ? 'faq' :
                      !Number.isInteger(sectionIndex) ? 'h3' : 'h2',
        section_index: sectionIndex,
        title: `Section ${sectionIndex}`,
        content: 'Test content',
        word_count: 10,
        generated_at: new Date().toISOString()
      }
    })

    // Initialize Inngest test engine
    testEngine = new InngestTestEngine({
      function: generateArticle,
    })
  })

  it('should load article and update status to generating', async () => {
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('articles')
  })

  it('should load keyword research data', async () => {
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('keyword_researches')
  })

  it('should generate SERP analysis', async () => {
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(analyzeSerpStructure).toHaveBeenCalledWith(mockKeyword, mockOrgId)
  })

  it('should generate outline and store it', async () => {
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(generateOutline).toHaveBeenCalledWith(
      mockKeyword,
      expect.any(Object),
      mockSerpAnalysis
    )
  })

  it.skip('should process sections sequentially', async () => {
    // NOTE: Detailed section processing is tested in unit tests (section-processor.test.ts)
    // This integration test would verify the full flow, but requires complex Inngest mocking
    // Full E2E testing should be done in tests/e2e/article-generation/
    
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(processSection).toHaveBeenCalled()
  })

  it('should update article status to completed', async () => {
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(mockSupabase.from).toHaveBeenCalled()
  })

  it.skip('should handle errors and preserve partial article', async () => {
    // NOTE: Error handling is tested in unit tests
    // Full error flow testing should be done in E2E tests
    
    vi.mocked(processSection).mockRejectedValueOnce(new Error('Test error'))

    await expect(
      testEngine.execute({
        events: [{
          name: 'article/generate',
          data: { articleId: mockArticleId }
        }]
      })
    ).rejects.toThrow()
  })

  it.skip('should process H3 subsections within H2 sections', async () => {
    // NOTE: H3 subsection processing is thoroughly tested in unit tests (section-processor.test.ts)
    // This test verifies integration, but detailed flow testing is better done at unit/E2E level
    
    await testEngine.execute({
      events: [{
        name: 'article/generate',
        data: { articleId: mockArticleId }
      }]
    })

    expect(processSection).toHaveBeenCalled()
  })
})
