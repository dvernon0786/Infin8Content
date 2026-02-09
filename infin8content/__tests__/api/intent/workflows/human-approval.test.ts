import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * Integration Tests: Human Approval API Endpoints
 * Story 37.3: Implement Human Approval Gate (Workflow-Level)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/human-approval/route'
import { GET } from '@/app/api/intent/workflows/[workflow_id]/steps/human-approval/summary/route'
import { processHumanApproval } from '@/lib/services/intent-engine/human-approval-processor'
import { getWorkflowSummary } from '@/lib/services/intent-engine/human-approval-processor'

// Mock dependencies
vi.mock('@/lib/services/intent-engine/human-approval-processor')

describe('Human Approval API Endpoints', () => {
  const mockWorkflowId = '123e4567-e89b-12d3-a456-426614174000'
  const mockApprovalId = 'approval-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/intent/workflows/[workflow_id]/steps/human-approval', () => {
    it('should approve a workflow successfully', async () => {
      const mockResponse = {
        success: true,
        approval_id: mockApprovalId,
        workflow_status: 'step_9_articles',
        message: 'Workflow approved successfully'
      }

      vi.mocked(processHumanApproval).mockResolvedValue(mockResponse)

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved',
          feedback: 'Looks good!'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
      expect(processHumanApproval).toHaveBeenCalledWith(mockWorkflowId, {
        decision: 'approved',
        feedback: 'Looks good!'
      }, expect.any(Headers))
    })

    it('should reject a workflow with reset step', async () => {
      const mockResponse = {
        success: true,
        approval_id: mockApprovalId,
        workflow_status: 'step_5',
        message: 'Workflow rejected and reset to step 5'
      }

      vi.mocked(processHumanApproval).mockResolvedValue(mockResponse)

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'rejected',
          feedback: 'Needs more work',
          reset_to_step: 5
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResponse)
      expect(processHumanApproval).toHaveBeenCalledWith(mockWorkflowId, {
        decision: 'rejected',
        feedback: 'Needs more work',
        reset_to_step: 5
      }, expect.any(Headers))
    })

    it('should return 400 for invalid decision', async () => {
      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'invalid'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid decision. Must be "approved" or "rejected"')
      expect(processHumanApproval).not.toHaveBeenCalled()
    })

    it('should return 400 for missing reset_to_step when rejected', async () => {
      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'rejected',
          feedback: 'Needs more work'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('reset_to_step is required and must be a number between 1 and 7 when rejected')
      expect(processHumanApproval).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid reset_to_step range', async () => {
      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'rejected',
          feedback: 'Needs more work',
          reset_to_step: 10
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('reset_to_step is required and must be a number between 1 and 7 when rejected')
      expect(processHumanApproval).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid feedback type', async () => {
      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved',
          feedback: 123
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Feedback must be a string')
      expect(processHumanApproval).not.toHaveBeenCalled()
    })

    it('should return 401 for authentication errors', async () => {
      vi.mocked(processHumanApproval).mockRejectedValue(new Error('Authentication required'))

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 for authorization errors', async () => {
      vi.mocked(processHumanApproval).mockRejectedValue(new Error('Admin access required'))

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
    })

    it('should return 400 for validation errors', async () => {
      vi.mocked(processHumanApproval).mockRejectedValue(new Error('Workflow must be at step_7_subtopics for human approval'))

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Workflow must be at step_7_subtopics for human approval')
    })

    it('should return 500 for database errors', async () => {
      vi.mocked(processHumanApproval).mockRejectedValue(new Error('Failed to process approval'))

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process approval')
    })

    it('should return 500 for generic errors', async () => {
      vi.mocked(processHumanApproval).mockRejectedValue(new Error('Unknown error'))

      const request = mockNextRequest({url: 'http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved'
        }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      })

      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/intent/workflows/[workflow_id]/steps/human-approval/summary', () => {
    it('should return workflow summary successfully', async () => {
      const mockSummary = {
        workflow_id: mockWorkflowId,
        status: 'step_7_subtopics',
        organization_id: 'org-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        icp_document: { test: 'data' },
        competitor_analysis: { test: 'data' },
        seed_keywords: [],
        longtail_keywords: [],
        topic_clusters: [],
        validation_results: [],
        approved_keywords: [],
        summary_statistics: {
          total_keywords: 0,
          seed_keywords_count: 0,
          longtail_keywords_count: 0,
          topic_clusters_count: 0,
          approved_keywords_count: 0,
        }
      }

      vi.mocked(getWorkflowSummary).mockResolvedValue(mockSummary)

      const request = mockNextRequest({url: 'http://localhost:3000')
      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockSummary)
      expect(getWorkflowSummary).toHaveBeenCalledWith(mockWorkflowId)
    })

    it('should return 401 for authentication errors', async () => {
      vi.mocked(getWorkflowSummary).mockRejectedValue(new Error('Authentication required'))

      const request = mockNextRequest({url: 'http://localhost:3000')
      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 for authorization errors', async () => {
      vi.mocked(getWorkflowSummary).mockRejectedValue(new Error('Access denied: workflow belongs to different organization'))

      const request = mockNextRequest({url: 'http://localhost:3000')
      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Access denied: workflow belongs to different organization')
    })

    it('should return 400 for validation errors', async () => {
      vi.mocked(getWorkflowSummary).mockRejectedValue(new Error('Workflow not found'))

      const request = mockNextRequest({url: 'http://localhost:3000')
      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Workflow not found')
    })

    it('should return 500 for generic errors', async () => {
      vi.mocked(getWorkflowSummary).mockRejectedValue(new Error('Unknown error'))

      const request = mockNextRequest({url: 'http://localhost:3000')
      const params = Promise.resolve({ workflow_id: mockWorkflowId })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
