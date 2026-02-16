import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SeedApprovalGateValidator } from '@/lib/services/intent-engine/seed-approval-gate-validator'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('SeedApprovalGateValidator', () => {
  let validator: SeedApprovalGateValidator
  let mockSupabase: any

  beforeEach(() => {
    validator = new SeedApprovalGateValidator()
    mockSupabase = {
      from: vi.fn()
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    vi.mocked(logIntentAction).mockResolvedValue(undefined)
  })

  describe('validateSeedApproval', () => {
    it('should allow access when seed approval is approved', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_3_seeds',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      const mockApprovalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            decision: 'approved',
            approved_items: ['seed-1', 'seed-2']
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockWorkflowQuery)
        .mockReturnValueOnce(mockApprovalQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('approved')
      expect(result.workflowState).toBe('step_3_seeds')
    })

    it('should block access when seed approval is not approved', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_3_seeds',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      const mockApprovalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockWorkflowQuery)
        .mockReturnValueOnce(mockApprovalQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(false)
      expect(result.seedApprovalStatus).toBe('not_approved')
      expect(result.error).toContain('must be approved')
      expect(result.errorResponse).toBeDefined()
    })

    it('should return not_required when workflow is not at step_3_seeds', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_4_longtails',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('not_required')
    })

    it('should return not_found when workflow does not exist', async () => {
      const workflowId = 'workflow-invalid'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(false)
      expect(result.seedApprovalStatus).toBe('not_found')
      expect(result.workflowState).toBe('not_found')
    })

    it('should fail open on workflow database error', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST999', message: 'Database error' }
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('error')
      expect(result.error).toContain('failing open')
    })

    it('should fail open on approval database error', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_3_seeds',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      const mockApprovalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST999', message: 'Database error' }
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockWorkflowQuery)
        .mockReturnValueOnce(mockApprovalQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('error')
      expect(result.error).toContain('failing open')
    })

    it('should fail open on unexpected error', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error')
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('error')
      expect(result.error).toContain('failing open')
    })

    it('should block when workflow is before step_3_seeds', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_2_competitors',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(false)
      expect(result.seedApprovalStatus).toBe('not_ready')
      expect(result.error).toContain('not yet extracted')
    })

    it('should allow when workflow is beyond step_3_seeds', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_4_longtails',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('not_required')
    })

    it('should handle approval with null approved_items', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_3_seeds',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      const mockApprovalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            decision: 'approved',
            approved_items: null
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(mockWorkflowQuery)
        .mockReturnValueOnce(mockApprovalQuery)

      const result = await validator.validateSeedApproval(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.seedApprovalStatus).toBe('approved')
    })
  })

  describe('logGateEnforcement', () => {
    it('should log gate enforcement when allowed', async () => {
      const workflowId = 'workflow-123'
      const stepName = 'longtail-expand'
      const result = {
        allowed: true,
        seedApprovalStatus: 'approved',
        workflowState: 'step_3_seeds'
      }

      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      await validator.logGateEnforcement(workflowId, stepName, result)

      expect(logIntentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          action: 'workflow.gate.seeds_allowed',
          details: expect.objectContaining({
            attempted_step: stepName,
            enforcement_action: 'allowed'
          })
        })
      )
    })

    it('should log gate enforcement when blocked', async () => {
      const workflowId = 'workflow-123'
      const stepName = 'longtail-expand'
      const result = {
        allowed: false,
        seedApprovalStatus: 'not_approved',
        workflowState: 'step_3_seeds',
        error: 'Seed keywords must be approved'
      }

      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      await validator.logGateEnforcement(workflowId, stepName, result)

      expect(logIntentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          action: 'workflow.gate.seeds_blocked',
          details: expect.objectContaining({
            attempted_step: stepName,
            enforcement_action: 'blocked'
          })
        })
      )
    })

    it('should handle missing workflow gracefully during logging', async () => {
      const workflowId = 'workflow-invalid'
      const stepName = 'longtail-expand'
      const result = {
        allowed: false,
        seedApprovalStatus: 'not_approved',
        workflowState: 'step_3_seeds'
      }

      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }

      vi.mocked(logIntentAction).mockClear()
      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      // Should not throw
      await expect(
        validator.logGateEnforcement(workflowId, stepName, result)
      ).resolves.not.toThrow()

      expect(logIntentAction).not.toHaveBeenCalled()
    })

    it('should handle logging errors gracefully', async () => {
      const workflowId = 'workflow-123'
      const stepName = 'longtail-expand'
      const result = {
        allowed: false,
        seedApprovalStatus: 'not_approved',
        workflowState: 'step_3_seeds'
      }

      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)
      vi.mocked(logIntentAction).mockRejectedValueOnce(new Error('Logging failed'))

      // Should not throw
      await expect(
        validator.logGateEnforcement(workflowId, stepName, result)
      ).resolves.not.toThrow()
    })
  })
})
