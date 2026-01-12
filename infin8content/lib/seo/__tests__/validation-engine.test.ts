// SEO Validation Engine Tests
// Story 14.6: SEO Testing and Validation
// Test file: validation-engine.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { validateSEOContent } from '../validation-engine'

describe('SEO Validation Engine', () => {
  const baseInput = {
    content: '# SEO Optimization Guide\n\nThis is a comprehensive guide about SEO optimization. SEO optimization helps improve search rankings.',
    primaryKeyword: 'SEO optimization',
    secondaryKeywords: ['search rankings', 'optimization techniques'],
    targetWordCount: 300,
    contentType: 'general'
  }

  describe('validateSEOContent', () => {
    it('should return a valid validation result', () => {
      const result = validateSEOContent(baseInput)
      
      expect(result).toHaveProperty('passed')
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('issues')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('metrics')
      
      expect(typeof result.passed).toBe('boolean')
      expect(typeof result.score).toBe('number')
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should validate keyword density rules', () => {
      const contentWithLowDensity = 'This is a very long article about search engine optimization and how to improve website rankings. It contains many words but only mentions the target keyword once in this entire paragraph.'
      const input = {
        ...baseInput,
        content: contentWithLowDensity
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'keyword' && issue.type === 'error'
      )).toBe(true)
      
      expect(result.recommendations.some(rec => 
        rec.type === 'fix' && rec.priority === 'high'
      )).toBe(true)
    })

    it('should validate keyword placement', () => {
      const contentWithoutPlacement = 'This is content that does not mention the keyword in the first paragraph or headings.'
      const input = {
        ...baseInput,
        content: contentWithoutPlacement
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'keyword' && issue.type === 'warning'
      )).toBe(true)
    })

    it('should validate semantic keyword coverage', () => {
      const contentWithoutSemantics = 'This content only mentions SEO optimization but no related terms.'
      const input = {
        ...baseInput,
        content: contentWithoutSemantics,
        secondaryKeywords: ['search rankings', 'optimization techniques', 'keyword analysis']
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'keyword' && issue.type === 'info'
      )).toBe(true)
    })

    it('should validate readability grade level', () => {
      const complexContent = 'The implementation of sophisticated search engine optimization methodologies necessitates comprehensive understanding of algorithmic intricacies and ranking factor correlations.'
      const input = {
        ...baseInput,
        content: complexContent
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'readability'
      )).toBe(true)
    })

    it('should validate sentence length', () => {
      const longSentenceContent = 'This is an extremely long sentence that goes on and on without any punctuation or breaks which makes it very difficult to read and understand properly.'
      const input = {
        ...baseInput,
        content: longSentenceContent
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'readability' && issue.type === 'info'
      )).toBe(true)
    })

    it('should validate heading hierarchy', () => {
      const contentWithBadHierarchy = '# Title\n\n### Subheading\n\n## Another heading\n\nContent here.'
      const input = {
        ...baseInput,
        content: contentWithBadHierarchy
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'structure' && issue.type === 'error'
      )).toBe(true)
    })

    it('should validate content flow', () => {
      const contentWithPoorFlow = 'Single paragraph.'
      const input = {
        ...baseInput,
        content: contentWithPoorFlow
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'structure' && issue.type === 'info'
      )).toBe(true)
    })

    it('should validate title length', () => {
      const contentWithLongTitle = 'This is an extremely long title that exceeds the optimal length for search engine optimization and will likely be truncated in search results.'
      const input = {
        ...baseInput,
        content: contentWithLongTitle
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'meta' && issue.type === 'warning'
      )).toBe(true)
    })

    it('should validate meta description length', () => {
      const contentWithLongDescription = 'This is an extremely long first paragraph that serves as a meta description but exceeds the optimal length of 150-160 characters and will likely be truncated in search results, making it less effective for SEO purposes.'
      const input = {
        ...baseInput,
        content: contentWithLongDescription
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'meta' && issue.type === 'warning'
      )).toBe(true)
    })

    it('should validate image alt text', () => {
      const contentWithImages = '![image](image.jpg)\n\n![](no-alt.jpg)\n\nContent with images.'
      const input = {
        ...baseInput,
        content: contentWithImages
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'meta' && issue.type === 'info'
      )).toBe(true)
    })

    it('should validate content length', () => {
      const shortContent = 'Very short content.'
      const input = {
        ...baseInput,
        content: shortContent,
        targetWordCount: 100
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'performance' && issue.type === 'warning'
      )).toBe(true)
    })

    it('should validate internal linking', () => {
      const contentWithoutLinks = 'Content with no internal links to other pages.'
      const input = {
        ...baseInput,
        content: contentWithoutLinks
      }
      
      const result = validateSEOContent(input)
      
      expect(result.issues.some(issue => 
        issue.category === 'performance' && issue.type === 'info'
      )).toBe(true)
    })

    it('should provide actionable recommendations', () => {
      const input = {
        ...baseInput,
        content: 'Poor content with no structure, no keywords, and many issues.'
      }
      
      const result = validateSEOContent(input)
      
      expect(result.recommendations.length).toBeGreaterThan(0)
      
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('ruleId')
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('message')
        expect(rec).toHaveProperty('action')
        expect(rec).toHaveProperty('expectedValue')
        expect(rec).toHaveProperty('actualValue')
      })
    })

    it('should calculate validation metrics', () => {
      const result = validateSEOContent(baseInput)
      
      expect(result.metrics).toHaveProperty('totalRules')
      expect(result.metrics).toHaveProperty('passedRules')
      expect(result.metrics).toHaveProperty('failedRules')
      expect(result.metrics).toHaveProperty('errorCount')
      expect(result.metrics).toHaveProperty('warningCount')
      expect(result.metrics).toHaveProperty('infoCount')
      expect(result.metrics).toHaveProperty('validationTime')
      
      expect(typeof result.metrics.totalRules).toBe('number')
      expect(typeof result.metrics.passedRules).toBe('number')
      expect(typeof result.metrics.failedRules).toBe('number')
      expect(typeof result.metrics.validationTime).toBe('number')
    })

    it('should handle strict mode option', () => {
      const strictInput = {
        ...baseInput,
        options: {
          strictMode: true,
          skipPerformanceTests: false
        }
      }
      
      const result = validateSEOContent(strictInput)
      
      expect(typeof result.passed).toBe('boolean')
      expect(typeof result.score).toBe('number')
    })

    it('should handle skip performance tests option', () => {
      const skipPerfInput = {
        ...baseInput,
        options: {
          strictMode: false,
          skipPerformanceTests: true
        }
      }
      
      const result = validateSEOContent(skipPerfInput)
      
      expect(typeof result.passed).toBe('boolean')
      expect(typeof result.score).toBe('number')
    })

    it('should perform within performance limits', () => {
      const startTime = performance.now()
      
      // Run multiple iterations to test performance
      for (let i = 0; i < 10; i++) {
        validateSEOContent(baseInput)
      }
      
      const endTime = performance.now()
      const averageTime = (endTime - startTime) / 10
      
      // Should complete within 100ms per call
      expect(averageTime).toBeLessThan(100)
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        { ...baseInput, content: '' },
        { ...baseInput, content: null as any },
        { ...baseInput, primaryKeyword: '' },
        { ...baseInput, secondaryKeywords: null as any }
      ]
      
      edgeCases.forEach(testCase => {
        expect(() => {
          const result = validateSEOContent(testCase)
          expect(typeof result.passed).toBe('boolean')
          expect(typeof result.score).toBe('number')
        }).not.toThrow()
      })
    })
  })

  describe('Validation Rules', () => {
    it('should run all validation rules', () => {
      const result = validateSEOContent(baseInput)
      
      // Should run at least 10 validation rules
      expect(result.metrics.totalRules).toBeGreaterThanOrEqual(10)
    })

    it('should categorize issues correctly', () => {
      const result = validateSEOContent(baseInput)
      
      const categories = result.issues.map(issue => issue.category)
      const uniqueCategories = [...new Set(categories)]
      
      expect(uniqueCategories.length).toBeGreaterThan(0)
      expect(uniqueCategories.every(cat => 
        ['keyword', 'readability', 'structure', 'meta', 'performance'].includes(cat)
      )).toBe(true)
    })

    it('should prioritize issues correctly', () => {
      const result = validateSEOContent(baseInput)
      
      const priorities = result.issues.map(issue => issue.type)
      const uniquePriorities = [...new Set(priorities)]
      
      expect(uniquePriorities.every(priority => 
        ['error', 'warning', 'info'].includes(priority)
      )).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed content', () => {
      const malformedInputs = [
        { ...baseInput, content: undefined },
        { ...baseInput, content: null },
        { ...baseInput, content: 123 as any }
      ]
      
      malformedInputs.forEach(input => {
        expect(() => validateSEOContent(input as any)).not.toThrow()
      })
    })

    it('should handle invalid keyword data', () => {
      const invalidKeywordInputs = [
        { ...baseInput, primaryKeyword: null as any },
        { ...baseInput, primaryKeyword: undefined },
        { ...baseInput, secondaryKeywords: 'not an array' as any }
      ]
      
      invalidKeywordInputs.forEach(input => {
        expect(() => validateSEOContent(input as any)).not.toThrow()
      })
    })
  })
})
