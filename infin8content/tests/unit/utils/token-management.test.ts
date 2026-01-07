/**
 * Token Management Utilities Tests
 * Story 4a.2: Section-by-Section Architecture and Outline Generation
 */

import { describe, it, expect } from 'vitest'
import { estimateTokens, summarizeSections, fitInContextWindow } from '@/lib/utils/token-management'

describe('Token Management', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens correctly (4 chars ≈ 1 token)', () => {
      expect(estimateTokens('test')).toBe(1) // 4 chars = 1 token
      expect(estimateTokens('hello world')).toBe(3) // 11 chars = 3 tokens (rounded up)
      expect(estimateTokens('')).toBe(0)
    })

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000)
      expect(estimateTokens(longText)).toBe(250) // 1000 chars = 250 tokens
    })
  })

  describe('summarizeSections', () => {
    it('should return empty string for empty sections', () => {
      expect(summarizeSections([], 1000)).toBe('')
    })

    it('should summarize sections within token limit', () => {
      const sections = [
        {
          title: 'Introduction',
          content: 'This is the introduction section. It contains important information about the topic.',
          section_type: 'introduction'
        },
        {
          title: 'Main Section',
          content: 'This is the main section. It has detailed content about various aspects.',
          section_type: 'h2'
        }
      ]

      const summary = summarizeSections(sections, 100)
      expect(summary).toContain('Introduction')
      expect(summary).toContain('Main Section')
      expect(estimateTokens(summary)).toBeLessThanOrEqual(100)
    })

    it('should truncate if summary exceeds max tokens', () => {
      const sections = Array.from({ length: 10 }, (_, i) => ({
        title: `Section ${i + 1}`,
        content: 'a'.repeat(1000), // Long content
        section_type: 'h2' as const
      }))

      const summary = summarizeSections(sections, 100)
      expect(estimateTokens(summary)).toBeLessThanOrEqual(100)
    })
  })

  describe('fitInContextWindow', () => {
    it('should return true if content fits within context window', () => {
      const prompt = 'Generate content about running shoes.'
      const research = 'Research data about running shoes.'
      const summaries = 'Previous sections summary.'

      expect(fitInContextWindow(prompt, research, summaries, 6000)).toBe(true)
    })

    it('should return false if content exceeds context window', () => {
      const prompt = 'a'.repeat(10000) // ~2500 tokens
      const research = 'b'.repeat(10000) // ~2500 tokens
      const summaries = 'c'.repeat(10000) // ~2500 tokens
      // Total: ~7500 tokens, exceeds 6000 limit

      expect(fitInContextWindow(prompt, research, summaries, 6000)).toBe(false)
    })

    it('should account for new section content (~3000 tokens)', () => {
      const prompt = 'a'.repeat(2000) // ~500 tokens
      const research = 'b'.repeat(2000) // ~500 tokens
      const summaries = 'c'.repeat(2000) // ~500 tokens
      // Total: ~1500 tokens, leaves ~4500 for new content (should fit)

      expect(fitInContextWindow(prompt, research, summaries, 6000)).toBe(true)
    })
  })
})

