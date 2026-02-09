/**
 * Outline Generator Service Tests
 * Story 4a.2: Section-by-Section Architecture and Outline Generation
 */

import { describe, it, expect, vi } from 'vitest'
import { generateOutline } from '@/lib/services/article-generation/outline-generator'
import type { KeywordResearchData, SerpAnalysis } from '@/lib/services/article-generation/outline-generator'

describe('Outline Generator', () => {
  const mockKeyword = 'best running shoes'
  
  const mockKeywordResearch: KeywordResearchData = {
    keyword: 'best running shoes',
    searchVolume: 5000,
    keywordDifficulty: 45,
    trend: [4000, 4200, 4500, 4800, 5000],
    cpc: 2.5,
    competition: 'Medium'
  }

  const mockSerpAnalysis: SerpAnalysis = {
    commonH2Topics: [
      'What to Look For',
      'Types of Running Shoes',
      'Best Brands',
      'How to Choose',
      'Price Ranges',
      'Care and Maintenance',
      'Common Mistakes'
    ],
    h2Frequency: {},
    contentGaps: [],
    topStructures: []
  }

  it('should generate outline with correct structure', async () => {
    const result = await generateOutline(mockKeyword, mockKeywordResearch, mockSerpAnalysis)
    const outline = result.outline

    expect(outline).toHaveProperty('introduction')
    expect(outline.introduction).toHaveProperty('title')
    expect(outline.introduction).toHaveProperty('h3_subsections')
    expect(Array.isArray(outline.introduction.h3_subsections)).toBe(true)

    expect(outline).toHaveProperty('h2_sections')
    expect(Array.isArray(outline.h2_sections)).toBe(true)
    expect(outline.h2_sections.length).toBeGreaterThanOrEqual(5)
    expect(outline.h2_sections.length).toBeLessThanOrEqual(10)

    expect(outline).toHaveProperty('conclusion')
    expect(outline.conclusion).toHaveProperty('title')

    expect(outline).toHaveProperty('faq')
  })

  it('should generate 5-10 H2 sections', async () => {
    const result = await generateOutline(mockKeyword, mockKeywordResearch, mockSerpAnalysis)
    const outline = result.outline

    expect(outline.h2_sections.length).toBeGreaterThanOrEqual(5)
    expect(outline.h2_sections.length).toBeLessThanOrEqual(10)
  })

  it('should generate 2-4 H3 subsections per H2', async () => {
    const result = await generateOutline(mockKeyword, mockKeywordResearch, mockSerpAnalysis)
    const outline = result.outline

    outline.h2_sections.forEach((h2Section: any) => {
      expect(h2Section.h3_subsections.length).toBeGreaterThanOrEqual(2)
      expect(h2Section.h3_subsections.length).toBeLessThanOrEqual(4)
    })
  })

  it('should include FAQ for high-volume keywords', async () => {
    const highVolumeResearch = { ...mockKeywordResearch, searchVolume: 10000 }
    const result = await generateOutline(mockKeyword, highVolumeResearch, mockSerpAnalysis)
    const outline = result.outline

    expect(outline.faq).not.toBeNull()
    expect(outline.faq?.included).toBe(true)
  })

  it('should handle null keyword research gracefully', async () => {
    const result = await generateOutline(mockKeyword, null, mockSerpAnalysis)
    const outline = result.outline

    expect(outline).toHaveProperty('introduction')
    expect(outline).toHaveProperty('h2_sections')
    expect(outline.h2_sections.length).toBeGreaterThanOrEqual(5)
  })

  it('should complete in less than 20 seconds', async () => {
    const startTime = Date.now()
    await generateOutline(mockKeyword, mockKeywordResearch, mockSerpAnalysis)
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(20000)
  })
})

