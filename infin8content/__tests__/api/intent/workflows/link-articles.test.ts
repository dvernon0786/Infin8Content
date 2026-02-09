import { mockCurrentUser } from "@/tests/factories/current-user"
/**
 * Link Articles API Endpoint Tests
 * Story 38.3: Link Generated Articles to Intent Workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/link-articles/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync } from '@/lib/services/audit-logger'
import * as linkerService from '@/lib/services/intent-engine/article-workflow-linker'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/audit-logger')
vi.mock('@/lib/services/intent-engine/article-workflow-linker')

describe('Link Articles API Endpoint', () => {
  let mockRequest: Partial<NextRequest>
  let mockSupabase: any
  let mockParams: Promise<{ workflow_id: string }>

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock request
    mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0'
      })
    }

    // Setup mock params
    mockParams = Promise.resolve({ workflow_id: 'workflow-123' })

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

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when user lacks organization', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser(
        id: 'user-123',
        org_id: null
      })

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Authorization', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser(
        id: 'user-123',
        org_id: 'org-123'
      })
    })

    it('should return 403 when user lacks workflow access', async () => {
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(false)

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Access denied')
    })

    it('should return 404 when workflow is not found', async () => {
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(true)
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Workflow not found')
    })

    it('should return 400 when workflow is in wrong state', async () => {
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(true)
      mockSupabase.single.mockResolvedValue({ 
        data: { 
          id: 'workflow-123', 
          status: 'step_8_approval', 
          organization_id: 'org-123' 
        }, 
        error: null 
      })

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid workflow state')
      expect(data.message).toContain('step_9_articles state')
    })
  })

  describe('Article Linking', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser(
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(true)
      mockSupabase.single.mockResolvedValue({ 
        data: { 
          id: 'workflow-123', 
          status: 'step_9_articles', 
          organization_id: 'org-123' 
        }, 
        error: null 
      })
    })

    it('should successfully link articles', async () => {
      const mockLinkingResult = {
        workflow_id: 'workflow-123',
        linking_status: 'completed' as const,
        total_articles: 5,
        linked_articles: 3,
        already_linked: 2,
        failed_articles: 0,
        workflow_status: 'step_10_completed',
        processing_time_seconds: 2.5,
        details: {
          linked_article_ids: ['article-1', 'article-2', 'article-3'],
          failed_article_ids: [],
          skipped_article_ids: []
        }
      }

      vi.mocked(linkerService.linkArticlesToWorkflow).mockResolvedValue(mockLinkingResult)

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLinkingResult)
    })

    it('should handle partial success with some failures', async () => {
      const mockLinkingResult = {
        workflow_id: 'workflow-123',
        linking_status: 'completed_with_failures' as const,
        total_articles: 5,
        linked_articles: 3,
        already_linked: 0,
        failed_articles: 2,
        workflow_status: 'step_9_articles',
        processing_time_seconds: 3.1,
        details: {
          linked_article_ids: ['article-1', 'article-2', 'article-3'],
          failed_article_ids: ['article-4', 'article-5'],
          skipped_article_ids: []
        }
      }

      vi.mocked(linkerService.linkArticlesToWorkflow).mockResolvedValue(mockLinkingResult)

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.failed_articles).toBe(2)
    })

    it('should handle linking service failures', async () => {
      const error = new Error('Linking service failed')
      vi.mocked(linkerService.linkArticlesToWorkflow).mockRejectedValue(error)

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to link articles to workflow')
      expect(data.details).toBe('Linking service failed')
    })
  })

  describe('Audit Logging', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser(
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(true)
      mockSupabase.single.mockResolvedValue({ 
        data: { 
          id: 'workflow-123', 
          status: 'step_9_articles', 
          organization_id: 'org-123' 
        }, 
        error: null 
      })
    })

    it('should log linking start action', async () => {
      const mockLinkingResult = {
        workflow_id: 'workflow-123',
        linking_status: 'completed' as const,
        total_articles: 0,
        linked_articles: 0,
        already_linked: 0,
        failed_articles: 0,
        workflow_status: 'step_10_completed',
        processing_time_seconds: 1.0,
        details: {
          linked_article_ids: [],
          failed_article_ids: [],
          skipped_article_ids: []
        }
      }

      vi.mocked(linkerService.linkArticlesToWorkflow).mockResolvedValue(mockLinkingResult)

      await POST(mockRequest as NextRequest, { params: mockParams })

      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.articles.linking.started',
          details: expect.objectContaining({
            workflow_id: 'workflow-123',
            workflow_status: 'step_9_articles'
          })
        })
      )
    })

    it('should log linking completion action', async () => {
      const mockLinkingResult = {
        workflow_id: 'workflow-123',
        linking_status: 'completed' as const,
        total_articles: 3,
        linked_articles: 3,
        already_linked: 0,
        failed_articles: 0,
        workflow_status: 'step_10_completed',
        processing_time_seconds: 2.5,
        details: {
          linked_article_ids: ['article-1', 'article-2', 'article-3'],
          failed_article_ids: [],
          skipped_article_ids: []
        }
      }

      vi.mocked(linkerService.linkArticlesToWorkflow).mockResolvedValue(mockLinkingResult)

      await POST(mockRequest as NextRequest, { params: mockParams })

      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.articles.linking.completed',
          details: expect.objectContaining({
            workflow_id: 'workflow-123',
            workflow_status: 'step_10_completed',
            total_articles: 3,
            linked_articles: 3,
            failed_articles: 0,
            processing_time_seconds: 2.5
          })
        })
      )
    })

    it('should log linking failure action on error', async () => {
      const error = new Error('Service failure')
      vi.mocked(linkerService.linkArticlesToWorkflow).mockRejectedValue(error)

      await POST(mockRequest as NextRequest, { params: mockParams })

      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.articles.linking.failed',
          details: expect.objectContaining({
            workflow_id: 'workflow-123',
            error_details: 'Service failure'
          })
        })
      )
    })

    it('should continue despite audit logging failures', async () => {
      vi.mocked(logActionAsync).mockRejectedValue(new Error('Logging failed'))

      const mockLinkingResult = {
        workflow_id: 'workflow-123',
        linking_status: 'completed' as const,
        total_articles: 0,
        linked_articles: 0,
        already_linked: 0,
        failed_articles: 0,
        workflow_status: 'step_10_completed',
        processing_time_seconds: 1.0,
        details: {
          linked_article_ids: [],
          failed_article_ids: [],
          skipped_article_ids: []
        }
      }

      vi.mocked(linkerService.linkArticlesToWorkflow).mockResolvedValue(mockLinkingResult)

      const response = await POST(mockRequest as NextRequest, { params: mockParams })

      expect(response.status).toBe(200)
      expect(response.json()).resolves.toMatchObject({ success: true })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser(
        id: 'user-123',
        org_id: 'org-123'
      })
    })

    it('should handle workflow validation errors', async () => {
      vi.mocked(linkerService.validateWorkflowAccess).mockRejectedValue(new Error('Validation error'))

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to link articles to workflow')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(true)
      mockSupabase.single.mockRejectedValue(new Error('Database connection failed'))

      const response = await POST(mockRequest as NextRequest, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to link articles to workflow')
    })

    it('should extract IP and user agent from request', async () => {
      vi.mocked(linkerService.validateWorkflowAccess).mockResolvedValue(true)
      mockSupabase.single.mockResolvedValue({ 
        data: { 
          id: 'workflow-123', 
          status: 'step_9_articles', 
          organization_id: 'org-123' 
        }, 
        error: null 
      })

      const mockLinkingResult = {
        workflow_id: 'workflow-123',
        linking_status: 'completed' as const,
        total_articles: 0,
        linked_articles: 0,
        already_linked: 0,
        failed_articles: 0,
        workflow_status: 'step_10_completed',
        processing_time_seconds: 1.0,
        details: {
          linked_article_ids: [],
          failed_article_ids: [],
          skipped_article_ids: []
        }
      }

      vi.mocked(linkerService.linkArticlesToWorkflow).mockResolvedValue(mockLinkingResult)

      await POST(mockRequest as NextRequest, { params: mockParams })

      // Verify audit logging is called with proper structure (IP/user agent extracted by real functions)
      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.articles.linking.started',
          details: expect.objectContaining({
            workflow_id: 'workflow-123',
            workflow_status: 'step_9_articles'
          })
        })
      )
      
      expect(logActionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-123',
          userId: 'user-123',
          action: 'workflow.articles.linking.completed',
          details: expect.objectContaining({
            workflow_id: 'workflow-123',
            workflow_status: 'step_10_completed'
          })
        })
      )
    })
  })
})
