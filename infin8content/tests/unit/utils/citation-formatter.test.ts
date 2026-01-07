/**
 * Citation Formatter Unit Tests
 * Story 4a.3: Real-Time Research Per Section (Tavily Integration)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatInTextCitation,
  formatReference,
  formatCitations,
  validateCitationUrl,
  formatCitationsForMarkdown
} from '@/lib/utils/citation-formatter'
import type { TavilySource } from '@/lib/services/tavily/tavily-client'

// Mock fetch for URL validation
global.fetch = vi.fn()

describe('Citation Formatter', () => {
  const mockSource: TavilySource = {
    title: 'Best Running Shoes 2024',
    url: 'https://example.com/shoes',
    excerpt: 'Running shoes are essential for runners...',
    published_date: '2024-01-15',
    author: 'John Doe',
    relevance_score: 0.95
  }

  const mockSourceMinimal: TavilySource = {
    title: 'Running Guide',
    url: 'https://example.com/guide',
    excerpt: 'A guide to running...',
    published_date: null,
    author: null,
    relevance_score: 0.85
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatInTextCitation', () => {
    it('should format in-text citation with default context', () => {
      const result = formatInTextCitation(mockSource)
      
      expect(result).toContain('According to')
      expect(result).toContain('[Best Running Shoes 2024]')
      expect(result).toContain('(https://example.com/shoes)')
    })

    it('should format in-text citation with custom context', () => {
      const result = formatInTextCitation(mockSource, 'As noted in')
      
      expect(result).toContain('As noted in')
      expect(result).toContain('[Best Running Shoes 2024]')
      expect(result).toContain('(https://example.com/shoes)')
    })

    it('should handle sources with missing title', () => {
      const sourceWithoutTitle = { ...mockSource, title: '' }
      const result = formatInTextCitation(sourceWithoutTitle)
      
      expect(result).toContain('[Source]')
    })

    it('should handle sources with missing URL', () => {
      const sourceWithoutUrl = { ...mockSource, url: '' }
      const result = formatInTextCitation(sourceWithoutUrl)
      
      expect(result).toContain('#')
    })
  })

  describe('formatReference', () => {
    it('should format reference with author and date', () => {
      const result = formatReference(mockSource)
      
      expect(result).toContain('[Best Running Shoes 2024]')
      expect(result).toContain('(https://example.com/shoes)')
      expect(result).toContain('John Doe')
      expect(result).toContain('(2024)')
    })

    it('should format reference without author and date', () => {
      const result = formatReference(mockSourceMinimal)
      
      expect(result).toContain('[Running Guide]')
      expect(result).toContain('(https://example.com/guide)')
      expect(result).not.toContain(' - ')
    })

    it('should format reference with only author', () => {
      const sourceWithAuthor = { ...mockSourceMinimal, author: 'Jane Smith' }
      const result = formatReference(sourceWithAuthor)
      
      expect(result).toContain('Jane Smith')
      // Should not contain date parentheses (but URL parentheses are OK)
      expect(result).not.toMatch(/\(20\d{2}\)/) // No year in parentheses
    })

    it('should format reference with only date', () => {
      const sourceWithDate = { ...mockSourceMinimal, published_date: '2024-01-01' }
      const result = formatReference(sourceWithDate)
      
      expect(result).toContain('(2024)')
    })
  })

  describe('formatCitations', () => {
    it('should format multiple citations', () => {
      const sources = [mockSource, mockSourceMinimal]
      const result = formatCitations(sources)
      
      expect(result.inTextCitations).toHaveLength(2)
      expect(result.referenceList).toHaveLength(2)
    })

    it('should limit to top 10 sources', () => {
      const manySources = Array.from({ length: 15 }, (_, i) => ({
        ...mockSource,
        title: `Source ${i}`,
        url: `https://example.com/${i}`,
        relevance_score: 1 - (i * 0.05)
      }))
      
      const result = formatCitations(manySources)
      
      expect(result.inTextCitations.length).toBeLessThanOrEqual(10)
      expect(result.referenceList.length).toBeLessThanOrEqual(10)
    })

    it('should use varied citation contexts', () => {
      const sources = [mockSource, mockSourceMinimal]
      const result = formatCitations(sources)
      
      const contexts = ['According to', 'As noted in', 'As reported by', 'Research from', 'Studies show']
      const hasVariation = result.inTextCitations.some(citation => 
        contexts.some(context => citation.includes(context))
      )
      
      expect(hasVariation).toBe(true)
    })

    it('should handle empty sources array', () => {
      const result = formatCitations([])
      
      expect(result.inTextCitations).toHaveLength(0)
      expect(result.referenceList).toHaveLength(0)
    })
  })

  describe('validateCitationUrl', () => {
    it('should validate valid HTTPS URL', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true
      })

      const result = await validateCitationUrl('https://example.com/article')
      
      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/article',
        expect.objectContaining({
          method: 'HEAD',
          signal: expect.any(AbortSignal)
        })
      )
    })

    it('should validate valid HTTP URL', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true
      })

      const result = await validateCitationUrl('http://example.com/article')
      
      expect(result).toBe(true)
    })

    it('should reject invalid URL format', async () => {
      const result = await validateCitationUrl('not-a-url')
      
      expect(result).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should reject empty URL', async () => {
      const result = await validateCitationUrl('')
      
      expect(result).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const result = await validateCitationUrl('https://example.com/article')
      
      expect(result).toBe(false)
    })

    it('should handle timeout', async () => {
      // Mock AbortController
      const mockAbort = vi.fn()
      const mockSignal = { aborted: false }
      global.AbortController = vi.fn(() => ({
        abort: mockAbort,
        signal: mockSignal as any
      })) as any

      ;(global.fetch as any).mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100)
        })
      )

      const result = await validateCitationUrl('https://example.com/article', 50)
      
      expect(result).toBe(false)
    })

    it('should reject non-200 responses', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404
      })

      const result = await validateCitationUrl('https://example.com/article')
      
      expect(result).toBe(false)
    })
  })

  describe('formatCitationsForMarkdown', () => {
    it('should format citations and add reference list', () => {
      const content = 'This is the main content.'
      const sources = [mockSource, mockSourceMinimal]
      
      const result = formatCitationsForMarkdown(content, sources)
      
      expect(result).toContain('This is the main content.')
      expect(result).toContain('## References')
      expect(result).toContain('[Best Running Shoes 2024]')
      expect(result).toContain('[Running Guide]')
    })

    it('should include minimum citations', () => {
      const content = 'Content here.'
      const sources = [mockSource]
      
      const result = formatCitationsForMarkdown(content, sources, 1, 3)
      
      expect(result).toContain('## References')
    })

    it('should limit to max citations', () => {
      const content = 'Content here.'
      const manySources = Array.from({ length: 10 }, (_, i) => ({
        ...mockSource,
        title: `Source ${i}`,
        url: `https://example.com/${i}`
      }))
      
      const result = formatCitationsForMarkdown(content, manySources, 1, 3)
      
      // Should have reference list with limited entries
      const referenceMatches = result.match(/## References/g)
      expect(referenceMatches).toBeDefined()
    })

    it('should handle empty sources', () => {
      const content = 'Content here.'
      const result = formatCitationsForMarkdown(content, [])
      
      expect(result).toBe(content)
      expect(result).not.toContain('## References')
    })

    it('should handle content without citations', () => {
      const content = 'Content here.'
      const sources = [mockSource]
      
      const result = formatCitationsForMarkdown(content, sources, 0, 0)
      
      expect(result).toBe(content)
    })
  })
})

