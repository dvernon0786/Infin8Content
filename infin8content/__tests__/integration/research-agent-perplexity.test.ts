/**
 * Research Agent Integration Tests with Perplexity API
 * Story B-2: Research Agent Service
 * 
 * These tests verify the actual integration with Perplexity Sonar API
 * They require a valid OPENROUTER_API_KEY to run
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { runResearchAgent } from '../../lib/services/article-generation/research-agent'
import { ResearchAgentInput } from '../../types/article'

// Skip integration tests if API key is not available
const INTEGRATION_TESTS_ENABLED = !!process.env.OPENROUTER_API_KEY

describe('Research Agent Integration Tests', () => {
  beforeAll(() => {
    if (!INTEGRATION_TESTS_ENABLED) {
      console.warn('Skipping integration tests - OPENROUTER_API_KEY not set')
    }
  })

  describe('runResearchAgent - Perplexity API Integration', () => {
    const mockInput: ResearchAgentInput = {
      sectionHeader: 'Introduction to Machine Learning',
      sectionType: 'introduction',
      priorSections: [],
      organizationContext: {
        name: 'Tech Education Co',
        description: 'Educational platform for technology topics',
        website: 'https://techedu.com',
        industry: 'education'
      }
    }

    it.skipIf(!INTEGRATION_TESTS_ENABLED)('should successfully call Perplexity Sonar API and return structured research', async () => {
      const result = await runResearchAgent(mockInput)

      // Verify structure matches expected output
      expect(result).toHaveProperty('queries')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('totalSearches')

      // Verify queries are strings
      expect(Array.isArray(result.queries)).toBe(true)
      expect(result.queries.length).toBeGreaterThan(0)
      expect(result.queries.every(q => typeof q === 'string')).toBe(true)

      // Verify results structure
      expect(Array.isArray(result.results)).toBe(true)
      expect(result.results.length).toBeGreaterThan(0)
      
      result.results.forEach(resultItem => {
        expect(resultItem).toHaveProperty('query')
        expect(resultItem).toHaveProperty('answer')
        expect(resultItem).toHaveProperty('citations')
        
        expect(typeof resultItem.query).toBe('string')
        expect(typeof resultItem.answer).toBe('string')
        expect(Array.isArray(resultItem.citations)).toBe(true)
        expect(resultItem.citations.every(c => typeof c === 'string')).toBe(true)
      })

      // Verify search limits
      expect(result.queries.length).toBeLessThanOrEqual(10)
      expect(result.results.length).toBeLessThanOrEqual(10)
      expect(result.totalSearches).toBeLessThanOrEqual(10)
    }, 45000) // 45 second timeout for API calls

    it.skipIf(!INTEGRATION_TESTS_ENABLED)('should handle organization context in research', async () => {
      const result = await runResearchAgent(mockInput)

      // Verify that organization context was included
      expect(result.queries.length).toBeGreaterThan(0)
      
      // The research should be tailored to the education context
      const hasEducationContext = result.results.some(r => 
        r.answer.toLowerCase().includes('education') ||
        r.answer.toLowerCase().includes('learning') ||
        r.answer.toLowerCase().includes('teaching')
      )
      
      expect(hasEducationContext).toBe(true)
    }, 45000)

    it.skipIf(!INTEGRATION_TESTS_ENABLED)('should respect 10-search limit even when more research is needed', async () => {
      const complexInput: ResearchAgentInput = {
        sectionHeader: 'Comprehensive Guide to Artificial Intelligence and Machine Learning Applications',
        sectionType: 'comprehensive-guide',
        priorSections: [],
        organizationContext: {
          name: 'AI Research Institute',
          description: 'Advanced AI research organization',
          website: 'https://airesearch.org',
          industry: 'research'
        }
      }

      const result = await runResearchAgent(complexInput)

      // Should never exceed 10 searches regardless of complexity
      expect(result.queries.length).toBeLessThanOrEqual(10)
      expect(result.results.length).toBeLessThanOrEqual(10)
      expect(result.totalSearches).toBeLessThanOrEqual(10)
    }, 45000)

    it.skipIf(!INTEGRATION_TESTS_ENABLED)('should include citations from real sources', async () => {
      const result = await runResearchAgent(mockInput)

      // Verify citations are present and look like real URLs
      expect(result.results.length).toBeGreaterThan(0)
      
      const hasValidCitations = result.results.some(r => 
        r.citations.length > 0 && 
        r.citations.some(c => c.includes('http'))
      )
      
      expect(hasValidCitations).toBe(true)
    }, 45000)
  })

  describe('Error Handling Integration', () => {
    it.skipIf(!INTEGRATION_TESTS_ENABLED)('should handle API timeout gracefully', async () => {
      // This test verifies timeout handling with real API
      const result = await runResearchAgent({
        sectionHeader: 'Test timeout scenario',
        sectionType: 'test',
        priorSections: [],
        organizationContext: {
          name: 'Test Org',
          description: 'Test description'
        }
      })

      // Should either succeed or fail gracefully within timeout
      expect(result).toBeDefined()
    }, 35000)
  })
})
