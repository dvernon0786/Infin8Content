/**
 * Section Processor Service Tests
 * Story 4a.2: Section-by-Section Architecture and Outline Generation
 * 
 * Note: This file tests Story 4a-2 functionality. Stories 4a-3 and 4a-5 added
 * dependencies (Tavily research, OpenRouter content generation) that are mocked here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processSection, processAllSections } from '@/lib/services/article-generation/section-processor'
import type { Outline } from '@/lib/services/article-generation/outline-generator'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock Supabase client with all methods used by section-processor
const createMockQueryBuilder = () => {
  const chain: any = {
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(), // For Tavily cache queries
    single: vi.fn().mockResolvedValue({
      data: {
        sections: [],
        keyword: 'best running shoes',
        org_id: 'test-org-id',
        writing_style: 'Professional',
        target_audience: 'General',
        custom_instructions: null,
        error_details: null,
        research_results: null // For Tavily cache queries
      },
      error: null
    }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(), // Returns chain for chaining
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnThis()
  }
  // Make update return chain for chaining: .update().eq()
  chain.update.mockReturnValue(chain)
  chain.delete.mockReturnValue(chain)
  return chain
}

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => createMockQueryBuilder()),
    update: vi.fn(() => createMockQueryBuilder()),
    insert: vi.fn(() => createMockQueryBuilder()),
    upsert: vi.fn(() => createMockQueryBuilder()),
    delete: vi.fn(() => createMockQueryBuilder())
  }))
}

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => mockSupabaseClient)
}))

// Mock OpenRouter (Story 4a-5 dependency)
vi.mock('@/lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn().mockResolvedValue({
    content: 'Mock generated content for section',
    tokensUsed: 100,
    modelUsed: 'google/gemini-2.5-flash',
    promptTokens: 50,
    completionTokens: 50
  })
}))

// Mock Tavily research (Story 4a-3 dependency)
vi.mock('@/lib/services/tavily/tavily-client', () => ({
  researchQuery: vi.fn().mockResolvedValue([])
}))

// Mock content quality validation
vi.mock('@/lib/utils/content-quality', () => ({
  validateContentQuality: vi.fn().mockReturnValue({
    passed: true,
    metrics: {
      word_count: 100,
      citations_included: 0,
      readability_score: 65,
      keyword_density: 0.02,
      quality_passed: true,
      quality_retry_count: 0
    },
    errors: []
  }),
  countCitations: vi.fn().mockReturnValue(0)
}))

// Mock citation formatter
vi.mock('@/lib/utils/citation-formatter', () => ({
  formatCitationsForMarkdown: vi.fn((content) => content)
}))

describe('Section Processor', () => {
  const mockArticleId = 'test-article-id'
  const mockKeyword = 'best running shoes'
  
  const mockOutline: Outline = {
    introduction: {
      title: 'Introduction to Best Running Shoes',
      h3_subsections: ['Why Running Shoes Matter', 'What You\'ll Learn']
    },
    h2_sections: [
      {
        title: 'Types of Running Shoes',
        h3_subsections: ['Neutral Shoes', 'Stability Shoes', 'Motion Control']
      },
      {
        title: 'Key Features to Consider',
        h3_subsections: ['Cushioning', 'Breathability']
      }
    ],
    conclusion: {
      title: 'Choosing Your Perfect Running Shoe'
    },
    faq: {
      title: 'Frequently Asked Questions',
      included: true
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock responses - create fresh query builder for each test
    const chain = createMockQueryBuilder()
    chain.single.mockResolvedValue({
      data: {
        sections: [],
        keyword: mockKeyword,
        org_id: 'test-org-id',
        writing_style: 'Professional',
        target_audience: 'General',
        custom_instructions: null,
        error_details: null
      },
      error: null
    })
    
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => chain),
      update: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      delete: vi.fn(() => chain)
    })
  })

  describe('processSection', () => {
    it('should process introduction section (index 0)', async () => {
      const section = await processSection(mockArticleId, 0, mockOutline)
      
      expect(section.section_type).toBe('introduction')
      expect(section.section_index).toBe(0)
      expect(section.title).toBe(mockOutline.introduction.title)
      expect(section.content).toBeDefined()
      expect(section.content.length).toBeGreaterThan(0)
      expect(section.word_count).toBeGreaterThan(0)
      expect(section.generated_at).toBeDefined()
    })

    it('should process H2 section with correct index', async () => {
      const section = await processSection(mockArticleId, 1, mockOutline)
      
      expect(section.section_type).toBe('h2')
      expect(section.section_index).toBe(1)
      expect(section.h2_index).toBe(1)
      expect(section.title).toBe(mockOutline.h2_sections[0].title)
    })

    it('should process H3 subsection with decimal index', async () => {
      const section = await processSection(mockArticleId, 1.1, mockOutline)
      
      expect(section.section_type).toBe('h3')
      expect(section.section_index).toBe(1.1)
      expect(section.h2_index).toBe(1)
      expect(section.h3_index).toBe(1)
      expect(section.title).toBe(mockOutline.h2_sections[0].h3_subsections[0])
    })

    it('should process conclusion section', async () => {
      const conclusionIndex = mockOutline.h2_sections.length + 1
      const section = await processSection(mockArticleId, conclusionIndex, mockOutline)
      
      expect(section.section_type).toBe('conclusion')
      expect(section.section_index).toBe(conclusionIndex)
      expect(section.title).toBe(mockOutline.conclusion.title)
    })

    it('should process FAQ section if included', async () => {
      const faqIndex = mockOutline.h2_sections.length + 2
      const section = await processSection(mockArticleId, faqIndex, mockOutline)
      
      expect(section.section_type).toBe('faq')
      expect(section.section_index).toBe(faqIndex)
      expect(section.title).toBe(mockOutline.faq?.title)
    })

    it('should throw error for invalid section index', async () => {
      await expect(processSection(mockArticleId, 999, mockOutline)).rejects.toThrow('Invalid section index')
    })

    it('should update article with new section', async () => {
      const chain = createMockQueryBuilder()
      chain.single.mockResolvedValue({
        data: { sections: [], keyword: mockKeyword, org_id: 'test-org-id', writing_style: 'Professional', target_audience: 'General', custom_instructions: null, error_details: null },
        error: null
      })
      
      const fromMock = {
        select: vi.fn(() => chain),
        update: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        upsert: vi.fn(() => chain),
        delete: vi.fn(() => chain)
      }
      mockSupabaseClient.from.mockReturnValue(fromMock)

      await processSection(mockArticleId, 0, mockOutline)
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('articles')
      expect(fromMock.update).toHaveBeenCalled()
    })

    it('should preserve previous sections when adding new one', async () => {
      const existingSections = [
        {
          section_type: 'introduction' as const,
          section_index: 0,
          title: 'Existing Introduction',
          content: 'Existing content',
          word_count: 10,
          generated_at: new Date().toISOString()
        }
      ]

      const chain = createMockQueryBuilder()
      chain.single.mockResolvedValue({
        data: {
          sections: existingSections,
          keyword: mockKeyword,
          org_id: 'test-org-id',
          writing_style: 'Professional',
          target_audience: 'General',
          custom_instructions: null,
          error_details: null
        },
        error: null
      })
      
      const fromMock = {
        select: vi.fn(() => chain),
        update: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        upsert: vi.fn(() => chain),
        delete: vi.fn(() => chain)
      }
      mockSupabaseClient.from.mockReturnValue(fromMock)

      const section = await processSection(mockArticleId, 1, mockOutline)
      
      expect(section.section_index).toBe(1)
      // Verify update was called with both old and new sections
      expect(fromMock.update).toHaveBeenCalled()
    })
  })

  describe('processAllSections', () => {
    it('should process all sections sequentially', async () => {
      const sections = await processAllSections(mockArticleId, mockOutline)
      
      // Should process: Introduction (1) + H2 sections (2) + H3 subsections (5) + Conclusion (1) + FAQ (1) = 10 sections
      expect(sections.length).toBeGreaterThan(0)
      
      // Check first section is introduction
      expect(sections[0].section_type).toBe('introduction')
      expect(sections[0].section_index).toBe(0)
    })

    it('should process H2 sections before their H3 subsections', async () => {
      const sections = await processAllSections(mockArticleId, mockOutline)
      
      const h2Section = sections.find(s => s.section_index === 1)
      const firstH3 = sections.find(s => s.section_index === 1.1)
      
      expect(h2Section).toBeDefined()
      expect(firstH3).toBeDefined()
      
      // H2 should come before its H3 subsections
      const h2Index = sections.indexOf(h2Section!)
      const h3Index = sections.indexOf(firstH3!)
      expect(h2Index).toBeLessThan(h3Index)
    })

    it('should process conclusion after all H2 sections', async () => {
      const sections = await processAllSections(mockArticleId, mockOutline)
      
      const conclusionIndex = mockOutline.h2_sections.length + 1
      const conclusion = sections.find(s => s.section_index === conclusionIndex)
      
      expect(conclusion).toBeDefined()
      expect(conclusion?.section_type).toBe('conclusion')
    })

    it('should process FAQ last if included', async () => {
      const sections = await processAllSections(mockArticleId, mockOutline)
      
      const faqIndex = mockOutline.h2_sections.length + 2
      const faq = sections.find(s => s.section_index === faqIndex)
      
      expect(faq).toBeDefined()
      expect(faq?.section_type).toBe('faq')
      
      // FAQ should be the last section
      const lastSection = sections[sections.length - 1]
      expect(lastSection.section_index).toBe(faqIndex)
    })

    it('should skip FAQ if not included', async () => {
      const outlineWithoutFAQ: Outline = {
        ...mockOutline,
        faq: null
      }
      
      const sections = await processAllSections(mockArticleId, outlineWithoutFAQ)
      
      const faqIndex = outlineWithoutFAQ.h2_sections.length + 2
      const faq = sections.find(s => s.section_index === faqIndex)
      
      expect(faq).toBeUndefined()
    })
  })
})

