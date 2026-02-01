/**
 * Integration Tests for Seed Approval API Endpoint
 * Story 35.3: Approve Seed Keywords Before Expansion
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))
vi.mock('@/lib/services/intent-engine/seed-approval-processor', () => ({
  processSeedApproval: vi.fn(),
}))

import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/approve-seeds/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { processSeedApproval } from '@/lib/services/intent-engine/seed-approval-processor'

const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockProcessSeedApproval = vi.mocked(processSeedApproval)

describe('Seed Approval API Endpoint', () => {
  const mockWorkflowId = 'workflow-123'
  const mockUserId = 'user-123'
  const mockOrgId = 'org-123'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default user mock
    mockGetCurrentUser.mockResolvedValue({
      id: mockUserId,
      email: 'admin@example.com',
      first_name: 'Admin',
      role: 'admin',
      org_id: mockOrgId,
      user: { id: 'auth-123', email: 'admin@example.com' },
    })
  })

  describe('Request Validation', () => {
    it('should return 400 for missing decision', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ feedback: 'Test' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid decision. Must be "approved" or "rejected"')
    })

    it('should return 400 for invalid decision', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'invalid' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid decision. Must be "approved" or "rejected"')
    })

    it('should return 400 for invalid feedback type', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved', feedback: 123 }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Feedback must be a string')
    })

    it('should return 400 for empty approved_keyword_ids array', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved', approved_keyword_ids: [] }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Approved keyword IDs must be a non-empty array when provided')
    })
  })

  describe('Successful Approvals', () => {
    it('should handle approved decision with feedback', async () => {
      const mockResult = {
        success: true,
        approval_id: 'approval-123',
        workflow_status: 'step_3_seeds',
        message: 'Seed keywords approved successfully',
      }
      mockProcessSeedApproval.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approved',
          feedback: 'Good keywords',
          approved_keyword_ids: ['kw-1', 'kw-2'],
        }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResult)
      expect(mockProcessSeedApproval).toHaveBeenCalledWith(
        mockWorkflowId,
        {
          decision: 'approved',
          feedback: 'Good keywords',
          approved_keyword_ids: ['kw-1', 'kw-2'],
        },
        request.headers
      )
    })

    it('should handle rejected decision without feedback', async () => {
      const mockResult = {
        success: true,
        approval_id: 'approval-123',
        workflow_status: 'step_3_seeds',
        message: 'Seed keywords rejected successfully',
      }
      mockProcessSeedApproval.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'rejected' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResult)
      expect(mockProcessSeedApproval).toHaveBeenCalledWith(
        mockWorkflowId,
        { decision: 'rejected' },
        request.headers
      )
    })

    it('should handle partial approval without keyword IDs', async () => {
      const mockResult = {
        success: true,
        approval_id: 'approval-123',
        workflow_status: 'step_3_seeds',
        message: 'Seed keywords approved successfully',
      }
      mockProcessSeedApproval.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResult)
    })
  })

  describe('Error Handling', () => {
    it('should return 401 for authentication errors', async () => {
      mockProcessSeedApproval.mockRejectedValue(new Error('Authentication required'))

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 for authorization errors', async () => {
      mockProcessSeedApproval.mockRejectedValue(new Error('Admin access required'))

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
    })

    it('should return 400 for validation errors', async () => {
      mockProcessSeedApproval.mockRejectedValue(new Error('Workflow must be at step_3_seeds for seed approval'))

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Workflow must be at step_3_seeds for seed approval')
    })

    it('should return 500 for database errors', async () => {
      mockProcessSeedApproval.mockRejectedValue(new Error('Failed to process approval'))

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process approval')
    })

    it('should return 500 for generic errors', async () => {
      mockProcessSeedApproval.mockRejectedValue(new Error('Unexpected error'))

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ decision: 'approved' }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request, { params: { workflow_id: mockWorkflowId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
