/**
 * TypeScript type tests for article_sections data model
 * Story B-1: Article Sections Data Model
 */

import { describe, it, expect } from 'vitest'
import type {
  SectionStatus,
  PlannerPayload,
  ResearchPayload,
  ArticleSection,
  CreateArticleSectionParams,
  UpdateArticleSectionParams
} from '../../types/article'

describe('Article Sections Type Definitions', () => {
  describe('SectionStatus Type', () => {
    it('should have correct status values', () => {
      const validStatuses: SectionStatus[] = [
        'pending',
        'researching',
        'researched',
        'writing',
        'completed',
        'failed'
      ]
      
      expect(validStatuses).toHaveLength(6)
      expect(validStatuses).toContain('pending')
      expect(validStatuses).toContain('researching')
      expect(validStatuses).toContain('researched')
      expect(validStatuses).toContain('writing')
      expect(validStatuses).toContain('completed')
      expect(validStatuses).toContain('failed')
    })
  })

  describe('PlannerPayload Interface', () => {
    it('should accept valid planner payload', () => {
      const plannerPayload: PlannerPayload = {
        section_header: 'Introduction',
        section_type: 'body',
        instructions: 'Write an engaging introduction',
        context_requirements: ['research', 'examples'],
        estimated_words: 300
      }
      
      expect(plannerPayload.section_header).toBe('Introduction')
      expect(plannerPayload.section_type).toBe('body')
      expect(plannerPayload.instructions).toBe('Write an engaging introduction')
      expect(plannerPayload.context_requirements).toEqual(['research', 'examples'])
      expect(plannerPayload.estimated_words).toBe(300)
    })

    it('should enforce required fields', () => {
      // This should fail compilation if uncommented
      // const invalidPlanner: PlannerPayload = {} // Missing required fields
      
      const validPlanner: PlannerPayload = {
        section_header: 'Test',
        section_type: 'body',
        instructions: 'Test instructions',
        context_requirements: [],
        estimated_words: 100
      }
      
      expect(validPlanner.section_header).toBe('Test')
    })
  })

  describe('ResearchPayload Interface', () => {
    it('should accept valid research payload', () => {
      const researchPayload: ResearchPayload = {
        queries: ['topic research', 'statistics'],
        results: [
          {
            query: 'topic research',
            answer: 'Research findings',
            citations: ['source1', 'source2']
          }
        ],
        total_searches: 2,
        research_timestamp: '2026-02-05T10:00:00Z'
      }
      
      expect(researchPayload.queries).toEqual(['topic research', 'statistics'])
      expect(researchPayload.results).toHaveLength(1)
      expect(researchPayload.total_searches).toBe(2)
      expect(researchPayload.research_timestamp).toBe('2026-02-05T10:00:00Z')
    })

    it('should handle empty results', () => {
      const researchPayload: ResearchPayload = {
        queries: ['test query'],
        results: [],
        total_searches: 1,
        research_timestamp: '2026-02-05T10:00:00Z'
      }
      
      expect(researchPayload.results).toEqual([])
      expect(researchPayload.total_searches).toBe(1)
    })
  })

  describe('ArticleSection Interface', () => {
    it('should accept valid article section', () => {
      const articleSection: ArticleSection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        article_id: '123e4567-e89b-12d3-a456-426614174001',
        section_order: 1,
        section_header: 'Introduction',
        section_type: 'body',
        planner_payload: {
          section_header: 'Introduction',
          section_type: 'body',
          instructions: 'Write intro',
          context_requirements: [],
          estimated_words: 200
        },
        status: 'pending' as SectionStatus,
        created_at: '2026-02-05T10:00:00Z',
        updated_at: '2026-02-05T10:00:00Z'
      }
      
      expect(articleSection.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(articleSection.article_id).toBe('123e4567-e89b-12d3-a456-426614174001')
      expect(articleSection.section_order).toBe(1)
      expect(articleSection.status).toBe('pending')
    })

    it('should handle optional fields', () => {
      const articleSection: ArticleSection = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        article_id: '123e4567-e89b-12d3-a456-426614174001',
        section_order: 1,
        section_header: 'Introduction',
        section_type: 'body',
        planner_payload: {
          section_header: 'Introduction',
          section_type: 'body',
          instructions: 'Write intro',
          context_requirements: [],
          estimated_words: 200
        },
        status: 'completed' as SectionStatus,
        created_at: '2026-02-05T10:00:00Z',
        updated_at: '2026-02-05T10:00:00Z',
        // Optional fields
        research_payload: {
          queries: ['research'],
          results: [],
          total_searches: 1,
          research_timestamp: '2026-02-05T10:00:00Z'
        },
        content_markdown: '# Introduction',
        content_html: '<h1>Introduction</h1>',
        error_details: { code: 'none' }
      }
      
      expect(articleSection.research_payload).toBeDefined()
      expect(articleSection.content_markdown).toBe('# Introduction')
      expect(articleSection.content_html).toBe('<h1>Introduction</h1>')
      expect(articleSection.error_details).toEqual({ code: 'none' })
    })
  })

  describe('CreateArticleSectionParams Interface', () => {
    it('should accept valid create parameters', () => {
      const createParams: CreateArticleSectionParams = {
        article_id: '123e4567-e89b-12d3-a456-426614174001',
        section_order: 1,
        section_header: 'Introduction',
        section_type: 'body',
        planner_payload: {
          section_header: 'Introduction',
          section_type: 'body',
          instructions: 'Write intro',
          context_requirements: [],
          estimated_words: 200
        }
      }
      
      expect(createParams.article_id).toBe('123e4567-e89b-12d3-a456-426614174001')
      expect(createParams.section_order).toBe(1)
      expect(createParams.section_header).toBe('Introduction')
      expect(createParams.section_type).toBe('body')
    })
  })

  describe('UpdateArticleSectionParams Interface', () => {
    it('should accept valid update parameters', () => {
      const updateParams: UpdateArticleSectionParams = {
        research_payload: {
          queries: ['research'],
          results: [],
          total_searches: 1,
          research_timestamp: '2026-02-05T10:00:00Z'
        },
        content_markdown: '# Introduction',
        content_html: '<h1>Introduction</h1>',
        status: 'researched' as SectionStatus,
        error_details: { code: 'none' }
      }
      
      expect(updateParams.content_markdown).toBe('# Introduction')
      expect(updateParams.status).toBe('researched')
      expect(updateParams.error_details).toEqual({ code: 'none' })
    })

    it('should handle partial updates', () => {
      const updateParams: UpdateArticleSectionParams = {
        status: 'writing' as SectionStatus
      }
      
      expect(updateParams.status).toBe('writing')
      expect(updateParams.content_markdown).toBeUndefined()
      expect(updateParams.research_payload).toBeUndefined()
    })
  })

  describe('Type Compatibility', () => {
    it('should maintain type consistency across interfaces', () => {
      const plannerPayload: PlannerPayload = {
        section_header: 'Test',
        section_type: 'body',
        instructions: 'Test',
        context_requirements: [],
        estimated_words: 100
      }

      const articleSection: ArticleSection = {
        id: 'test-id',
        article_id: 'test-article-id',
        section_order: 1,
        section_header: 'Test',
        section_type: 'body',
        planner_payload: plannerPayload,
        status: 'pending' as SectionStatus,
        created_at: '2026-02-05T10:00:00Z',
        updated_at: '2026-02-05T10:00:00Z'
      }

      const createParams: CreateArticleSectionParams = {
        article_id: articleSection.article_id,
        section_order: articleSection.section_order,
        section_header: articleSection.section_header,
        section_type: articleSection.section_type,
        planner_payload: articleSection.planner_payload
      }

      expect(createParams.planner_payload).toEqual(plannerPayload)
      expect(createParams.section_header).toBe(articleSection.section_header)
    })
  })
})
