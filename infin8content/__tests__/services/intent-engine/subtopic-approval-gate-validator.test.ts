import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SubtopicApprovalGateValidator } from '@/lib/services/intent-engine/subtopic-approval-gate-validator'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

vi.mock('@/lib/services/intent-engine/intent-audit-logger', () => ({
  logIntentAction: vi.fn()
}))

describe('SubtopicApprovalGateValidator', () => {
  let validator: SubtopicApprovalGateValidator
  let mockSupabase: any

  beforeEach(() => {
    validator = new SubtopicApprovalGateValidator()
    
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    }
    
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateSubtopicApproval', () => {
    it('should allow access when subtopics are approved', async () => {
      // Mock workflow at step_8_approval
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock approvals query - returns array directly
      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          {
            decision: 'approved',
            approved_items: ['keyword-1', 'keyword-2']
          }
        ],
        error: null
      })

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(true)
      expect(result.subtopicApprovalStatus).toBe('approved')
      expect(result.workflowStatus).toBe('step_8_approval')
    })

    it('should block access when subtopics are rejected', async () => {
      // Mock workflow at step_8_approval
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock rejected subtopics - returns array directly
      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          {
            decision: 'rejected',
            approved_items: null
          }
        ],
        error: null
      })

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(false)
      expect(result.subtopicApprovalStatus).toBe('rejected')
      expect(result.error).toBe('Subtopics rejected - revision required')
      expect(result.errorResponse).toMatchObject({
        error: 'Subtopics rejected - revision required',
        workflowStatus: 'step_8_approval',
        subtopicApprovalStatus: 'rejected',
        requiredAction: 'Regenerate or revise subtopics before article generation',
        currentStep: 'article-generation'
      })
    })

    it('should block access when subtopics are not approved', async () => {
      // Mock workflow at step_8_approval
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock empty approvals query
      mockSupabase.limit.mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(false)
      expect(result.subtopicApprovalStatus).toBe('not_approved')
      expect(result.error).toBe('Subtopics must be approved before article generation')
      expect(result.errorResponse).toMatchObject({
        error: 'Subtopics must be approved before article generation',
        workflowStatus: 'step_8_approval',
        subtopicApprovalStatus: 'not_approved',
        requiredAction: 'Approve subtopics via keyword approval endpoints'
      })
    })

    it('should block access when workflow is before step_8_approval', async () => {
      // Mock workflow at step_7_validation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'workflow-123',
          status: 'step_7_validation',
          organization_id: 'org-123'
        },
        error: null
      })

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(false)
      expect(result.subtopicApprovalStatus).toBe('not_ready')
      expect(result.error).toBe('Subtopics not yet generated for approval')
      expect(result.errorResponse).toMatchObject({
        error: 'Subtopics not yet generated for approval',
        workflowStatus: 'step_7_validation',
        subtopicApprovalStatus: 'not_ready',
        requiredAction: 'Complete subtopic generation (step 8) before approval'
      })
    })

    it('should allow access when workflow is beyond step_8_approval', async () => {
      // Mock workflow at step_9_articles
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'workflow-123',
          status: 'step_9_articles',
          organization_id: 'org-123'
        },
        error: null
      })

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(true)
      expect(result.subtopicApprovalStatus).toBe('not_required')
      expect(result.workflowStatus).toBe('step_9_articles')
    })

    it('should return error when workflow not found', async () => {
      // Mock workflow not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await validator.validateSubtopicApproval('invalid-workflow')

      expect(result.allowed).toBe(false)
      expect(result.subtopicApprovalStatus).toBe('not_found')
      expect(result.workflowStatus).toBe('not_found')
      expect(result.error).toBe('Workflow not found')
      expect(result.errorResponse).toMatchObject({
        error: 'Workflow not found',
        workflowId: 'invalid-workflow',
        requiredAction: 'Provide valid workflow ID'
      })
    })

    it('should fail open on database errors', async () => {
      // Mock database error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'DATABASE_ERROR', message: 'Connection failed' }
      })

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(true)
      expect(result.subtopicApprovalStatus).toBe('error')
      expect(result.workflowStatus).toBe('error')
      expect(result.error).toBe('Database error - failing open for availability')
    })

    it('should fail open on unexpected errors', async () => {
      // Mock unexpected error
      mockSupabase.single.mockRejectedValueOnce(new Error('Unexpected error'))

      const result = await validator.validateSubtopicApproval('workflow-123')

      expect(result.allowed).toBe(true)
      expect(result.subtopicApprovalStatus).toBe('error')
      expect(result.workflowStatus).toBe('error')
      expect(result.error).toBe('Unexpected error - failing open for availability')
    })

    it('should handle concurrent approval scenarios correctly', async () => {
      // Mock workflow at step_8_approval
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-123',
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock approved subtopics
      mockSupabase.limit.mockResolvedValue({
        data: [
          {
            decision: 'approved',
            approved_items: ['keyword-1', 'keyword-2']
          }
        ],
        error: null
      })

      // Run multiple validations concurrently
      const results = await Promise.all([
        validator.validateSubtopicApproval('workflow-123'),
        validator.validateSubtopicApproval('workflow-123'),
        validator.validateSubtopicApproval('workflow-123')
      ])

      // All should succeed independently
      results.forEach(result => {
        expect(result.allowed).toBe(true)
        expect(result.subtopicApprovalStatus).toBe('approved')
      })
    })
  })

  describe('logGateEnforcement', () => {
    it('should log gate enforcement for blocked access', async () => {
      // Mock workflow for audit logging
      mockSupabase.single.mockResolvedValue({
        data: {
          organization_id: 'org-123'
        },
        error: null
      })

      const mockResult = {
        allowed: false,
        subtopicApprovalStatus: 'not_approved',
        workflowStatus: 'step_8_approval',
        error: 'Subtopics must be approved'
      }

      await validator.logGateEnforcement('workflow-123', 'article-generation', mockResult)

      expect(logIntentAction).toHaveBeenCalledWith({
        organizationId: 'org-123',
        workflowId: 'workflow-123',
        entityType: 'workflow',
        entityId: 'workflow-123',
        actorId: 'system',
        action: 'workflow.gate.subtopics_blocked',
        details: {
          attempted_step: 'article-generation',
          subtopic_approval_status: 'not_approved',
          workflow_status: 'step_8_approval',
          enforcement_action: 'blocked',
          error_message: 'Subtopics must be approved'
        },
        ipAddress: null,
        userAgent: null
      })
    })

    it('should log gate enforcement for allowed access', async () => {
      // Mock workflow for audit logging
      mockSupabase.single.mockResolvedValue({
        data: {
          organization_id: 'org-123'
        },
        error: null
      })

      const mockResult = {
        allowed: true,
        subtopicApprovalStatus: 'approved',
        workflowStatus: 'step_8_approval'
      }

      await validator.logGateEnforcement('workflow-123', 'article-generation', mockResult)

      expect(logIntentAction).toHaveBeenCalledWith({
        organizationId: 'org-123',
        workflowId: 'workflow-123',
        entityType: 'workflow',
        entityId: 'workflow-123',
        actorId: 'system',
        action: 'workflow.gate.subtopics_allowed',
        details: {
          attempted_step: 'article-generation',
          subtopic_approval_status: 'approved',
          workflow_status: 'step_8_approval',
          enforcement_action: 'allowed',
          error_message: undefined
        },
        ipAddress: null,
        userAgent: null
      })
    })

    it('should log gate enforcement for error conditions', async () => {
      // Mock workflow for audit logging
      mockSupabase.single.mockResolvedValue({
        data: {
          organization_id: 'org-123'
        },
        error: null
      })

      const mockResult = {
        allowed: true,
        subtopicApprovalStatus: 'error',
        workflowStatus: 'error',
        error: 'Database error - failing open for availability'
      }

      await validator.logGateEnforcement('workflow-123', 'article-generation', mockResult)

      expect(logIntentAction).toHaveBeenCalledWith({
        organizationId: 'org-123',
        workflowId: 'workflow-123',
        entityType: 'workflow',
        entityId: 'workflow-123',
        actorId: 'system',
        action: 'workflow.gate.subtopics_error',
        details: {
          attempted_step: 'article-generation',
          subtopic_approval_status: 'error',
          workflow_status: 'error',
          enforcement_action: 'allowed',
          error_message: 'Database error - failing open for availability'
        },
        ipAddress: null,
        userAgent: null
      })
    })

    it('should handle logging errors gracefully', async () => {
      // Mock workflow for audit logging (succeeds)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock logIntentAction to throw error
      vi.mocked(logIntentAction).mockRejectedValueOnce(new Error('Logging failed'))

      const mockResult = {
        allowed: false,
        subtopicApprovalStatus: 'not_approved',
        workflowStatus: 'step_8_approval'
      }

      // Should not throw error
      await expect(
        validator.logGateEnforcement('workflow-123', 'article-generation', mockResult)
      ).resolves.not.toThrow()

      // Should still attempt to log
      expect(logIntentAction).toHaveBeenCalled()
    })

    it('should handle workflow not found in logging', async () => {
      // Mock workflow not found for audit logging
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const mockResult = {
        allowed: false,
        subtopicApprovalStatus: 'not_approved',
        workflowStatus: 'step_8_approval'
      }

      // Should not throw error
      await expect(
        validator.logGateEnforcement('invalid-workflow', 'article-generation', mockResult)
      ).resolves.not.toThrow()

      // Should not attempt to log intent action
      expect(logIntentAction).not.toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete approval workflow', async () => {
      // Test the full flow from not ready to approved
      const workflowId = 'workflow-123'

      // Step 1: Workflow before approval step
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          status: 'step_7_validation',
          organization_id: 'org-123'
        },
        error: null
      })

      let result = await validator.validateSubtopicApproval(workflowId)
      expect(result.allowed).toBe(false)
      expect(result.subtopicApprovalStatus).toBe('not_ready')

      // Step 2: Workflow at approval step but no approval yet
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock the approvals query to return empty (no approvals)
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null })

      result = await validator.validateSubtopicApproval(workflowId)
      expect(result.allowed).toBe(false)
      expect(result.subtopicApprovalStatus).toBe('not_approved')

      // Step 3: Workflow with approval
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: workflowId,
          status: 'step_8_approval',
          organization_id: 'org-123'
        },
        error: null
      })

      // Mock the approvals query to return approved
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ decision: 'approved', approved_items: ['keyword-1'] }],
        error: null
      })

      result = await validator.validateSubtopicApproval(workflowId)
      expect(result.allowed).toBe(true)
      expect(result.subtopicApprovalStatus).toBe('approved')
    })
  })
})
