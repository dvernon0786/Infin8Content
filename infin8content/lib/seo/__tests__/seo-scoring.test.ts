// SEO Scoring Tests
// Story 14.6: SEO Testing and Validation
// Test file: seo-scoring.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { calculateSEOScore } from '../seo-scoring'

describe('SEO Scoring Engine', () => {
  const baseInput = {
    content: 'This is a test content about SEO optimization. SEO optimization is important for search engines.',
    primaryKeyword: 'SEO optimization',
    secondaryKeywords: ['search engines', 'optimization techniques'],
    targetWordCount: 300,
    contentType: 'general' as const
  }

  describe('calculateSEOScore', () => {
    it('should return a valid SEO score result', () => {
      const result = calculateSEOScore(baseInput)
      
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('breakdown')
      expect(result).toHaveProperty('metrics')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('issues')
      
      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should calculate keyword density correctly', () => {
      const contentWithHighDensity = 'SEO optimization SEO optimization SEO optimization SEO optimization SEO optimization'
      const input = {
        ...baseInput,
        content: contentWithHighDensity
      }
      
      const result = calculateSEOScore(input)
      
      // Should have lower score due to keyword stuffing
      expect(result.breakdown.keywordDensity).toBeLessThan(80)
      expect(result.issues.some(issue => issue.category === 'keyword')).toBe(true)
    })

    it('should handle missing primary keyword', () => {
      const input = {
        ...baseInput,
        content: 'This content has no target keyword mentioned.',
        primaryKeyword: 'missing keyword'
      }
      
      const result = calculateSEOScore(input)
      
      expect(result.breakdown.keywordDensity).toBeLessThan(50)
      expect(result.issues.some(issue => issue.type === 'error')).toBe(true)
    })

    it('should calculate readability score', () => {
      const simpleContent = 'This is simple. It uses short sentences. Easy to read.'
      const input = {
        ...baseInput,
        content: simpleContent
      }
      
      const result = calculateSEOScore(input)
      
      expect(typeof result.breakdown.readability).toBe('number')
      expect(result.breakdown.readability).toBeGreaterThanOrEqual(0)
      expect(result.breakdown.readability).toBeLessThanOrEqual(100)
    })

    it('should validate content structure', () => {
      const contentWithHeadings = '# Main Heading\n\n## Subheading\n\nSome content here.\n\n### Another heading\n\nMore content.'
      const input = {
        ...baseInput,
        content: contentWithHeadings
      }
      
      const result = calculateSEOScore(input)
      
      expect(typeof result.breakdown.structure).toBe('number')
      expect(result.breakdown.structure).toBeGreaterThanOrEqual(0)
      expect(result.breakdown.structure).toBeLessThanOrEqual(100)
    })

    it('should calculate semantic coverage', () => {
      const contentWithSemantics = 'SEO optimization involves search engines and various optimization techniques.'
      const input = {
        ...baseInput,
        content: contentWithSemantics,
        secondaryKeywords: ['search engines', 'optimization techniques', 'keyword research']
      }
      
      const result = calculateSEOScore(input)
      
      expect(typeof result.breakdown.semanticCoverage).toBe('number')
      expect(result.breakdown.semanticCoverage).toBeGreaterThanOrEqual(0)
      expect(result.breakdown.semanticCoverage).toBeLessThanOrEqual(100)
    })

    it('should validate content length', () => {
      const shortContent = 'Short content.'
      const input = {
        ...baseInput,
        content: shortContent,
        targetWordCount: 100
      }
      
      const result = calculateSEOScore(input)
      
      expect(typeof result.breakdown.contentLength).toBe('number')
      expect(result.breakdown.contentLength).toBeGreaterThanOrEqual(0)
      expect(result.breakdown.contentLength).toBeLessThanOrEqual(100)
    })

    it('should handle empty content gracefully', () => {
      const input = {
        ...baseInput,
        content: ''
      }
      
      const result = calculateSEOScore(input)
      
      expect(result.overallScore).toBe(0)
      expect(result.issues.some(issue => issue.type === 'error')).toBe(true)
    })

    it('should provide relevant recommendations', () => {
      const input = {
        ...baseInput,
        content: 'Poor content with no structure and missing keywords.'
      }
      
      const result = calculateSEOScore(input)
      
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.recommendations.length).toBeGreaterThan(0)
      
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('description')
        expect(rec).toHaveProperty('action')
        expect(rec).toHaveProperty('impact')
      })
    })

    it('should extract metrics correctly', () => {
      const result = calculateSEOScore(baseInput)
      
      expect(result.metrics).toHaveProperty('wordCount')
      expect(result.metrics).toHaveProperty('keywordDensity')
      expect(result.metrics).toHaveProperty('readabilityScore')
      expect(result.metrics).toHaveProperty('semanticKeywordCount')
      expect(result.metrics).toHaveProperty('headingCount')
      expect(result.metrics).toHaveProperty('linkCount')
      expect(result.metrics).toHaveProperty('imageCount')
      
      expect(typeof result.metrics.wordCount).toBe('number')
      expect(typeof result.metrics.keywordDensity).toBe('number')
      expect(typeof result.metrics.readabilityScore).toBe('number')
    })

    it('should handle different content types', () => {
      const types = ['introduction', 'h2', 'h3', 'conclusion', 'faq'] as const
      
      types.forEach(type => {
        const input = {
          ...baseInput,
          contentType: type
        }
        
        const result = calculateSEOScore(input)
        
        expect(typeof result.overallScore).toBe('number')
        expect(result.overallScore).toBeGreaterThanOrEqual(0)
        expect(result.overallScore).toBeLessThanOrEqual(100)
      })
    })

    it('should perform within performance limits', () => {
      const startTime = performance.now()
      
      // Run multiple iterations to test performance
      for (let i = 0; i < 10; i++) {
        calculateSEOScore(baseInput)
      }
      
      const endTime = performance.now()
      const averageTime = (endTime - startTime) / 10
      
      // Should complete within 100ms per call
      expect(averageTime).toBeLessThan(100)
    })

    it('should handle edge cases', () => {
      const edgeCases = [
        { content: 'A', primaryKeyword: 'A', secondaryKeywords: [], targetWordCount: 1 },
        { content: 'A'.repeat(10000), primaryKeyword: 'test', secondaryKeywords: [], targetWordCount: 1000 },
        { content: '', primaryKeyword: '', secondaryKeywords: [], targetWordCount: 0 }
      ]
      
      edgeCases.forEach((testCase, index) => {
        expect(() => {
          const result = calculateSEOScore({
            ...testCase,
            contentType: 'general' as const
          })
          
          expect(typeof result.overallScore).toBe('number')
          expect(result.overallScore).toBeGreaterThanOrEqual(0)
          expect(result.overallScore).toBeLessThanOrEqual(100)
        }).not.toThrow()
      })
    })
  })

  describe('Score Breakdown Validation', () => {
    it('should have valid score breakdown values', () => {
      const result = calculateSEOScore(baseInput)
      
      Object.values(result.breakdown).forEach(score => {
        expect(typeof score).toBe('number')
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('should calculate weighted contributions correctly', () => {
      const result = calculateSEOScore(baseInput)
      
      // The overall score should be a weighted average of breakdown scores
      const weights = {
        keywordDensity: 0.25,
        readability: 0.20,
        structure: 0.20,
        semanticCoverage: 0.15,
        contentLength: 0.10,
        metaOptimization: 0.10
      }
      
      const calculatedScore = Math.round(
        result.breakdown.keywordDensity * weights.keywordDensity +
        result.breakdown.readability * weights.readability +
        result.breakdown.structure * weights.structure +
        result.breakdown.semanticCoverage * weights.semanticCoverage +
        result.breakdown.contentLength * weights.contentLength +
        result.breakdown.metaOptimization * weights.metaOptimization
      )
      
      // Allow for small rounding differences
      expect(Math.abs(result.overallScore - calculatedScore)).toBeLessThanOrEqual(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid input types', () => {
      const invalidInputs = [
        { ...baseInput, content: null },
        { ...baseInput, content: undefined },
        { ...baseInput, primaryKeyword: null },
        { ...baseInput, primaryKeyword: undefined }
      ]
      
      invalidInputs.forEach(input => {
        expect(() => calculateSEOScore(input as any)).not.toThrow()
      })
    })

    it('should handle malformed secondary keywords', () => {
      const input = {
        ...baseInput,
        secondaryKeywords: [null, undefined, '', 'valid keyword'] as any
      }
      
      expect(() => calculateSEOScore(input)).not.toThrow()
    })
  })
})
