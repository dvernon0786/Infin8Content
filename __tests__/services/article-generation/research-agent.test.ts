/**
 * Research Agent Service Tests
 * Story B-2: Research Agent Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  runResearchAgent,
  RESEARCH_AGENT_SYSTEM_PROMPT
} from '../../../lib/services/article-generation/research-agent'

// Mock OpenRouter client
vi.mock('../../../lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn()
}))

import { generateContent } from '../../../lib/services/openrouter/openrouter-client'

describe('Research Agent Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockInput = {
    sectionHeader: 'Introduction to AI',
    sectionType: 'introduction',
    priorSections: [
      {
        id: '1',
        article_id: 'article-1',
        section_order: 1,
        section_header: 'Overview',
        section_type: 'body',
        planner_payload: {
          section_header: 'Overview',
          section_type: 'body',
          instructions: 'Provide overview',
          context_requirements: [],
          estimated_words: 200
        },
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ],
    organizationContext: {
      name: 'Tech Corp',
      description: 'AI technology company',
      website: 'https://techcorp.com',
      industry: 'technology'
    }
  }

  it('uses the canonical system prompt and returns normalized output', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      content: JSON.stringify({
        queries: ['What is AI?'],
        results: [
          {
            query: 'What is AI?',
            answer: 'Artificial Intelligence...',
            citations: ['https://example.com']
          }
        ],
        total_searches: 1
      })
    })

    const result = await runResearchAgent(mockInput as any)

    const call = vi.mocked(generateContent).mock.calls[0]

    expect(call[0][0].role).toBe('system')
    expect(call[0][0].content).toBe(RESEARCH_AGENT_SYSTEM_PROMPT)

    expect(result.totalSearches).toBe(1)
  })

  it('enforces the 10-search limit', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      content: JSON.stringify({
        queries: Array(15).fill('q'),
        results: [],
        total_searches: 15
      })
    })

    const result = await runResearchAgent(mockInput as any)

    expect(result.queries).toHaveLength(10)
    expect(result.totalSearches).toBe(10)
  })

  it('fails fast on malformed JSON', async () => {
    vi.mocked(generateContent).mockResolvedValue({
      content: 'not-json'
    })

    await expect(runResearchAgent(mockInput as any)).rejects.toThrow(
      'Invalid JSON response'
    )
  })

  it(
    'times out within 30 seconds',
    async () => {
      vi.mocked(generateContent).mockImplementation(
        () => new Promise(() => {})
      )

      const start = Date.now()

      await expect(runResearchAgent(mockInput as any)).rejects.toThrow('timeout')

      expect(Date.now() - start).toBeLessThan(32000)
    },
    35000
  )
})
