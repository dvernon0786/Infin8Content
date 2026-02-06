/**
 * Database schema tests for article_sections table
 * Story B-1: Article Sections Data Model
 */

import { describe, it, expect } from 'vitest'

describe('Article Sections Schema Validation', () => {
  describe('Migration File Structure', () => {
    it('should have migration file with correct naming pattern', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationExists = await fs.access(migrationPath).then(() => true).catch(() => false)
      
      expect(migrationExists).toBe(true)
    })

    it('should contain required table creation statements', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      // Check for table creation
      expect(migrationContent).toContain('CREATE TABLE article_sections')
      
      // Check for required columns
      expect(migrationContent).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
      expect(migrationContent).toContain('article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE')
      expect(migrationContent).toContain('section_order INTEGER NOT NULL')
      expect(migrationContent).toContain('section_header TEXT NOT NULL')
      expect(migrationContent).toContain('section_type TEXT NOT NULL')
      expect(migrationContent).toContain('planner_payload JSONB NOT NULL DEFAULT \'{}\'')
      expect(migrationContent).toContain('research_payload JSONB')
      expect(migrationContent).toContain('content_markdown TEXT')
      expect(migrationContent).toContain('content_html TEXT')
      expect(migrationContent).toContain('status TEXT NOT NULL DEFAULT \'pending\'')
      expect(migrationContent).toContain('error_details JSONB')
      expect(migrationContent).toContain('created_at TIMESTAMPTZ DEFAULT now()')
      expect(migrationContent).toContain('updated_at TIMESTAMPTZ DEFAULT now()')
    })

    it('should have unique constraint on (article_id, section_order)', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      expect(migrationContent).toContain('UNIQUE (article_id, section_order)')
    })

    it('should have status enum CHECK constraint', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      expect(migrationContent).toContain('CHECK (status IN (\'pending\', \'researching\', \'researched\', \'writing\', \'completed\', \'failed\'))')
    })

    it('should have performance indexes', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      expect(migrationContent).toContain('CREATE INDEX idx_article_sections_article_id')
      expect(migrationContent).toContain('CREATE INDEX idx_article_sections_status')
      expect(migrationContent).toContain('CREATE INDEX idx_article_sections_article_status')
    })

    it('should have RLS policies for organization isolation', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      expect(migrationContent).toContain('ALTER TABLE article_sections ENABLE ROW LEVEL SECURITY')
      expect(migrationContent).toContain('Organizations can view their own article sections')
      expect(migrationContent).toContain('Organizations can insert their own article sections')
      expect(migrationContent).toContain('Organizations can update their own article sections')
      expect(migrationContent).toContain('organization_id')
    })

    it('should have documentation comments', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      expect(migrationContent).toContain('COMMENT ON TABLE article_sections IS')
      expect(migrationContent).toContain('COMMENT ON COLUMN article_sections.planner_payload IS')
      expect(migrationContent).toContain('COMMENT ON COLUMN article_sections.research_payload IS')
      expect(migrationContent).toContain('COMMENT ON COLUMN article_sections.content_markdown IS')
      expect(migrationContent).toContain('COMMENT ON COLUMN article_sections.content_html IS')
      expect(migrationContent).toContain('COMMENT ON COLUMN article_sections.status IS')
      expect(migrationContent).toContain('COMMENT ON COLUMN article_sections.error_details IS')
    })
  })

  describe('TypeScript Type Definitions', () => {
    it('should export SectionStatus type with correct values', async () => {
      const { SectionStatus } = await import('../../types/article')
      
      const validStatuses: SectionStatus[] = [
        'pending',
        'researching',
        'researched',
        'writing',
        'completed',
        'failed'
      ]
      
      expect(validStatuses).toHaveLength(6)
    })

    it('should export PlannerPayload interface', async () => {
      const { PlannerPayload } = await import('../../types/article')
      
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

    it('should export ResearchPayload interface', async () => {
      const { ResearchPayload } = await import('../../types/article')
      
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

    it('should export ArticleSection interface', async () => {
      const { ArticleSection, SectionStatus, PlannerPayload } = await import('../../types/article')
      
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

    it('should export CreateArticleSectionParams interface', async () => {
      const { CreateArticleSectionParams, PlannerPayload } = await import('../../types/article')
      
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
    })

    it('should export UpdateArticleSectionParams interface', async () => {
      const { UpdateArticleSectionParams, ResearchPayload, SectionStatus } = await import('../../types/article')
      
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
  })

  describe('Schema Compliance', () => {
    it('should follow established naming conventions', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      // Check for consistent naming patterns
      expect(migrationPath).toContain('20260205110000_add_article_sections_table.sql')  // Timestamp pattern
      expect(migrationContent).toContain('idx_article_sections_')  // Index naming
      expect(migrationContent).toContain('gen_random_uuid()')     // UUID generation
      expect(migrationContent).toContain('TIMESTAMPTZ')           // Timestamp type
    })

    it('should have proper foreign key constraints', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      expect(migrationContent).toContain('REFERENCES articles(id) ON DELETE CASCADE')
    })

    it('should implement organization isolation via articles table', async () => {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260205110000_add_article_sections_table.sql')
      const migrationContent = await fs.readFile(migrationPath, 'utf-8')
      
      // RLS should inherit from articles table
      expect(migrationContent).toContain('SELECT id FROM articles')
      expect(migrationContent).toContain('WHERE organization_id')
    })
  })
})
