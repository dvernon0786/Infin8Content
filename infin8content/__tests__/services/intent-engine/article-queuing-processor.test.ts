/**
 * Article Queuing Processor Service Tests
 * Story 38.1: Queue Approved Subtopics for Article Generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { queueApprovedSubtopicsForArticles } from '@/lib/services/intent-engine/article-queuing-processor'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/inngest/client')

describe('Article Queuing Processor', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('queueApprovedSubtopicsForArticles', () => {
    it('should create articles for approved keywords', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: ['https://competitor1.com']
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'keyword-1',
            keyword: 'best seo practices',
            subtopics: [
              { title: 'On-page SEO', type: 'subtopic', keywords: ['meta tags', 'headings'] },
              { title: 'Technical SEO', type: 'subtopic', keywords: ['site speed', 'crawlability'] },
              { title: 'Link Building', type: 'subtopic', keywords: ['backlinks', 'anchor text'] }
            ],
            cluster_info: { hub_keyword_id: 'hub-1', similarity_score: 0.95 }
          }
        ],
        error: null
      })

      // Mock existing article check (not found)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      // Mock article creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'article-1',
          keyword: 'best seo practices',
          status: 'queued'
        },
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      // Mock Inngest event
      vi.mocked(inngest).send = vi.fn().mockResolvedValue({ ids: ['event-1'] })

      const result = await queueApprovedSubtopicsForArticles(workflowId)

      expect(result.workflow_id).toBe(workflowId)
      expect(result.articles_created).toBe(1)
      expect(result.articles).toHaveLength(1)
      expect(result.articles[0].keyword).toBe('best seo practices')
      expect(result.errors).toHaveLength(0)
    })

    it('should handle workflow not found error', async () => {
      const workflowId = 'workflow-invalid'

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      await expect(queueApprovedSubtopicsForArticles(workflowId)).rejects.toThrow(
        'Workflow not found'
      )
    })

    it('should reject workflow not at step_8_approval', async () => {
      const workflowId = 'workflow-123'

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: 'org-123',
          status: 'step_7_validation',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      await expect(queueApprovedSubtopicsForArticles(workflowId)).rejects.toThrow(
        'Invalid workflow state'
      )
    })

    it('should handle no approved keywords gracefully', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      // Mock empty keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      const result = await queueApprovedSubtopicsForArticles(workflowId)

      expect(result.articles_created).toBe(0)
      expect(result.articles).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle article creation errors gracefully', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'keyword-1',
            keyword: 'test keyword',
            subtopics: [],
            cluster_info: {}
          }
        ],
        error: null
      })

      // Mock article creation error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      const result = await queueApprovedSubtopicsForArticles(workflowId)

      expect(result.articles_created).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failed to create article')
    })

    it('should trigger Planner Agent via Inngest', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: ['https://competitor.com']
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'keyword-1',
            keyword: 'test keyword',
            subtopics: [{ title: 'Subtopic 1', type: 'subtopic', keywords: [] }],
            cluster_info: { hub_keyword_id: 'hub-1' }
          }
        ],
        error: null
      })

      // Mock article creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'article-1',
          keyword: 'test keyword',
          status: 'queued'
        },
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      // Mock Inngest event
      vi.mocked(inngest).send = vi.fn().mockResolvedValue({ ids: ['event-1'] })

      await queueApprovedSubtopicsForArticles(workflowId)

      expect(inngest.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'article.generate.planner',
          data: expect.objectContaining({
            article_id: 'article-1',
            workflow_id: workflowId,
            organization_id: organizationId,
            keyword: 'test keyword'
          })
        })
      )
    })

    it('should update workflow status to step_9_articles', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      await queueApprovedSubtopicsForArticles(workflowId)

      // Verify update was called with correct status
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'step_9_articles'
        })
      )
    })

    it('should preserve intent context in article records', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'
      const icpDocument = 'Ideal Customer Profile content'
      const competitorUrls = ['https://competitor1.com', 'https://competitor2.com']

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: icpDocument,
          competitor_urls: competitorUrls
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'keyword-1',
            keyword: 'test keyword',
            subtopics: [],
            cluster_info: {}
          }
        ],
        error: null
      })

      // Mock article creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'article-1',
          keyword: 'test keyword',
          status: 'queued'
        },
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      vi.mocked(inngest.send).mockResolvedValue({ ids: ['event-1'] })

      await queueApprovedSubtopicsForArticles(workflowId)

      // Verify article was created with context
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          icp_context: { document: icpDocument },
          competitor_context: { urls: competitorUrls }
        })
      )
    })

    it('should handle Inngest event failures gracefully', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'keyword-1',
            keyword: 'test keyword',
            subtopics: [],
            cluster_info: {}
          }
        ],
        error: null
      })

      // Mock existing article check (not found)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      // Mock article creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'article-1',
          keyword: 'test keyword',
          status: 'queued'
        },
        error: null
      })

      // Mock article update (mark as planner_failed)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'article-1' },
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      // Mock Inngest failure
      vi.mocked(inngest.send).mockRejectedValue(new Error('Inngest error'))

      const result = await queueApprovedSubtopicsForArticles(workflowId)

      // Article should NOT be in createdArticles due to Inngest failure
      expect(result.articles_created).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failed to trigger Planner Agent')
    })

    it('should skip existing articles (idempotency)', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: [
          {
            id: 'keyword-1',
            keyword: 'test keyword',
            subtopics: [],
            cluster_info: {}
          }
        ],
        error: null
      })

      // Mock existing article check (found)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'article-1',
          keyword: 'test keyword',
          status: 'queued'
        },
        error: null
      })

      // Mock workflow status update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: workflowId },
        error: null
      })

      const result = await queueApprovedSubtopicsForArticles(workflowId)

      // Should include existing article without creating new one
      expect(result.articles_created).toBe(1)
      expect(result.articles).toHaveLength(1)
      expect(result.errors).toHaveLength(0)
      // Verify insert was NOT called
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })

    it('should reject workflows with too many keywords', async () => {
      const workflowId = 'workflow-123'
      const organizationId = 'org-123'
      const tooManyKeywords = Array.from({ length: 51 }, (_, i) => ({
        id: `keyword-${i}`,
        keyword: `keyword ${i}`,
        subtopics: [],
        cluster_info: {}
      }))

      // Mock workflow fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          organization_id: organizationId,
          status: 'step_8_approval',
          icp_document: 'ICP content',
          competitor_urls: []
        },
        error: null
      })

      // Mock approved keywords fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: tooManyKeywords,
        error: null
      })

      await expect(queueApprovedSubtopicsForArticles(workflowId)).rejects.toThrow(
        'exceeds limit of 50 articles'
      )
    })
  })
})
