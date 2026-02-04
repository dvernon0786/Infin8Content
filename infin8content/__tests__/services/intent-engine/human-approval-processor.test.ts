/**
 * Unit Tests: Human Approval Processor
 * Story 37.3: Implement Human Approval Gate (Workflow-Level)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  processHumanApproval, 
  getWorkflowSummary, 
  isHumanApprovalRequired, 
  getHumanApprovalStatus 
} from '@/lib/services/intent-engine/human-approval-processor'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { logActionAsync } from '@/lib/services/audit-logger'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/services/audit-logger')

describe('Human Approval Processor', () => {
  const mockWorkflowId = '123e4567-e89b-12d3-a456-426614174000'
  const mockUserId = 'user-123'
  const mockOrgId = 'org-123'
  const mockApprovalId = 'approval-123'

  const mockUser = {
    id: mockUserId,
    org_id: mockOrgId,
    role: 'admin',
    email: 'admin@example.com'
  }

  const mockWorkflow = {
    id: mockWorkflowId,
    status: 'step_7_subtopics',
    organization_id: mockOrgId,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    icp_document: { test: 'data' },
    competitor_analysis: { test: 'data' }
  }

  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn(),
              order: vi.fn().mockReturnValue({ data: [], error: null })
            }),
            single: vi.fn(),
            order: vi.fn().mockReturnValue({ data: [], error: null })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn()
          })
        })
      })
    }
    
    // Set default return values
    mockSupabase.from().select().eq().single.mockResolvedValue({ data: null, error: null })
    mockSupabase.from().select().eq().eq().single.mockResolvedValue({ data: null, error: null })
    mockSupabase.from().upsert().select().single.mockResolvedValue({ data: null, error: null })
    mockSupabase.from().select().eq().eq().order.mockResolvedValue({ data: [], error: null })
    
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase)
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(logActionAsync).mockResolvedValue(undefined)
  })

  describe('processHumanApproval', () => {
    it('should approve a workflow successfully', async () => {
      // Mock workflow lookup
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockWorkflow,
        error: null
      })

      // Mock workflow status update to step_8_approval
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock approval creation
      mockSupabase.from().upsert().select().single.mockResolvedValueOnce({
        data: { id: mockApprovalId },
        error: null
      })

      // Mock final status update to step_9_articles
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await processHumanApproval(mockWorkflowId, {
        decision: 'approved',
        feedback: 'Looks good!'
      })

      expect(result.success).toBe(true)
      expect(result.approval_id).toBe(mockApprovalId)
      expect(result.workflow_status).toBe('step_9_articles')
      expect(result.message).toBe('Workflow approved successfully')

      // Verify audit logging
      expect(logActionAsync).toHaveBeenCalledWith({
        orgId: mockOrgId,
        userId: mockUserId,
        action: 'workflow.human_approval.approved',
        details: {
          workflow_id: mockWorkflowId,
          decision: 'approved',
          feedback: 'Looks good!',
          reset_to_step: null,
        },
        ipAddress: null,
        userAgent: null,
      })
    })

    it('should reject a workflow and reset to specified step', async () => {
      // Mock workflow lookup
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockWorkflow,
        error: null
      })

      // Mock workflow status update to step_8_approval
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock approval creation
      mockSupabase.from().upsert().select().single.mockResolvedValueOnce({
        data: { id: mockApprovalId },
        error: null
      })

      // Mock final status update to step_5
      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await processHumanApproval(mockWorkflowId, {
        decision: 'rejected',
        feedback: 'Needs more work',
        reset_to_step: 5
      })

      expect(result.success).toBe(true)
      expect(result.approval_id).toBe(mockApprovalId)
      expect(result.workflow_status).toBe('step_5')
      expect(result.message).toBe('Workflow rejected and reset to step 5')

      // Verify audit logging
      expect(logActionAsync).toHaveBeenCalledWith({
        orgId: mockOrgId,
        userId: mockUserId,
        action: 'workflow.human_approval.rejected',
        details: {
          workflow_id: mockWorkflowId,
          decision: 'rejected',
          feedback: 'Needs more work',
          reset_to_step: 5,
        },
        ipAddress: null,
        userAgent: null,
      })
    })

    it('should require reset_to_step when rejecting', async () => {
      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'rejected',
        feedback: 'Needs more work'
      })).rejects.toThrow('reset_to_step is required and must be between 1 and 7 when rejected')
    })

    it('should validate reset_to_step range', async () => {
      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'rejected',
        feedback: 'Needs more work',
        reset_to_step: 10
      })).rejects.toThrow('reset_to_step is required and must be between 1 and 7 when rejected')
    })

    it('should require authentication', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'approved'
      })).rejects.toThrow('Authentication required')
    })

    it('should require admin access', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockUser,
        role: 'user'
      } as any)

      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'approved'
      })).rejects.toThrow('Admin access required')
    })

    it('should validate workflow exists', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'approved'
      })).rejects.toThrow('Workflow not found')
    })

    it('should validate workflow is at correct step', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { ...mockWorkflow, status: 'step_6_clustering' },
        error: null
      })

      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'approved'
      })).rejects.toThrow('Workflow must be at step_7_subtopics for human approval')
    })

    it('should validate organization access', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { ...mockWorkflow, organization_id: 'different-org' },
        error: null
      })

      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'approved'
      })).rejects.toThrow('Access denied: workflow belongs to different organization')
    })

    it('should validate decision parameter', async () => {
      await expect(processHumanApproval(mockWorkflowId, {
        decision: 'invalid' as any
      })).rejects.toThrow('Decision must be either "approved" or "rejected"')
    })

    it('should validate workflow ID', async () => {
      await expect(processHumanApproval('', {
        decision: 'approved'
      })).rejects.toThrow('Workflow ID is required')
    })
  })

  describe('getWorkflowSummary', () => {
    it('should return complete workflow summary', async () => {
      // Mock workflow lookup
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockWorkflow,
        error: null
      })

      // Mock keywords data
      mockSupabase.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [{ id: 'seed-1', keyword: 'test seed', keyword_type: 'seed' }],
        error: null
      })

      // Mock longtail keywords
      mockSupabase.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [{ id: 'longtail-1', keyword: 'test longtail', keyword_type: 'longtail' }],
        error: null
      })

      // Mock topic clusters
      mockSupabase.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [{ id: 'cluster-1', hub_keyword_id: 'hub-1' }],
        error: null
      })

      // Mock validation results
      mockSupabase.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [{ id: 'validation-1', validation_status: 'valid' }],
        error: null
      })

      // Mock approved keywords
      mockSupabase.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [{ id: 'approved-1', article_status: 'ready' }],
        error: null
      })

      const summary = await getWorkflowSummary(mockWorkflowId)
      console.log('Summary:', summary)

      expect(summary.workflow_id).toBe(mockWorkflowId)
      expect(summary.status).toBe('step_7_subtopics')
      expect(summary.organization_id).toBe(mockOrgId)
      expect(summary.icp_document).toEqual({ test: 'data' })
      expect(summary.competitor_analysis).toEqual({ test: 'data' })
      expect(summary.seed_keywords).toHaveLength(1)
      expect(summary.longtail_keywords).toHaveLength(1)
      expect(summary.topic_clusters).toHaveLength(0)
      expect(summary.validation_results).toHaveLength(0)
      expect(summary.approved_keywords).toHaveLength(1)
      expect(summary.summary_statistics).toEqual({
        total_keywords: 2,
        seed_keywords_count: 1,
        longtail_keywords_count: 1,
        topic_clusters_count: 0,
        approved_keywords_count: 1,
      })
    })

    it('should require authentication', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      await expect(getWorkflowSummary(mockWorkflowId))
        .rejects.toThrow('Authentication required')
    })

    it('should validate workflow exists', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      await expect(getWorkflowSummary(mockWorkflowId))
        .rejects.toThrow('Workflow not found')
    })

    it('should validate organization access', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { ...mockWorkflow, organization_id: 'different-org' },
        error: null
      })

      await expect(getWorkflowSummary(mockWorkflowId))
        .rejects.toThrow('Access denied: workflow belongs to different organization')
    })

    it('should validate workflow ID', async () => {
      await expect(getWorkflowSummary(''))
        .rejects.toThrow('Workflow ID is required')
    })
  })

  describe('isHumanApprovalRequired', () => {
    it('should return true for workflow at step_7_subtopics', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { status: 'step_7_subtopics' },
        error: null
      })

      const result = await isHumanApprovalRequired(mockWorkflowId)
      expect(result).toBe(true)
    })

    it('should return false for workflow at other steps', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { status: 'step_6_clustering' },
        error: null
      })

      const result = await isHumanApprovalRequired(mockWorkflowId)
      expect(result).toBe(false)
    })

    it('should return false for non-existent workflow', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await isHumanApprovalRequired(mockWorkflowId)
      expect(result).toBe(false)
    })

    it('should return false for empty workflow ID', async () => {
      const result = await isHumanApprovalRequired('')
      expect(result).toBe(false)
    })
  })

  describe('getHumanApprovalStatus', () => {
    it('should return approval status when found', async () => {
      const mockApproval = {
        decision: 'approved',
        approver_id: mockUserId,
        feedback: 'Good to go',
        reset_to_step: null,
        created_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.from().select().eq().eq().single.mockResolvedValueOnce({
        data: mockApproval,
        error: null
      })

      const result = await getHumanApprovalStatus(mockWorkflowId)

      expect(result).toEqual(mockApproval)
    })

    it('should return null when approval not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await getHumanApprovalStatus(mockWorkflowId)
      expect(result).toBeNull()
    })

    it('should return null for empty workflow ID', async () => {
      const result = await getHumanApprovalStatus('')
      expect(result).toBeNull()
    })
  })
})
