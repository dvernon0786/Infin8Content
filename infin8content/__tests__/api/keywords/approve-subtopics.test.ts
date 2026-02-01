/**
 * Integration Tests for Subtopic Approval API Endpoint
 * Story 37-2: Review and Approve Subtopics Before Article Generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/keywords/[keyword_id]/approve-subtopics/route'

// Mock dependencies
vi.mock('@/lib/services/keyword-engine/subtopic-approval-processor')

describe('/api/keywords/[keyword_id]/approve-subtopics', () => {
  const mockKeywordId = '123e4567-e89b-12d3-a456-426614174000'
  const mockUserId = 'user-123'
  const mockOrgId = 'org-456'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('should approve subtopics successfully', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockResolvedValue({
        success: true,
        decision: 'approved',
        keyword_id: mockKeywordId,
        article_status: 'ready',
        message: 'Subtopics approved successfully'
      })

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved',
          feedback: 'Good subtopics'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.decision).toBe('approved')
      expect(data.article_status).toBe('ready')
      expect(data.message).toContain('approved')
    })

    it('should reject subtopics successfully', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockResolvedValue({
        success: true,
        decision: 'rejected',
        keyword_id: mockKeywordId,
        article_status: 'not_started',
        message: 'Subtopics rejected successfully'
      })

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'rejected',
          feedback: 'Need better subtopics'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.decision).toBe('rejected')
      expect(data.article_status).toBe('not_started')
      expect(data.message).toContain('rejected')
    })

    it('should return 400 for invalid decision', async () => {
      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'invalid',
          feedback: 'test'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid decision')
    })

    it('should return 400 for missing decision', async () => {
      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: 'test'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid decision')
    })

    it('should return 401 for authentication error', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockRejectedValue(new Error('Authentication required'))

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 for admin access error', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockRejectedValue(new Error('Admin access required'))

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
    })

    it('should return 404 for keyword not found', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockRejectedValue(new Error('Keyword not found'))

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Keyword not found')
    })

    it('should return 400 for incomplete subtopics', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockRejectedValue(new Error('Subtopics must be complete before approval'))

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Subtopics must be complete before approval')
    })

    it('should return 403 for access denied', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockRejectedValue(new Error('Access denied: keyword belongs to different organization'))

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Access denied')
    })

    it('should return 500 for processor failure', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockResolvedValue({
        success: false,
        decision: 'approved' as const,
        keyword_id: mockKeywordId,
        article_status: 'ready' as const,
        message: 'Database error'
      })

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })

    it('should return 500 for unexpected errors', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockRejectedValue(new Error('Unexpected error'))

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle approval without feedback', async () => {
      const { processSubtopicApproval } = await import('@/lib/services/keyword-engine/subtopic-approval-processor')
      vi.mocked(processSubtopicApproval).mockResolvedValue({
        success: true,
        decision: 'approved',
        keyword_id: mockKeywordId,
        article_status: 'ready',
        message: 'Subtopics approved successfully'
      })

      const request = new Request(`http://localhost/api/keywords/${mockKeywordId}/approve-subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'approved'
        })
      })

const response = await POST(request, { params: Promise.resolve({ keyword_id: mockKeywordId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.decision).toBe('approved')
    })
  })
})
