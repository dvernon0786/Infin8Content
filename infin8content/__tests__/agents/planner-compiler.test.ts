/**
 * Tests for Planner Compiler
 * Story 38.1: Queue Approved Subtopics for Article Generation
 */

import { describe, it, expect } from 'vitest'
import { compilePlannerOutput, type CompiledPlannerOutput } from '@/lib/agents/planner-compiler'
import type { PlannerOutput } from '@/lib/agents/planner-agent'

describe('Planner Compiler', () => {
  it('should validate and compile valid planner output', () => {
    const validOutput: PlannerOutput = {
      article_title: 'Test Article',
      content_style: 'informative',
      target_keyword: 'test keyword',
      semantic_keywords: ['keyword 1', 'keyword 2'],
      article_structure: [
        {
          section_type: 'intro',
          header: 'Introduction',
          supporting_points: ['Point 1', 'Point 2'],
          research_questions: ['Question 1', 'Question 2'],
          supporting_elements: 'Elements',
          estimated_words: 300,
        },
        {
          section_type: 'main',
          header: 'Main Section',
          supporting_points: ['Point 1', 'Point 2', 'Point 3'],
          research_questions: ['Question 1', 'Question 2'],
          supporting_elements: 'Elements',
          estimated_words: 1500,
        },
        {
          section_type: 'conclusion',
          header: 'Conclusion',
          supporting_points: ['Point 1', 'Point 2'],
          research_questions: ['Question 1', 'Question 2'],
          supporting_elements: 'Elements',
          estimated_words: 200,
        },
      ],
      total_estimated_words: 2000,
    }

    const compiled = compilePlannerOutput(validOutput)

    expect(compiled).toBeDefined()
    expect(compiled.article_title).toBe(validOutput.article_title)
    expect(compiled.article_structure.length).toBe(3)
  })

  it('should inject section_id and section_order', () => {
    const output: PlannerOutput = {
      article_title: 'Test',
      content_style: 'informative',
      target_keyword: 'test',
      semantic_keywords: ['test'],
      article_structure: [
        {
          section_type: 'intro',
          header: 'Intro',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 300,
        },
        {
          section_type: 'main',
          header: 'Main',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 1500,
        },
        {
          section_type: 'conclusion',
          header: 'Conclusion',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 200,
        },
      ],
      total_estimated_words: 2000,
    }

    const compiled = compilePlannerOutput(output)

    // Verify section_id is injected (UUID format)
    compiled.article_structure.forEach((section) => {
      expect(section.section_id).toBeDefined()
      expect(section.section_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    // Verify section_order is injected (0-indexed, sequential)
    expect(compiled.article_structure[0].section_order).toBe(0)
    expect(compiled.article_structure[1].section_order).toBe(1)
    expect(compiled.article_structure[2].section_order).toBe(2)
  })

  it('should reject output with insufficient research questions', () => {
    const invalidOutput: PlannerOutput = {
      article_title: 'Test',
      content_style: 'informative',
      target_keyword: 'test',
      semantic_keywords: ['test'],
      article_structure: [
        {
          section_type: 'main',
          header: 'Main',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1'], // Only 1, needs 2+
          supporting_elements: 'E',
          estimated_words: 1500,
        },
      ],
      total_estimated_words: 2500,
    }

    expect(() => compilePlannerOutput(invalidOutput)).toThrow(
      /Insufficient research_questions/
    )
  })

  it('should reject output with insufficient supporting points', () => {
    const invalidOutput: PlannerOutput = {
      article_title: 'Test',
      content_style: 'informative',
      target_keyword: 'test',
      semantic_keywords: ['test'],
      article_structure: [
        {
          section_type: 'main',
          header: 'Main',
          supporting_points: ['P1'], // Only 1, needs 2+
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 1500,
        },
      ],
      total_estimated_words: 2500,
    }

    expect(() => compilePlannerOutput(invalidOutput)).toThrow(
      /Insufficient supporting_points/
    )
  })

  it('should reject output with word count below 2000', () => {
    const invalidOutput: PlannerOutput = {
      article_title: 'Test',
      content_style: 'informative',
      target_keyword: 'test',
      semantic_keywords: ['test'],
      article_structure: [
        {
          section_type: 'main',
          header: 'Main',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 1500,
        },
      ],
      total_estimated_words: 1500, // Below 2000
    }

    expect(() => compilePlannerOutput(invalidOutput)).toThrow(
      /Must be between 2000-4000/
    )
  })

  it('should reject output with word count above 4000', () => {
    const invalidOutput: PlannerOutput = {
      article_title: 'Test',
      content_style: 'informative',
      target_keyword: 'test',
      semantic_keywords: ['test'],
      article_structure: [
        {
          section_type: 'main',
          header: 'Main',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 5000,
        },
      ],
      total_estimated_words: 5000, // Above 4000
    }

    expect(() => compilePlannerOutput(invalidOutput)).toThrow(
      /Must be between 2000-4000/
    )
  })

  it('should preserve semantic content during compilation', () => {
    const output: PlannerOutput = {
      article_title: 'Original Title',
      content_style: 'informative',
      target_keyword: 'original keyword',
      semantic_keywords: ['keyword 1', 'keyword 2'],
      article_structure: [
        {
          section_type: 'main',
          header: 'Original Header',
          supporting_points: ['Original Point 1', 'Original Point 2'],
          research_questions: ['Original Question 1', 'Original Question 2'],
          supporting_elements: 'Original Elements',
          estimated_words: 2500,
        },
      ],
      total_estimated_words: 2500,
    }

    const compiled = compilePlannerOutput(output)

    // Verify semantic content is unchanged
    expect(compiled.article_title).toBe('Original Title')
    expect(compiled.target_keyword).toBe('original keyword')
    expect(compiled.article_structure[0].header).toBe('Original Header')
    expect(compiled.article_structure[0].supporting_points).toEqual([
      'Original Point 1',
      'Original Point 2',
    ])
    expect(compiled.article_structure[0].research_questions).toEqual([
      'Original Question 1',
      'Original Question 2',
    ])
    expect(compiled.article_structure[0].estimated_words).toBe(2500)
  })

  it('should handle listicle content style', () => {
    const output: PlannerOutput = {
      article_title: 'Top 10 Tips',
      content_style: 'listicle',
      target_keyword: 'tips',
      semantic_keywords: ['tips', 'guide'],
      article_structure: [
        {
          section_type: 'intro',
          header: 'Introduction',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 300,
        },
        {
          section_type: 'main',
          header: 'Tip 1',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 1500,
        },
        {
          section_type: 'conclusion',
          header: 'Conclusion',
          supporting_points: ['P1', 'P2'],
          research_questions: ['Q1', 'Q2'],
          supporting_elements: 'E',
          estimated_words: 200,
        },
      ],
      total_estimated_words: 2000,
    }

    const compiled = compilePlannerOutput(output)

    expect(compiled.content_style).toBe('listicle')
    expect(compiled.article_structure.length).toBe(3)
  })
})
