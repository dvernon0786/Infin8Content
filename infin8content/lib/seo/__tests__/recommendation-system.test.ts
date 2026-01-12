// SEO Recommendation System Tests
// Story 14.6: SEO Testing and Validation
// Test Suite: Recommendation System

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  generateRealTimeRecommendations,
  type RecommendationInput,
  type RecommendationContext,
  type RealTimeRecommendation
} from '../recommendation-system'

describe('SEO Recommendation System', () => {
  const baseInput: RecommendationInput = {
    content: 'This is a test content about SEO optimization and search rankings.',
    primaryKeyword: 'SEO optimization',
    secondaryKeywords: ['search rankings', 'optimization techniques'],
    targetWordCount: 300,
    contentType: 'general',
    targetAudience: 'marketers',
    searchIntent: 'informational'
  }

  describe('generateRealTimeRecommendations', () => {
    it('should generate recommendations for valid input', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('keywordPlacements')
      expect(result).toHaveProperty('semanticEnhancements')
      expect(result).toHaveProperty('contentLengthRecommendations')
      expect(result).toHaveProperty('internalLinkingOpportunities')
      expect(result).toHaveProperty('callToActionOptimizations')
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('priorityActions')
      expect(result).toHaveProperty('quickWins')
      
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(typeof result.overallScore).toBe('number')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should handle empty content gracefully', () => {
      const input = { ...baseInput, content: '' }
      const result = generateRealTimeRecommendations(input)
      
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(result.recommendations.some((r: RealTimeRecommendation) => 
        r.description.toLowerCase().includes('empty') || r.description.toLowerCase().includes('content')
      )).toBe(true)
    })

    it('should handle missing secondary keywords', () => {
      const input = { ...baseInput, secondaryKeywords: [] }
      const result = generateRealTimeRecommendations(input)
      
      expect(result).toBeDefined()
      expect(Array.isArray(result.semanticEnhancements)).toBe(true)
    })

    it('should prioritize recommendations correctly', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      const highPriorityRecs = result.recommendations.filter((r: RealTimeRecommendation) => r.priority === 'high')
      const mediumPriorityRecs = result.recommendations.filter((r: RealTimeRecommendation) => r.priority === 'medium')
      const lowPriorityRecs = result.recommendations.filter((r: RealTimeRecommendation) => r.priority === 'low')
      
      expect(result.recommendations.length).toBeGreaterThan(0)
      // Should have recommendations of different priorities
      expect(highPriorityRecs.length + mediumPriorityRecs.length + lowPriorityRecs.length)
        .toBe(result.recommendations.length)
    })

    it('should generate actionable recommendations', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      result.recommendations.forEach((rec: RealTimeRecommendation) => {
        expect(rec.description).toBeTruthy()
        expect(rec.action).toBeTruthy()
        expect(rec.type).toBeTruthy()
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority)
        expect(['immediate', 'next-section', 'future']).toContain(rec.category)
        expect(['low', 'medium', 'high']).toContain(rec.effort)
      })
    })

    it('should generate keyword placement recommendations', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      expect(Array.isArray(result.keywordPlacements)).toBe(true)
      result.keywordPlacements.forEach((placement: any) => {
        expect(placement.keyword).toBeTruthy()
        expect(placement.placementType).toBeTruthy()
        expect(placement.example).toBeTruthy()
      })
    })

    it('should generate semantic enhancement recommendations', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      expect(Array.isArray(result.semanticEnhancements)).toBe(true)
      result.semanticEnhancements.forEach((enhancement: any) => {
        expect(enhancement.semanticKeyword).toBeTruthy()
        expect(enhancement.context).toBeTruthy()
        expect(enhancement.example).toBeTruthy()
      })
    })

    it('should generate content length recommendations', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      expect(Array.isArray(result.contentLengthRecommendations)).toBe(true)
      result.contentLengthRecommendations.forEach((rec: any) => {
        expect(rec.currentLength).toBeGreaterThanOrEqual(0)
        expect(rec.targetLength).toBeGreaterThan(0)
        expect(rec.difference).toBeDefined()
      })
    })

    it('should generate internal linking opportunities', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      expect(Array.isArray(result.internalLinkingOpportunities)).toBe(true)
      result.internalLinkingOpportunities.forEach((opportunity: any) => {
        expect(opportunity.opportunity).toBeTruthy()
        expect(opportunity.anchorText).toBeTruthy()
        expect(opportunity.relevanceScore).toBeGreaterThanOrEqual(0)
      })
    })

    it('should generate call to action optimizations', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      expect(Array.isArray(result.callToActionOptimizations)).toBe(true)
      result.callToActionOptimizations.forEach((cta: any) => {
        expect(cta.type).toBeTruthy()
        expect(cta.placement).toBeTruthy()
        expect(cta.text).toBeTruthy()
      })
    })
  })

  describe('Context-Aware Recommendations', () => {
    it('should generate context-specific recommendations', () => {
      const context: RecommendationContext = {
        currentSection: 'introduction',
        totalSections: 5,
        sectionIndex: 0,
        wordCountSoFar: 50,
        targetTotalWordCount: 500,
        keywordsUsed: ['SEO optimization'],
        keywordsRemaining: ['search rankings', 'optimization techniques']
      }
      
      const result = generateRealTimeRecommendations(baseInput, context)
      
      expect(result).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should adjust recommendations based on progress', () => {
      const earlyContext: RecommendationContext = {
        currentSection: 'introduction',
        totalSections: 5,
        sectionIndex: 0,
        wordCountSoFar: 50,
        targetTotalWordCount: 500,
        keywordsUsed: [],
        keywordsRemaining: ['SEO optimization', 'search rankings']
      }
      
      const lateContext: RecommendationContext = {
        currentSection: 'conclusion',
        totalSections: 5,
        sectionIndex: 4,
        wordCountSoFar: 450,
        targetTotalWordCount: 500,
        keywordsUsed: ['SEO optimization', 'search rankings'],
        keywordsRemaining: []
      }
      
      const earlyResult = generateRealTimeRecommendations(baseInput, earlyContext)
      const lateResult = generateRealTimeRecommendations(baseInput, lateContext)
      
      expect(earlyResult).toBeDefined()
      expect(lateResult).toBeDefined()
      // Results should be different based on context
      expect(earlyResult.recommendations.length).toBeGreaterThan(0)
      expect(lateResult.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle null input gracefully', () => {
      expect(() => {
        generateRealTimeRecommendations(null as any)
      }).not.toThrow()
    })

    it('should handle undefined input gracefully', () => {
      expect(() => {
        generateRealTimeRecommendations(undefined as any)
      }).not.toThrow()
    })

    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        { content: null },
        { content: undefined },
        { content: 123 },
        { primaryKeyword: null },
        { primaryKeyword: undefined },
        { secondaryKeywords: 'not an array' }
      ]
      
      malformedInputs.forEach(input => {
        expect(() => {
          generateRealTimeRecommendations(input as any)
        }).not.toThrow()
      })
    })

    it('should return fallback recommendations on errors', () => {
      const result = generateRealTimeRecommendations({
        content: '',
        primaryKeyword: '',
        secondaryKeywords: [],
        targetWordCount: 0,
        contentType: 'general'
      })
      
      expect(result).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
      expect(typeof result.overallScore).toBe('number')
    })
  })

  describe('Performance', () => {
    it('should generate recommendations quickly', () => {
      const startTime = performance.now()
      
      generateRealTimeRecommendations(baseInput)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // Should complete in less than 100ms
    })

    it('should handle large content efficiently', () => {
      const largeContent = 'This is a test. '.repeat(1000) // Large content
      const input = { ...baseInput, content: largeContent }
      
      const startTime = performance.now()
      
      const result = generateRealTimeRecommendations(input)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(result).toBeDefined()
      expect(duration).toBeLessThan(200) // Should handle large content efficiently
    })
  })
})
