// SEO Recommendation System Tests
// Story 14.6: SEO Testing and Validation
// Test file: recommendation-system.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { generateRealTimeRecommendations } from '../recommendation-system'

describe('SEO Recommendation System', () => {
  const baseInput = {
    content: '# SEO Optimization Guide\n\nThis is a guide about SEO optimization techniques for better search rankings.',
    primaryKeyword: 'SEO optimization',
    secondaryKeywords: ['search rankings', 'optimization techniques'],
    targetWordCount: 300,
    contentType: 'general' as const
  }

  describe('generateRealTimeRecommendations', () => {
    it('should return a valid recommendation result', () => {
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
      expect(Array.isArray(result.keywordPlacements)).toBe(true)
      expect(Array.isArray(result.semanticEnhancements)).toBe(true)
      expect(Array.isArray(result.contentLengthRecommendations)).toBe(true)
      expect(Array.isArray(result.internalLinkingOpportunities)).toBe(true)
      expect(Array.isArray(result.callToActionOptimizations)).toBe(true)
      expect(Array.isArray(result.priorityActions)).toBe(true)
      expect(Array.isArray(result.quickWins)).toBe(true)
    })

    it('should generate keyword placement recommendations', () => {
      const contentWithoutKeyword = 'This is content that does not mention the target keyword anywhere.'
      const input = {
        ...baseInput,
        content: contentWithoutKeyword
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(result.keywordPlacements.length).toBeGreaterThan(0)
      
      result.keywordPlacements.forEach(placement => {
        expect(placement).toHaveProperty('keyword')
        expect(placement).toHaveProperty('placementType')
        expect(placement).toHaveProperty('currentPosition')
        expect(placement).toHaveProperty('recommendedPosition')
        expect(placement).toHaveProperty('urgency')
        expect(placement).toHaveProperty('example')
        
        expect(['title', 'first-paragraph', 'heading', 'body', 'conclusion']).toContain(placement.placementType)
        expect(['immediate', 'soon', 'optional']).toContain(placement.urgency)
        expect(typeof placement.example).toBe('string')
      })
    })

    it('should generate semantic enhancement recommendations', () => {
      const contentWithoutSemantics = 'This content only mentions SEO optimization but no related terms.'
      const input = {
        ...baseInput,
        content: contentWithoutSemantics,
        secondaryKeywords: ['search rankings', 'optimization techniques', 'keyword analysis', 'content strategy']
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(result.semanticEnhancements.length).toBeGreaterThan(0)
      
      result.semanticEnhancements.forEach(enhancement => {
        expect(enhancement).toHaveProperty('semanticKeyword')
        expect(enhancement).toHaveProperty('context')
        expect(enhancement).toHaveProperty('suggestedPlacement')
        expect(enhancement).toHaveProperty('relevanceScore')
        expect(enhancement).toHaveProperty('example')
        
        expect(typeof enhancement.relevanceScore).toBe('number')
        expect(enhancement.relevanceScore).toBeGreaterThanOrEqual(0)
        expect(enhancement.relevanceScore).toBeLessThanOrEqual(1)
      })
    })

    it('should generate content length recommendations', () => {
      const shortContent = 'Short content.'
      const input = {
        ...baseInput,
        content: shortContent,
        targetWordCount: 500
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(result.contentLengthRecommendations.length).toBeGreaterThan(0)
      
      result.contentLengthRecommendations.forEach(rec => {
        expect(rec).toHaveProperty('currentLength')
        expect(rec).toHaveProperty('targetLength')
        expect(rec).toHaveProperty('difference')
        expect(rec).toHaveProperty('suggestions')
        expect(rec).toHaveProperty('priority')
        
        expect(['expand', 'condense', 'maintain']).toContain(rec.priority)
        expect(Array.isArray(rec.suggestions)).toBe(true)
      })
    })

    it('should generate internal linking opportunities', () => {
      const contentWithLinkingOpportunities = 'Learn more about SEO optimization. Find out more about search rankings. Explore optimization techniques.'
      const input = {
        ...baseInput,
        content: contentWithLinkingOpportunities
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(Array.isArray(result.internalLinkingOpportunities)).toBe(true)
      
      result.internalLinkingOpportunities.forEach(opportunity => {
        expect(opportunity).toHaveProperty('opportunity')
        expect(opportunity).toHaveProperty('anchorText')
        expect(opportunity).toHaveProperty('context')
        expect(opportunity).toHaveProperty('relevanceScore')
        
        expect(typeof opportunity.relevanceScore).toBe('number')
        expect(opportunity.relevanceScore).toBeGreaterThanOrEqual(0)
        expect(opportunity.relevanceScore).toBeLessThanOrEqual(1)
      })
    })

    it('should generate call-to-action optimizations', () => {
      const input = {
        ...baseInput,
        searchIntent: 'transactional'
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(result.callToActionOptimizations.length).toBeGreaterThan(0)
      
      result.callToActionOptimizations.forEach(cta => {
        expect(cta).toHaveProperty('type')
        expect(cta).toHaveProperty('placement')
        expect(cta).toHaveProperty('text')
        expect(cta).toHaveProperty('purpose')
        expect(cta).toHaveProperty('urgency')
        
        expect(['primary', 'secondary', 'informational']).toContain(cta.type)
        expect(['end-of-section', 'mid-content', 'conclusion']).toContain(cta.placement)
        expect(typeof cta.urgency).toBe('number')
        expect(cta.urgency).toBeGreaterThanOrEqual(0)
        expect(cta.urgency).toBeLessThanOrEqual(1)
      })
    })

    it('should generate general recommendations', () => {
      const poorContent = 'Poor content with no structure and missing keywords.'
      const input = {
        ...baseInput,
        content: poorContent
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(result.recommendations.length).toBeGreaterThan(0)
      
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id')
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('category')
        expect(rec).toHaveProperty('title')
        expect(rec).toHaveProperty('description')
        expect(rec).toHaveProperty('action')
        expect(rec).toHaveProperty('impact')
        expect(rec).toHaveProperty('effort')
        expect(rec).toHaveProperty('timeframe')
        
        expect(['keyword', 'readability', 'structure', 'semantic', 'length', 'placement', 'intent']).toContain(rec.type)
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority)
        expect(['immediate', 'next-section', 'future']).toContain(rec.category)
        expect(['low', 'medium', 'high']).toContain(rec.effort)
        expect(['now', 'next-paragraph', 'next-section', 'revision']).toContain(rec.timeframe)
        expect(typeof rec.impact).toBe('number')
      })
    })

    it('should identify priority actions', () => {
      const contentWithIssues = 'Content with many issues that need immediate attention.'
      const input = {
        ...baseInput,
        content: contentWithIssues
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(Array.isArray(result.priorityActions)).toBe(true)
      expect(result.priorityActions.length).toBeGreaterThanOrEqual(0)
      
      result.priorityActions.forEach(action => {
        expect(typeof action).toBe('string')
        expect(action.length).toBeGreaterThan(0)
      })
    })

    it('should identify quick wins', () => {
      const input = {
        ...baseInput,
        content: 'Content with some easy fixes that can provide quick improvements.'
      }
      
      const result = generateRealTimeRecommendations(input)
      
      expect(Array.isArray(result.quickWins)).toBe(true)
      expect(result.quickWins.length).toBeGreaterThanOrEqual(0)
      
      result.quickWins.forEach(win => {
        expect(typeof win).toBe('string')
        expect(win.length).toBeGreaterThan(0)
      })
    })

    it('should handle different content types', () => {
      const contentTypes = ['introduction', 'h2', 'h3', 'conclusion', 'faq'] as const
      
      contentTypes.forEach(type => {
        const input = {
          ...baseInput,
          contentType: type
        }
        
        const result = generateRealTimeRecommendations(input)
        
        expect(typeof result.overallScore).toBe('number')
        expect(Array.isArray(result.recommendations)).toBe(true)
      })
    })

    it('should handle context information', () => {
      const context = {
        currentSection: 'introduction',
        totalSections: 5,
        sectionIndex: 0,
        wordCountSoFar: 50,
        targetTotalWordCount: 1000,
        keywordsUsed: ['SEO optimization'],
        keywordsRemaining: ['search rankings', 'optimization techniques']
      }
      
      const result = generateRealTimeRecommendations(baseInput, context)
      
      expect(typeof result.overallScore).toBe('number')
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('should calculate semantic relevance correctly', () => {
      const input = {
        ...baseInput,
        secondaryKeywords: ['SEO techniques', 'search engine optimization', 'ranking strategies']
      }
      
      const result = generateRealTimeRecommendations(input)
      
      result.semanticEnhancements.forEach(enhancement => {
        expect(enhancement.relevanceScore).toBeGreaterThanOrEqual(0)
        expect(enhancement.relevanceScore).toBeLessThanOrEqual(1)
      })
    })

    it('should perform within performance limits', () => {
      const startTime = performance.now()
      
      // Run multiple iterations to test performance
      for (let i = 0; i < 10; i++) {
        generateRealTimeRecommendations(baseInput)
      }
      
      const endTime = performance.now()
      const averageTime = (endTime - startTime) / 10
      
      // Should complete within 200ms per call (recommendation generation is complex)
      expect(averageTime).toBeLessThan(200)
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        { ...baseInput, content: '' },
        { ...baseInput, content: null as any },
        { ...baseInput, primaryKeyword: '' },
        { ...baseInput, secondaryKeywords: [] },
        { ...baseInput, targetWordCount: 0 }
      ]
      
      edgeCases.forEach(testCase => {
        expect(() => {
          const result = generateRealTimeRecommendations(testCase as any)
          expect(typeof result.overallScore).toBe('number')
          expect(Array.isArray(result.recommendations)).toBe(true)
        }).not.toThrow()
      })
    })
  })

  describe('Recommendation Quality', () => {
    it('should provide actionable recommendations', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      result.recommendations.forEach(rec => {
        expect(rec.action.length).toBeGreaterThan(10) // Should be descriptive
        expect(rec.description.length).toBeGreaterThan(5) // Should have meaningful description
      })
    })

    it('should prioritize recommendations correctly', () => {
      const contentWithManyIssues = 'Poor content with no structure, missing keywords, and bad readability.'
      const input = {
        ...baseInput,
        content: contentWithManyIssues
      }
      
      const result = generateRealTimeRecommendations(input)
      
      const criticalRecs = result.recommendations.filter(rec => rec.priority === 'critical')
      const highRecs = result.recommendations.filter(rec => rec.priority === 'high')
      
      // Should have some high-priority recommendations for poor content
      expect(criticalRecs.length + highRecs.length).toBeGreaterThan(0)
    })

    it('should categorize recommendations appropriately', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      const categories = result.recommendations.map(rec => rec.type)
      const uniqueCategories = [...new Set(categories)]
      
      expect(uniqueCategories.length).toBeGreaterThan(0)
      expect(uniqueCategories.every(cat => 
        ['keyword', 'readability', 'structure', 'semantic', 'length', 'placement', 'intent'].includes(cat)
      )).toBe(true)
    })

    it('should provide relevant examples', () => {
      const result = generateRealTimeRecommendations(baseInput)
      
      result.keywordPlacements.forEach(placement => {
        expect(placement.example.length).toBeGreaterThan(0)
        expect(placement.example).toContain(placement.keyword)
      })
      
      result.semanticEnhancements.forEach(enhancement => {
        expect(enhancement.example.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Context-Aware Recommendations', () => {
    it('should adapt recommendations based on content type', () => {
      const introInput = { ...baseInput, contentType: 'introduction' as const }
      const conclusionInput = { ...baseInput, contentType: 'conclusion' as const }
      
      const introResult = generateRealTimeRecommendations(introInput)
      const conclusionResult = generateRealTimeRecommendations(conclusionInput)
      
      expect(Array.isArray(introResult.recommendations)).toBe(true)
      expect(Array.isArray(conclusionResult.recommendations)).toBe(true)
      
      // Different content types should generate different recommendations
      const introRecTypes = introResult.recommendations.map(rec => rec.type)
      const conclusionRecTypes = conclusionResult.recommendations.map(rec => rec.type)
      
      // Should have some differences in recommendation types
      const differences = introRecTypes.filter(type => !conclusionRecTypes.includes(type))
      expect(differences.length + conclusionRecTypes.filter(type => !introRecTypes.includes(type)).length).toBeGreaterThan(0)
    })

    it('should consider search intent in recommendations', () => {
      const informationalInput = { ...baseInput, searchIntent: 'informational' }
      const transactionalInput = { ...baseInput, searchIntent: 'transactional' }
      
      const informationalResult = generateRealTimeRecommendations(informationalInput)
      const transactionalResult = generateRealTimeRecommendations(transactionalInput)
      
      expect(Array.isArray(informationalResult.callToActionOptimizations)).toBe(true)
      expect(Array.isArray(transactionalResult.callToActionOptimizations)).toBe(true)
      
      // Transactional intent should have different CTA recommendations
      const informationalCTAs = informationalResult.callToActionOptimizations.map(cta => cta.type)
      const transactionalCTAs = transactionalResult.callToActionOptimizations.map(cta => cta.type)
      
      expect(informationalCTAs.length).toBeGreaterThan(0)
      expect(transactionalCTAs.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        {},
        { content: null },
        { content: undefined },
        { primaryKeyword: null }
      ]
      
      malformedInputs.forEach(input => {
        expect(() => {
          const result = generateRealTimeRecommendations(input as any)
          expect(typeof result.overallScore).toBe('number')
          expect(Array.isArray(result.recommendations)).toBe(true)
        }).not.toThrow()
      })
    })

    it('should handle invalid arrays gracefully', () => {
      const invalidInputs = [
        { ...baseInput, secondaryKeywords: null as any },
        { ...baseInput, secondaryKeywords: 'not array' as any },
        { ...baseInput, secondaryKeywords: [null, undefined, ''] as any }
      ]
      
      invalidInputs.forEach(input => {
        expect(() => {
          const result = generateRealTimeRecommendations(input as any)
          expect(typeof result.overallScore).toBe('number')
          expect(Array.isArray(result.recommendations)).toBe(true)
        }).not.toThrow()
      })
    })
  })
})
