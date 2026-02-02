/**
 * Planner Compiler Service
 * Story 38.1: Queue Approved Subtopics for Article Generation
 * 
 * Converts probabilistic planner output into deterministic execution plan.
 * Validates, normalizes, and injects execution metadata (section_id, section_order).
 * 
 * CRITICAL: Compiler may inject execution metadata only; must never alter semantic content.
 */

import { randomUUID } from 'crypto'
import type { PlannerOutput } from './planner-agent'

/**
 * Compiled planner output with execution metadata injected
 */
export interface CompiledPlannerOutput {
  article_title: string
  content_style: 'informative' | 'listicle'
  target_keyword: string
  semantic_keywords: string[]
  article_structure: Array<{
    section_id: string // UUID, injected by compiler
    section_order: number // 0-indexed, stable, sequential, injected by compiler
    section_type: 'intro' | 'main' | 'section' | 'conclusion'
    header: string
    supporting_points: string[]
    research_questions: string[]
    supporting_elements: string
    estimated_words: number
  }>
  total_estimated_words: number
}

/**
 * Validation error details
 */
interface ValidationError {
  sectionIndex: number
  sectionHeader: string
  issues: string[]
}

/**
 * Validate planner output against schema and business rules
 * 
 * Rules:
 * - ≥ 2 research_questions per section
 * - ≥ 2 supporting_points per section
 * - total_estimated_words between 2000–4000
 * - All required fields present
 * 
 * @param output - Raw planner output to validate
 * @throws Error if validation fails
 */
function validatePlannerOutput(output: PlannerOutput): void {
  const errors: ValidationError[] = []

  // Validate required fields
  if (!output.article_title || typeof output.article_title !== 'string') {
    throw new Error('Missing or invalid article_title')
  }

  if (!output.content_style || !['informative', 'listicle'].includes(output.content_style)) {
    throw new Error('Missing or invalid content_style')
  }

  if (!output.target_keyword || typeof output.target_keyword !== 'string') {
    throw new Error('Missing or invalid target_keyword')
  }

  if (!Array.isArray(output.semantic_keywords) || output.semantic_keywords.length === 0) {
    throw new Error('Missing or empty semantic_keywords array')
  }

  if (!Array.isArray(output.article_structure) || output.article_structure.length === 0) {
    throw new Error('Missing or empty article_structure array')
  }

  if (typeof output.total_estimated_words !== 'number' || output.total_estimated_words <= 0) {
    throw new Error('Missing or invalid total_estimated_words')
  }

  // Validate word count range (2000-4000)
  if (output.total_estimated_words < 2000 || output.total_estimated_words > 4000) {
    throw new Error(
      `Invalid total_estimated_words: ${output.total_estimated_words}. Must be between 2000-4000.`
    )
  }

  // Validate each section
  output.article_structure.forEach((section, index) => {
    const sectionErrors: string[] = []

    // Validate required fields
    if (!section.header || typeof section.header !== 'string') {
      sectionErrors.push('Missing or invalid header')
    }

    if (!Array.isArray(section.supporting_points)) {
      sectionErrors.push('Missing or invalid supporting_points array')
    } else if (section.supporting_points.length < 2) {
      sectionErrors.push(
        `Insufficient supporting_points: ${section.supporting_points.length}. Minimum 2 required.`
      )
    }

    if (!Array.isArray(section.research_questions)) {
      sectionErrors.push('Missing or invalid research_questions array')
    } else if (section.research_questions.length < 2) {
      sectionErrors.push(
        `Insufficient research_questions: ${section.research_questions.length}. Minimum 2 required.`
      )
    }

    if (typeof section.estimated_words !== 'number' || section.estimated_words <= 0) {
      sectionErrors.push('Missing or invalid estimated_words')
    }

    if (sectionErrors.length > 0) {
      errors.push({
        sectionIndex: index,
        sectionHeader: section.header || `Section ${index}`,
        issues: sectionErrors,
      })
    }
  })

  // Throw if any validation errors
  if (errors.length > 0) {
    const errorDetails = errors
      .map(
        (e) =>
          `Section ${e.sectionIndex} (${e.sectionHeader}): ${e.issues.join('; ')}`
      )
      .join('\n')
    throw new Error(`Planner output validation failed:\n${errorDetails}`)
  }
}

/**
 * Compile planner output
 * 
 * Validates output, injects execution metadata (section_id, section_order),
 * and returns compiled output ready for Research Agent.
 * 
 * CRITICAL: Never alters semantic content (headers, research questions, supporting points, word counts).
 * 
 * @param output - Raw planner output from Planner Agent
 * @returns Compiled planner output with execution metadata
 * @throws Error if validation fails
 */
export function compilePlannerOutput(output: PlannerOutput): CompiledPlannerOutput {
  // Validate output first (throws if invalid)
  validatePlannerOutput(output)

  // Inject execution metadata
  const compiledStructure = output.article_structure.map((section, index) => ({
    section_id: randomUUID(), // Inject UUID
    section_order: index, // Inject 0-indexed order
    section_type: section.section_type,
    header: section.header,
    supporting_points: section.supporting_points,
    research_questions: section.research_questions,
    supporting_elements: section.supporting_elements,
    estimated_words: section.estimated_words,
  }))

  const compiled: CompiledPlannerOutput = {
    article_title: output.article_title,
    content_style: output.content_style,
    target_keyword: output.target_keyword,
    semantic_keywords: output.semantic_keywords,
    article_structure: compiledStructure,
    total_estimated_words: output.total_estimated_words,
  }

  console.log('[PlannerCompiler] Successfully compiled planner output', {
    title: compiled.article_title,
    sections: compiled.article_structure.length,
    totalWords: compiled.total_estimated_words,
  })

  return compiled
}
