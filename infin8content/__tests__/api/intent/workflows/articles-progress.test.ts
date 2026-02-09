import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * Integration Tests for Article Progress API Endpoint
 * Story 38.2: Track Article Generation Progress
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/intent/workflows/[workflow_id]/articles/progress/route'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/services/intent-engine/article-progress-tracker')
vi.mock('@/lib/services/audit-logger')

describe('Article Progress API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress'})
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 when user does not have access to workflow', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess } = await import('@/lib/services/intent-engine/article-progress-tracker')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(false)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress'})
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should return 400 when workflow_id is missing', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/articles/progress'})
      // @ts-ignore - testing invalid params
      const response = await GET(request, { params: {} })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_REQUEST')
    })
  })

  describe('Query Parameter Validation', () => {
    it('should validate date_from format', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess } = await import('@/lib/services/intent-engine/article-progress-tracker')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress?date_from=invalid-date')
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_DATE_FORMAT')
    })

    it('should validate date_to format', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess } = await import('@/lib/services/intent-engine/article-progress-tracker')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress?date_to=invalid-date')
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_DATE_FORMAT')
    })

    it('should validate status parameter', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess } = await import('@/lib/services/intent-engine/article-progress-tracker')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress?status=invalid-status')
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.code).toBe('INVALID_STATUS')
    })

    it('should cap limit parameter at 1000', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess, getWorkflowArticleProgress } = await import('@/lib/services/intent-engine/article-progress-tracker')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)
      vi.mocked(getWorkflowArticleProgress).mockResolvedValue([])

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress?limit=2000')
      await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(getWorkflowArticleProgress).toHaveBeenCalledWith(
        'test-workflow',
        expect.objectContaining({ limit: 1000 })
      )
    })
  })

  describe('Happy Path', () => {
    it('should return article progress data for authorized user', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess, getWorkflowArticleProgress, formatProgressResponse } = await import('@/lib/services/intent-engine/article-progress-tracker')
      const { logActionAsync } = await import('@/lib/services/audit-logger')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)
      vi.mocked(getWorkflowArticleProgress).mockResolvedValue([
        {
          article_id: 'article-1',
          status: 'completed',
          progress_percent: 100,
          sections_completed: 5,
          sections_total: 5,
          created_at: '2026-02-03T12:00:00Z',
          started_at: '2026-02-03T12:00:00Z',
          completed_at: '2026-02-03T12:05:00Z',
          error: null,
          word_count: 1000,
          quality_score: 0.85
        }
      ])
      vi.mocked(formatProgressResponse).mockReturnValue({
        workflow_id: 'test-workflow',
        total_articles: 1,
        articles: [],
        summary: {
          queued_count: 0,
          generating_count: 0,
          completed_count: 1,
          failed_count: 0,
          average_generation_time_seconds: 300,
          estimated_total_completion_time: null
        }
      })
      vi.mocked(logActionAsync).mockResolvedValue(undefined)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress'})
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.workflow_id).toBe('test-workflow')
      expect(data.total_articles).toBe(1)
      expect(data.summary.completed_count).toBe(1)

      // Verify audit logging was called
      expect(logActionAsync).toHaveBeenCalledWith({
        orgId: 'org-123',
        userId: 'user-123',
        action: expect.any(String),
        details: expect.objectContaining({
          workflow_id: 'test-workflow',
          article_count: 1
        }),
        ipAddress: 'unknown',
        userAgent: 'unknown'
      })
    })

    it('should apply filters correctly', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess, getWorkflowArticleProgress, formatProgressResponse } = await import('@/lib/services/intent-engine/article-progress-tracker')
      const { logActionAsync } = await import('@/lib/services/audit-logger')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)
      vi.mocked(getWorkflowArticleProgress).mockResolvedValue([])
      vi.mocked(formatProgressResponse).mockReturnValue({
        workflow_id: 'test-workflow',
        total_articles: 0,
        articles: [],
        summary: {
          queued_count: 0,
          generating_count: 0,
          completed_count: 0,
          failed_count: 0,
          average_generation_time_seconds: 0,
          estimated_total_completion_time: null
        }
      })
      vi.mocked(logActionAsync).mockResolvedValue(undefined)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress?status=completed&date_from=2026-02-01&date_to=2026-02-03&limit=50&offset=10')
      await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(getWorkflowArticleProgress).toHaveBeenCalledWith(
        'test-workflow',
        {
          status: 'completed',
          date_from: '2026-02-01',
          date_to: '2026-02-03',
          limit: 50,
          offset: 10
        }
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess, getWorkflowArticleProgress } = await import('@/lib/services/intent-engine/article-progress-tracker')
      const { logActionAsync } = await import('@/lib/services/audit-logger')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)
      vi.mocked(getWorkflowArticleProgress).mockRejectedValue(new Error('Database connection failed'))
      vi.mocked(logActionAsync).mockResolvedValue(undefined)

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress'})
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')

      // Verify error audit logging was called
      expect(logActionAsync).toHaveBeenCalledWith({
        orgId: 'org-123',
        userId: 'user-123',
        action: expect.any(String),
        details: expect.objectContaining({
          workflow_id: 'test-workflow',
          error: 'Database connection failed'
        }),
        ipAddress: 'unknown',
        userAgent: 'unknown'
      })
    })

    it('should handle missing user in error logging', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess, getWorkflowArticleProgress } = await import('@/lib/services/intent-engine/article-progress-tracker')
      const { logActionAsync } = await import('@/lib/services/audit-logger')
      
      vi.mocked(getCurrentUser)
        .mockResolvedValueOnce({
          id: 'user-123',
          org_id: 'org-123'
        })
        .mockResolvedValueOnce(null) // Second call in error handler returns null
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)
      vi.mocked(getWorkflowArticleProgress).mockRejectedValue(new Error('Service error'))

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress'})
      const response = await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(response.status).toBe(500)
      // Should not throw error when user is null in error logging
    })
  })

  describe('Pagination', () => {
    it('should support pagination parameters', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
      const { validateWorkflowAccess, getWorkflowArticleProgress, formatProgressResponse } = await import('@/lib/services/intent-engine/article-progress-tracker')
      
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123'
      })
      vi.mocked(validateWorkflowAccess).mockResolvedValue(true)
      vi.mocked(getWorkflowArticleProgress).mockResolvedValue([])
      vi.mocked(formatProgressResponse).mockReturnValue({
        workflow_id: 'test-workflow',
        total_articles: 0,
        articles: [],
        summary: {
          queued_count: 0,
          generating_count: 0,
          completed_count: 0,
          failed_count: 0,
          average_generation_time_seconds: 0,
          estimated_total_completion_time: null
        }
      })

      const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow/articles/progress?limit=20&offset=40')
      await GET(request, { params: { workflow_id: 'test-workflow' } })

      expect(getWorkflowArticleProgress).toHaveBeenCalledWith(
        'test-workflow',
        {
          status: null,
          date_from: undefined,
          date_to: undefined,
          limit: 20,
          offset: 40
        }
      )
    })
  })
})
