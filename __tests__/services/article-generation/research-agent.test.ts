/**
 * Research Agent Service Tests
 * Story B-2: Research Agent Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  runResearchAgent,
  RESEARCH_AGENT_SYSTEM_PROMPT
} from '../../../lib/services/article-generation/research-agent'

// Mock OpenRouter client — both root wrapper AND infin8content path
vi.mock('../../../lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn()
}))
vi.mock('../../../infin8content/lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn()
}))

// Mock Tavily client — research-agent calls researchQuery internally
vi.mock('../../../infin8content/lib/services/tavily/tavily-client', () => ({
  researchQuery: vi.fn().mockResolvedValue([])
}))
vi.mock('../../../lib/services/tavily/tavily-client', () => ({
  researchQuery: vi.fn().mockResolvedValue([])
}))

import { generateContent } from '../../../infin8content/lib/services/openrouter/openrouter-client'
import { researchQuery as tavilyResearchQuery } from '../../../infin8content/lib/services/tavily/tavily-client'

const emptyTavilySource: never[] = []

describe('Research Agent Service', () => {
  beforeEach(() => {
    // resetAllMocks clears call history AND implementations
    vi.resetAllMocks()
    // Default: Tavily returns no sources (safe for most tests)
    vi.mocked(tavilyResearchQuery).mockResolvedValue(emptyTavilySource)
  })

  // Real input shape as required by ResearchAgentInput
  const mockInput = {
    sectionHeader: 'Introduction to AI',
    sectionType: 'introduction',
    researchQuestions: ['What is AI?', 'How does machine learning work?'],
    supportingPoints: ['AI is transforming industries'],
    priorSectionsSummary: 'Overview of the technology landscape.',
    organizationContext: {
      name: 'Tech Corp',
      description: 'AI technology company'
    }
  }

  // LLM response matching ResearchOutputSchema
  const mockLlmResponse = {
    research_questions: ['What is AI?'],
    consolidated_queries: ['AI definition'],
    research_results: [
      {
        query: 'What is AI?',
        answer: 'Artificial Intelligence...',
        citations: ['Tech Journal, 2024, AI Overview (https://example.com)'],
        source_urls: ['https://example.com'],
        source_types_found: ['academic']
      }
    ],
    total_searches: 1
  }

  it('uses the canonical system prompt and returns normalized output', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      content: JSON.stringify(mockLlmResponse)
    } as any)

    const result = await runResearchAgent(mockInput)
    // Should send system prompt as first message
    const call = vi.mocked(generateContent).mock.calls[0]
    expect(call[0][0].role).toBe('system')
    expect(call[0][0].content).toBe(RESEARCH_AGENT_SYSTEM_PROMPT)

    // Should map research_questions -> queries
    expect(result.queries).toEqual(['What is AI?'])
    expect(result.total_searches).toBe(1)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].query).toBe('What is AI?')
  })

  it('caps Tavily queries at top 3 research questions', async () => {
    // Return a proper source to prevent the empty-fallback branch
    vi.mocked(tavilyResearchQuery).mockResolvedValue([{
      title: 'AI Overview',
      url: 'https://example.com',
      excerpt: 'AI content',
      published_date: '2024-01-01',
      author: null,
      relevance_score: 0.9
    }])
    vi.mocked(generateContent).mockResolvedValue({
      content: JSON.stringify({
        ...mockLlmResponse,
        research_questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
        research_results: Array(5).fill(mockLlmResponse.research_results[0])
      })
    } as any)

    await runResearchAgent({
      ...mockInput,
      researchQuestions: ['q1', 'q2', 'q3', 'q4', 'q5']
    })

    // fetchGroundingSources slices to top 3 questions — so at most 3 Tavily calls
    expect(vi.mocked(tavilyResearchQuery).mock.calls.length).toBeLessThanOrEqual(3)
  })

  it('throws on unparseable LLM response', async () => {
    vi.mocked(generateContent).mockResolvedValue({ content: 'not-json' } as any)

    await expect(runResearchAgent(mockInput)).rejects.toThrow(
      'Research synthesis failed'
    )
  })

  it('returns research_timestamp in ISO format', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      content: JSON.stringify(mockLlmResponse)
    } as any)

    const result = await runResearchAgent(mockInput)

    expect(result.research_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
