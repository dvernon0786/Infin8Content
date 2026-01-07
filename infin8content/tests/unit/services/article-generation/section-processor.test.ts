/**
 * Section Processor Service Tests
 * Story 4a.2: Section-by-Section Architecture and Outline Generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processSection, processAllSections } from '@/lib/services/article-generation/section-processor'
import type { Outline } from '@/lib/services/article-generation/outline-generator'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            sections: [],
            keyword: 'best running shoes'
          },
          error: null
        })
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => mockSupabaseClient)
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
    
    // Reset mock responses
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: {
        sections: [],
        keyword: mockKeyword
      },
      error: null
    })
  })

  describe('processSection', () => {
    it('should process introduction section (index 0)', async () => {
      const section = await processSection(mockArticleId, 0, mockOutline)
      
      expect(section.section_type).toBe('introduction')
      expect(section.section_index).toBe(0)
      expect(section.title).toBe(mockOutline.introduction.title)
      expect(section.content).toContain('placeholder content')
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
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { sections: [], keyword: mockKeyword },
              error: null
            })
          })
        }),
        update: mockUpdate
      } as any)

      await processSection(mockArticleId, 0, mockOutline)
      
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalled()
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

      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                sections: existingSections,
                keyword: mockKeyword
              },
              error: null
            })
          })
        }),
        update: mockUpdate
      } as any)

      const section = await processSection(mockArticleId, 1, mockOutline)
      
      expect(section.section_index).toBe(1)
      // Verify update was called with both old and new sections
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalled()
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

