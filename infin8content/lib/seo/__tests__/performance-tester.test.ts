// SEO Performance Tester Tests
// Story 14.6: SEO Testing and Validation
// Test file: performance-tester.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { runPerformanceTest } from '../performance-tester'

describe('SEO Performance Tester', () => {
  const baseInput = {
    content: '# SEO Optimization Guide\n\nThis comprehensive guide covers SEO optimization techniques for better search rankings.',
    primaryKeyword: 'SEO optimization',
    secondaryKeywords: ['search rankings', 'optimization techniques'],
    targetKeywords: ['SEO optimization', 'search rankings', 'optimization techniques'],
    contentType: 'general'
  }

  describe('runPerformanceTest', () => {
    it('should return a valid performance test result', () => {
      const result = runPerformanceTest(baseInput)
      
      expect(result).toHaveProperty('performanceMetrics')
      expect(result).toHaveProperty('featuredSnippetAnalysis')
      expect(result).toHaveProperty('uniquenessResult')
      expect(result).toHaveProperty('mobileFriendlinessResult')
      expect(result).toHaveProperty('pageLoadImpactResult')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('overallScore')
      
      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should calculate performance metrics correctly', () => {
      const result = runPerformanceTest(baseInput)
      
      expect(result.performanceMetrics).toHaveProperty('rankingPotential')
      expect(result.performanceMetrics).toHaveProperty('competitorScore')
      expect(result.performanceMetrics).toHaveProperty('uniquenessScore')
      expect(result.performanceMetrics).toHaveProperty('featuredSnippetScore')
      expect(result.performanceMetrics).toHaveProperty('mobileFriendlinessScore')
      expect(result.performanceMetrics).toHaveProperty('pageLoadImpactScore')
      expect(result.performanceMetrics).toHaveProperty('overallPerformanceScore')
      
      Object.values(result.performanceMetrics).forEach(metric => {
        expect(typeof metric).toBe('number')
        expect(metric).toBeGreaterThanOrEqual(0)
        expect(metric).toBeLessThanOrEqual(100)
      })
    })

    it('should analyze featured snippet potential', () => {
      const contentWithQuestions = '# How does SEO optimization work?\n\nSEO optimization works by improving various factors. What are the best SEO optimization techniques? Here are 1. Research keywords 2. Optimize content 3. Build links.'
      const input = {
        ...baseInput,
        content: contentWithQuestions
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.featuredSnippetAnalysis).toHaveProperty('snippetOptimizationScore')
      expect(result.featuredSnippetAnalysis).toHaveProperty('questionBasedContent')
      expect(result.featuredSnippetAnalysis).toHaveProperty('listFormatOpportunities')
      expect(result.featuredSnippetAnalysis).toHaveProperty('definitionOpportunities')
      expect(result.featuredSnippetAnalysis).toHaveProperty('howToGuides')
      
      expect(typeof result.featuredSnippetAnalysis.snippetOptimizationScore).toBe('number')
      expect(typeof result.featuredSnippetAnalysis.questionBasedContent).toBe('boolean')
      expect(Array.isArray(result.featuredSnippetAnalysis.listFormatOpportunities)).toBe(true)
      expect(Array.isArray(result.featuredSnippetAnalysis.definitionOpportunities)).toBe(true)
      expect(Array.isArray(result.featuredSnippetAnalysis.howToGuides)).toBe(true)
    })

    it('should analyze content uniqueness', () => {
      const contentWithDuplicates = 'SEO optimization is important. SEO optimization is very important. SEO optimization is really very important.'
      const input = {
        ...baseInput,
        content: contentWithDuplicates
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.uniquenessResult).toHaveProperty('uniquenessScore')
      expect(result.uniquenessResult).toHaveProperty('duplicatePhrases')
      expect(result.uniquenessResult).toHaveProperty('similarSentences')
      expect(result.uniquenessResult).toHaveProperty('originalityScore')
      expect(result.uniquenessResult).toHaveProperty('plagiarismRisk')
      
      expect(typeof result.uniquenessResult.uniquenessScore).toBe('number')
      expect(typeof result.uniquenessResult.originalityScore).toBe('number')
      expect(['low', 'medium', 'high']).toContain(result.uniquenessResult.plagiarismRisk)
      expect(Array.isArray(result.uniquenessResult.duplicatePhrases)).toBe(true)
      expect(Array.isArray(result.uniquenessResult.similarSentences)).toBe(true)
    })

    it('should analyze mobile friendliness', () => {
      const contentWithLongSentences = 'This is an extremely long and complex sentence that contains multiple clauses and would be very difficult to read on a mobile device due to its length and complexity. Here is another very long sentence that would also be problematic for mobile readers because it requires horizontal scrolling or very small font sizes to be displayed properly on mobile screens.'
      const input = {
        ...baseInput,
        content: contentWithLongSentences
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.mobileFriendlinessResult).toHaveProperty('mobileScore')
      expect(result.mobileFriendlinessResult).toHaveProperty('readabilityOnMobile')
      expect(result.mobileFriendlinessResult).toHaveProperty('navigationStructure')
      expect(result.mobileFriendlinessResult).toHaveProperty('imageOptimization')
      expect(result.mobileFriendlinessResult).toHaveProperty('loadTimeImpact')
      
      Object.values(result.mobileFriendlinessResult).forEach(metric => {
        expect(typeof metric).toBe('number')
        expect(metric).toBeGreaterThanOrEqual(0)
        expect(metric).toBeLessThanOrEqual(100)
      })
    })

    it('should analyze page load impact', () => {
      const contentWithManyImages = 'Content with many images: ![image1](img1.jpg) ![image2](img2.jpg) ![image3](img3.jpg) ![image4](img4.jpg) ![image5](img5.jpg) ![image6](img6.jpg)'
      const input = {
        ...baseInput,
        content: contentWithManyImages
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.pageLoadImpactResult).toHaveProperty('contentComplexityScore')
      expect(result.pageLoadImpactResult).toHaveProperty('imageCount')
      expect(result.pageLoadImpactResult).toHaveProperty('wordCountImpact')
      expect(result.pageLoadImpactResult).toHaveProperty('estimatedLoadTime')
      expect(result.pageLoadImpactResult).toHaveProperty('optimizationSuggestions')
      
      expect(typeof result.pageLoadImpactResult.contentComplexityScore).toBe('number')
      expect(typeof result.pageLoadImpactResult.imageCount).toBe('number')
      expect(typeof result.pageLoadImpactResult.wordCountImpact).toBe('number')
      expect(typeof result.pageLoadImpactResult.estimatedLoadTime).toBe('number')
      expect(Array.isArray(result.pageLoadImpactResult.optimizationSuggestions)).toBe(true)
    })

    it('should analyze competitor content when provided', () => {
      const competitorContent = '# Advanced SEO Techniques\n\nThis covers advanced SEO optimization methods and professional search ranking strategies.'
      const input = {
        ...baseInput,
        competitorContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.competitorAnalysis).toBeDefined()
      expect(result.competitorAnalysis).toHaveProperty('competitorScore')
      expect(result.competitorAnalysis).toHaveProperty('contentGaps')
      expect(result.competitorAnalysis).toHaveProperty('strengthAreas')
      expect(result.competitorAnalysis).toHaveProperty('improvementOpportunities')
      
      expect(typeof result.competitorAnalysis!.competitorScore).toBe('number')
      expect(Array.isArray(result.competitorAnalysis!.contentGaps)).toBe(true)
      expect(Array.isArray(result.competitorAnalysis!.strengthAreas)).toBe(true)
      expect(Array.isArray(result.competitorAnalysis!.improvementOpportunities)).toBe(true)
    })

    it('should provide relevant recommendations', () => {
      const result = runPerformanceTest(baseInput)
      
      expect(Array.isArray(result.recommendations)).toBe(true)
      
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('description')
        expect(rec).toHaveProperty('action')
        expect(rec).toHaveProperty('impact')
        
        expect(['competitor', 'uniqueness', 'snippet', 'mobile', 'performance']).toContain(rec.type)
        expect(['high', 'medium', 'low']).toContain(rec.priority)
        expect(typeof rec.impact).toBe('number')
      })
    })

    it('should calculate ranking potential correctly', () => {
      const result = runPerformanceTest(baseInput)
      
      expect(typeof result.performanceMetrics.rankingPotential).toBe('number')
      expect(result.performanceMetrics.rankingPotential).toBeGreaterThanOrEqual(0)
      expect(result.performanceMetrics.rankingPotential).toBeLessThanOrEqual(100)
    })

    it('should handle empty content gracefully', () => {
      const input = {
        ...baseInput,
        content: ''
      }
      
      const result = runPerformanceTest(input)
      
      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should handle very long content', () => {
      const longContent = 'This is a test. '.repeat(1000)
      const input = {
        ...baseInput,
        content: longContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should perform within performance limits', () => {
      const startTime = performance.now()
      
      // Run multiple iterations to test performance
      for (let i = 0; i < 5; i++) {
        runPerformanceTest(baseInput)
      }
      
      const endTime = performance.now()
      const averageTime = (endTime - startTime) / 5
      
      // Should complete within 500ms per call (performance testing is more complex)
      expect(averageTime).toBeLessThan(500)
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        { ...baseInput, content: null as any },
        { ...baseInput, content: undefined },
        { ...baseInput, primaryKeyword: '' },
        { ...baseInput, targetKeywords: [] }
      ]
      
      edgeCases.forEach(testCase => {
        expect(() => {
          const result = runPerformanceTest(testCase as any)
          expect(typeof result.overallScore).toBe('number')
          expect(result.overallScore).toBeGreaterThanOrEqual(0)
          expect(result.overallScore).toBeLessThanOrEqual(100)
        }).not.toThrow()
      })
    })
  })

  describe('Content Analysis Features', () => {
    it('should detect question-based content accurately', () => {
      const questionContent = '# How does SEO work?\n\nWhat are the best practices? Why is SEO important? When should you optimize?'
      const input = {
        ...baseInput,
        content: questionContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.featuredSnippetAnalysis.questionBasedContent).toBe(true)
      expect(result.featuredSnippetAnalysis.snippetOptimizationScore).toBeGreaterThan(50)
    })

    it('should detect list format opportunities', () => {
      const listContent = '# SEO Steps\n\n1. Research keywords\n2. Optimize content\n3. Build links\n\n- Monitor results\n- Adjust strategy\n- Improve rankings'
      const input = {
        ...baseInput,
        content: listContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.featuredSnippetAnalysis.snippetOptimizationScore).toBeGreaterThan(70)
    })

    it('should detect duplicate phrases', () => {
      const duplicateContent = 'SEO optimization is important. SEO optimization is critical. SEO optimization is essential.'
      const input = {
        ...baseInput,
        content: duplicateContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.uniquenessResult.duplicatePhrases.length).toBeGreaterThan(0)
      expect(result.uniquenessResult.uniquenessScore).toBeLessThan(80)
    })

    it('should assess mobile readability correctly', () => {
      const mobileUnfriendlyContent = 'This sentence is way too long for mobile devices because it requires horizontal scrolling and makes it very difficult for users to read comfortably on smaller screens.'
      const input = {
        ...baseInput,
        content: mobileUnfriendlyContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.mobileFriendlinessResult.mobileScore).toBeLessThan(80)
      expect(result.mobileFriendlinessResult.readabilityOnMobile).toBeLessThan(80)
    })

    it('should calculate content complexity accurately', () => {
      const complexContent = '# Complex Content\n\n' + 
        'This is content with many images: ![img1](img1.jpg) ![img2](img2.jpg) ![img3](img3.jpg)\n\n' +
        'And many links: [link1](url1) [link2](url2) [link3](url3) [link4](url4) [link5](url5)\n\n' +
        'And lots of words. '.repeat(100)
      
      const input = {
        ...baseInput,
        content: complexContent
      }
      
      const result = runPerformanceTest(input)
      
      expect(result.pageLoadImpactResult.contentComplexityScore).toBeGreaterThan(50)
      expect(result.pageLoadImpactResult.estimatedLoadTime).toBeGreaterThan(1.0)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        {},
        { content: null },
        { content: '' }
      ]
      
      malformedInputs.forEach(input => {
        expect(() => {
          const result = runPerformanceTest(input as any)
          expect(typeof result.overallScore).toBe('number')
        }).not.toThrow()
      })
    })

    it('should handle invalid keyword data', () => {
      const invalidInputs = [
        { ...baseInput, primaryKeyword: null as any },
        { ...baseInput, targetKeywords: null as any },
        { ...baseInput, secondaryKeywords: 'not array' as any }
      ]
      
      invalidInputs.forEach(input => {
        expect(() => {
          const result = runPerformanceTest(input as any)
          expect(typeof result.overallScore).toBe('number')
        }).not.toThrow()
      })
    })
  })
})
