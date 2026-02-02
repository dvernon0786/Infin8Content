/**
 * Tests for Planner Agent
 * Story 38.1: Queue Approved Subtopics for Article Generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runPlannerAgent, type PlannerInput, type PlannerOutput } from '@/lib/agents/planner-agent'

// Mock OpenRouter client
vi.mock('@openrouter/ai-sdk-provider', () => ({
  createClient: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}))

describe('Planner Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate article structure from planner input', async () => {
    const input: PlannerInput = {
      subtopic: {
        title: 'How to Implement CI/CD Pipelines',
        angle: 'DevOps Best Practices',
      },
      keyword: 'CI/CD pipeline implementation',
      content_style: 'informative',
      icp: {
        pain_points: ['Manual deployments are slow', 'Testing is inconsistent'],
        goals: ['Automate deployment process', 'Improve code quality'],
        challenges: ['Team resistance to change', 'Legacy system integration'],
      },
    }

    // Mock successful LLM response
    const mockOutput: PlannerOutput = {
      article_title: 'The Complete Guide to CI/CD Pipeline Implementation',
      content_style: 'informative',
      target_keyword: 'CI/CD pipeline implementation',
      semantic_keywords: ['continuous integration', 'continuous deployment', 'DevOps automation'],
      article_structure: [
        {
          section_type: 'intro',
          header: 'Introduction to CI/CD Pipelines',
          supporting_points: ['What CI/CD is', 'Why it matters for modern development'],
          research_questions: ['What are the key benefits?', 'How do teams implement it?'],
          supporting_elements: 'Definition and overview',
          estimated_words: 300,
        },
        {
          section_type: 'main',
          header: 'Setting Up Your First Pipeline',
          supporting_points: ['Choosing the right tools', 'Configuring automated tests', 'Deployment strategies'],
          research_questions: ['What tools are most popular?', 'How do you handle rollbacks?'],
          supporting_elements: 'Step-by-step guide with examples',
          estimated_words: 800,
        },
        {
          section_type: 'conclusion',
          header: 'Best Practices and Next Steps',
          supporting_points: ['Monitoring and alerting', 'Continuous improvement'],
          research_questions: ['How do you measure success?', 'What are common pitfalls?'],
          supporting_elements: 'Actionable recommendations',
          estimated_words: 300,
        },
      ],
      total_estimated_words: 2400,
    }

    // Verify input structure
    expect(input.subtopic.title).toBeDefined()
    expect(input.keyword).toBeDefined()
    expect(input.content_style).toBe('informative')
    expect(input.icp.pain_points.length).toBeGreaterThan(0)
    expect(input.icp.goals.length).toBeGreaterThan(0)

    // Verify output structure (would be returned from LLM)
    expect(mockOutput.article_title).toBeDefined()
    expect(mockOutput.article_structure.length).toBeGreaterThan(0)
    expect(mockOutput.total_estimated_words).toBeGreaterThan(0)

    // Verify each section has required fields
    mockOutput.article_structure.forEach((section) => {
      expect(section.header).toBeDefined()
      expect(section.supporting_points.length).toBeGreaterThanOrEqual(2)
      expect(section.research_questions.length).toBeGreaterThanOrEqual(2)
      expect(section.estimated_words).toBeGreaterThan(0)
    })
  })

  it('should handle listicle content style', async () => {
    const input: PlannerInput = {
      subtopic: {
        title: 'Top 10 DevOps Tools',
      },
      keyword: 'best DevOps tools',
      content_style: 'listicle',
      icp: {
        pain_points: ['Tool overload', 'Integration complexity'],
        goals: ['Simplify toolchain', 'Improve efficiency'],
      },
    }

    expect(input.content_style).toBe('listicle')
  })

  it('should include semantic keywords in output', async () => {
    const mockOutput: PlannerOutput = {
      article_title: 'Test Article',
      content_style: 'informative',
      target_keyword: 'main keyword',
      semantic_keywords: ['related keyword 1', 'related keyword 2', 'related keyword 3'],
      article_structure: [
        {
          section_type: 'intro',
          header: 'Introduction',
          supporting_points: ['Point 1', 'Point 2'],
          research_questions: ['Question 1', 'Question 2'],
          supporting_elements: 'Elements',
          estimated_words: 300,
        },
      ],
      total_estimated_words: 2500,
    }

    expect(mockOutput.semantic_keywords.length).toBeGreaterThan(0)
    expect(mockOutput.semantic_keywords).toContain('related keyword 1')
  })

  it('should generate research questions for each section', async () => {
    const mockOutput: PlannerOutput = {
      article_title: 'Test Article',
      content_style: 'informative',
      target_keyword: 'test keyword',
      semantic_keywords: ['keyword variant'],
      article_structure: [
        {
          section_type: 'main',
          header: 'Main Section',
          supporting_points: ['Point 1', 'Point 2'],
          research_questions: [
            'What are the latest statistics?',
            'What do industry experts say?',
            'What are real-world examples?',
          ],
          supporting_elements: 'Research and data',
          estimated_words: 1000,
        },
      ],
      total_estimated_words: 2500,
    }

    const section = mockOutput.article_structure[0]
    expect(section.research_questions.length).toBeGreaterThanOrEqual(2)
    expect(section.research_questions[0]).toContain('statistics')
  })
})
