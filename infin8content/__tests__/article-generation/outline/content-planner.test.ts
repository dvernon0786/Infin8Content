/**
 * Unit tests for content-planner-agent (Phase 4)
 *
 * Covers the PlannerSchema transform introduced in recent commits:
 *  - FORBIDDEN_HEADER_PREFIXES regex patterns are applied during schema parsing
 *  - Headers starting with forbidden prefixes are stripped deterministically
 *  - An empty post-strip header falls back to the literal 'Section'
 *  - Headers that don't match any pattern are left unchanged
 */

import { describe, it, expect } from 'vitest'
import { PlannerSchema } from '@/lib/services/article-generation/content-planner-agent'

// Minimal valid section factory
function makeSection(header: string) {
  return {
    section_type: 'h2' as const,
    header,
    supporting_points: ['Point A', 'Point B'],
    research_questions: ['Question 1?', 'Question 2?'],
    supporting_elements: 'statistics',
    estimated_words: 200,
  }
}

// Minimal valid plan factory
function makePlan(headers: string[]) {
  return {
    article_title: 'Test Article Title',
    content_style: 'informative' as const,
    target_keyword: 'test keyword',
    semantic_keywords: ['kw1', 'kw2', 'kw3', 'kw4', 'kw5'],
    article_structure: headers.map(makeSection),
    total_estimated_words: 2000,
  }
}

describe('PlannerSchema – header sanitization (FORBIDDEN_HEADER_PREFIXES)', () => {
  it('strips "How to " prefix (case-insensitive)', () => {
    const result = PlannerSchema.parse(makePlan(['How to Build a Better Team']))
    expect(result.article_structure[0].header).toBe('Build a Better Team')
  })

  it('strips "How To " prefix (mixed case)', () => {
    // "How To Build..." → after stripping "How To " → "Build a Better Pipeline"
    // (using a word that isn't itself a forbidden prefix)
    const result = PlannerSchema.parse(makePlan(['How To Build a Better Pipeline']))
    expect(result.article_structure[0].header).toBe('Build a Better Pipeline')
  })

  it('strips "How do " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['How do Businesses Scale']))
    expect(result.article_structure[0].header).toBe('Businesses Scale')
  })

  it('strips "How to use " prefix before "How to " pattern', () => {
    const result = PlannerSchema.parse(makePlan(['How to use Automation Tools']))
    expect(result.article_structure[0].header).toBe('Automation Tools')
  })

  it('strips "What is " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['What is DevOps']))
    expect(result.article_structure[0].header).toBe('DevOps')
  })

  it('strips "What are " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['What are the Key Benefits']))
    expect(result.article_structure[0].header).toBe('the Key Benefits')
  })

  it('strips "Why " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['Why Teams Fail']))
    expect(result.article_structure[0].header).toBe('Teams Fail')
  })

  it('strips "Choose " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['Choose the Right Platform']))
    expect(result.article_structure[0].header).toBe('the Right Platform')
  })

  it('strips "Find " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['Find the Best Solution']))
    expect(result.article_structure[0].header).toBe('the Best Solution')
  })

  it('strips "Use " prefix', () => {
    const result = PlannerSchema.parse(makePlan(['Use Automation to Save Time']))
    expect(result.article_structure[0].header).toBe('Automation to Save Time')
  })

  it('leaves a clean declarative header unchanged', () => {
    const result = PlannerSchema.parse(makePlan(['Key Benefits of Remote Work']))
    expect(result.article_structure[0].header).toBe('Key Benefits of Remote Work')
  })

  it('falls back to "Section" when stripping empties the header', () => {
    // "How to " with trailing whitespace and nothing else — strip leaves an empty string
    const result = PlannerSchema.parse(makePlan(['How to ']))
    expect(result.article_structure[0].header).toBe('Section')
  })

  it('sanitizes multiple sections independently', () => {
    const result = PlannerSchema.parse(
      makePlan([
        'How to Get Started',
        'Key Advantages',
        'What is the Process',
      ])
    )
    expect(result.article_structure[0].header).toBe('Get Started')
    expect(result.article_structure[1].header).toBe('Key Advantages')
    expect(result.article_structure[2].header).toBe('the Process')
  })

  it('preserves all non-header fields after sanitization', () => {
    const result = PlannerSchema.parse(makePlan(['How to Implement CI/CD']))
    const section = result.article_structure[0]
    expect(section.section_type).toBe('h2')
    expect(section.supporting_points).toEqual(['Point A', 'Point B'])
    expect(section.research_questions).toEqual(['Question 1?', 'Question 2?'])
    expect(section.estimated_words).toBe(200)
  })

  it('preserves top-level plan fields after transform', () => {
    const result = PlannerSchema.parse(makePlan(['Good Header']))
    expect(result.article_title).toBe('Test Article Title')
    expect(result.content_style).toBe('informative')
    expect(result.target_keyword).toBe('test keyword')
    expect(result.semantic_keywords).toHaveLength(5)
    expect(result.total_estimated_words).toBe(2000)
  })
})
