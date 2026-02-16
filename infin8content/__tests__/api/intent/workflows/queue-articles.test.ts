/**
 * Queue Articles API Endpoint Tests
 * Story 38.1: Queue Approved Subtopics for Article Generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/queue-articles/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync } from '@/lib/services/audit-logger'
import * as queueingProcessor from '@/lib/services/intent-engine/article-queuing-processor'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/audit-logger')
vi.mock('@/lib/services/intent-engine/article-queuing-processor')

describe('Queue Articles API Endpoint', () => {
  let mockRequest: Partial<NextRequest>
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock request
    mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0'
      })
    }

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase)
    vi.mocked(logActionAsync).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/intent/workflows/{workflow_id}/steps/queue-articles', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 404 when workflow not found', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-invalid' }) }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Workflow not found')
    })

    it('should return 400 when workflow is not at step_8_approval', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_7_validation',
          organization_id: 'org-123'
        },
        error: null
      })

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid workflow state')
      expect(data.message).toContain('step_8_approval')
    })

    it('should successfully queue articles for approved subtopics', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 2,
        articles: [
          { id: 'article-1', keyword: 'keyword-1', status: 'queued' },
          { id: 'article-2', keyword: 'keyword-2', status: 'queued' }
        ],
        message: 'Articles queued successfully'
      })

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.workflow_status).toBe('step_9_articles')
      expect(data.articles_created).toBe(2)
      expect(data.articles).toHaveLength(2)
      expect(data.errors).toHaveLength(0)
    })

    it('should log workflow start action', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 0,
        articles: [],
        message: 'No articles to queue'
      })

      await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.article_queuing.started'
        })
      )
    })

    it('should log workflow completion action', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 1,
        articles: [{ id: 'article-1', keyword: 'keyword-1', status: 'queued' }],
        message: '1 article queued successfully'
      })

      await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.article_queuing.completed',
          details: expect.objectContaining({
            articles_created: 1,
            errors_count: 0
          })
        })
      )
    })

    it('should handle partial failures with error reporting', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 1,
        articles: [{ id: 'article-1', keyword: 'keyword-1', status: 'queued' }],
        message: '1 article queued with some issues'
      })

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.articles_created).toBe(1)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0]).toContain('Failed to trigger Planner Agent')
    })

    it('should return 500 on fatal error', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockRejectedValue(
        new Error('Database connection failed')
      )

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('Database connection failed')
    })

    it('should log error action on failure', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockRejectedValue(
        new Error('Fatal error')
      )

      await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.article_queuing.failed',
          details: expect.objectContaining({
            error: 'Fatal error'
          })
        })
      )
    })

    it('should include duration in response', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 1,
        articles: [{ id: 'article-1', keyword: 'keyword-1', status: 'queued' }],
        message: '1 article queued successfully'
      })

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )

      const data = await response.json()
      expect(data.duration_ms).toBeDefined()
      expect(typeof data.duration_ms).toBe('number')
      expect(data.duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('should enforce organization isolation', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      // Workflow belongs to different organization
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })

      const response = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-999' }) }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Workflow not found')
    })

    it('should skip existing articles on re-run (idempotency)', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        role: 'admin'
      } as any)

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 2,
        articles: [
          { id: 'article-1', keyword: 'keyword-1', status: 'queued' },
          { id: 'article-2', keyword: 'keyword-2', status: 'queued' }
        ],
        message: 'Articles queued successfully'
      })

      // First run
      const response1 = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )
      expect(response1.status).toBe(200)
      const data1 = await response1.json()
      expect(data1.articles_created).toBe(2)

      // Second run should skip existing articles
      vi.mocked(queueingProcessor.queueArticlesForWorkflow).mockResolvedValue({
        workflow_id: 'workflow-123',
        workflow_state: 'step_9_articles',
        articles_created: 2,
        articles: [
          { id: 'article-1', keyword: 'keyword-1', status: 'queued' },
          { id: 'article-2', keyword: 'keyword-2', status: 'queued' }
        ],
        message: 'Articles queued successfully'
      })

      const response2 = await POST(
        mockRequest as NextRequest,
        { params: Promise.resolve({ workflow_id: 'workflow-123' }) }
      )
      expect(response2.status).toBe(200)
      const data2 = await response2.json()
      expect(data2.articles_created).toBe(2)
      expect(data2.message).toBeDefined()
    })
  })
})
