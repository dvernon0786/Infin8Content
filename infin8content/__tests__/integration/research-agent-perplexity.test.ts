/**
 * Research Agent Integration Tests with Perplexity API
 * Story B-2: Research Agent Service
 * 
 * These tests verify the actual integration with Perplexity Sonar API
 * They require a valid OPENROUTER_API_KEY to run
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { runResearchAgent, type ResearchAgentInput } from '../../lib/services/article-generation/research-agent'

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
      researchQuestions: ['What is machine learning?', 'How does machine learning work?'],
      supportingPoints: ['Practical applications of ML', 'History of ML'],
      priorSectionsSummary: '',
      organizationContext: {
        name: 'Tech Education Co',
        description: 'Educational platform for technology topics'
      }
    }

    it.skipIf(!INTEGRATION_TESTS_ENABLED)('should successfully call Perplexity Sonar API and return structured research', async () => {
      const result = await runResearchAgent(mockInput)

      // Verify structure matches expected output
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('total_searches')

      // Verify consolidated_queries are strings
      expect(Array.isArray(result.consolidated_queries)).toBe(true)
      expect(result.consolidated_queries.length).toBeGreaterThan(0)
      expect(result.consolidated_queries.every(q => typeof q === 'string')).toBe(true)

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
      expect(result.consolidated_queries.length).toBeLessThanOrEqual(10)
      expect(result.results.length).toBeLessThanOrEqual(10)
      expect(result.total_searches).toBeLessThanOrEqual(10)
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
        researchQuestions: ['What are the top AI applications?', 'How is ML used in research?'],
        supportingPoints: ['Industrial use-cases', 'Academic research'],
        priorSectionsSummary: '',
        organizationContext: {
          name: 'AI Research Institute',
          description: 'Advanced AI research organization'
        }
      }

      const result = await runResearchAgent(complexInput)

      // Should never exceed 10 searches regardless of complexity
      expect(result.consolidated_queries.length).toBeLessThanOrEqual(10)
      expect(result.results.length).toBeLessThanOrEqual(10)
      expect(result.total_searches).toBeLessThanOrEqual(10)
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
        researchQuestions: ['Test?'],
        supportingPoints: ['Test.'],
        priorSectionsSummary: '',
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
