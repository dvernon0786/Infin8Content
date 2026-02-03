import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkflowGateValidator } from '@/lib/services/intent-engine/workflow-gate-validator'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('WorkflowGateValidator', () => {
  let validator: WorkflowGateValidator
  let mockSupabase: any

  beforeEach(() => {
    validator = new WorkflowGateValidator()
    mockSupabase = {
      from: vi.fn()
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    vi.mocked(logIntentAction).mockResolvedValue(undefined)
  })

  describe('validateLongtailsRequiredForSubtopics', () => {
    it('should allow access when both longtails and clustering are complete', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_7_validation',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.longtailStatus).toBe('complete')
      expect(result.clusteringStatus).toBe('complete')
      expect(result.workflowStatus).toBe('step_7_validation')
    })

    it('should block access when longtails are not complete', async () => {
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

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(false)
      expect(result.longtailStatus).toBe('not_complete')
      expect(result.clusteringStatus).toBe('not_complete')
      expect(result.error).toContain('Longtail expansion and clustering required')
      expect(result.errorResponse).toBeDefined()
    })

    it('should block access when clustering is not complete but longtails are', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_5_filtering',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(false)
      expect(result.longtailStatus).toBe('complete')
      expect(result.clusteringStatus).toBe('not_complete')
      expect(result.error).toContain('topic clustering (step 6)')
    })

    it('should allow access when workflow is at step_8_subtopics or beyond', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_8_subtopics',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.longtailStatus).toBe('complete')
      expect(result.clusteringStatus).toBe('complete')
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

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(false)
      expect(result.longtailStatus).toBe('not_found')
      expect(result.clusteringStatus).toBe('not_found')
      expect(result.workflowStatus).toBe('not_found')
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

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.longtailStatus).toBe('error')
      expect(result.clusteringStatus).toBe('error')
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

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.longtailStatus).toBe('error')
      expect(result.clusteringStatus).toBe('error')
      expect(result.error).toContain('failing open')
    })

    it('should provide detailed error response with missing prerequisites', async () => {
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

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.errorResponse).toBeDefined()
      expect(result.errorResponse?.missingPrerequisites).toContain('longtail expansion (step 4)')
      expect(result.errorResponse?.missingPrerequisites).toContain('topic clustering (step 6)')
      expect(result.errorResponse?.requiredAction).toContain('Complete longtail expansion')
    })

    it('should allow access at step_9_articles', async () => {
      const workflowId = 'workflow-123'
      const mockWorkflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: workflowId,
            status: 'step_9_articles',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from.mockReturnValueOnce(mockWorkflowQuery)

      const result = await validator.validateLongtailsRequiredForSubtopics(workflowId)

      expect(result.allowed).toBe(true)
      expect(result.longtailStatus).toBe('complete')
      expect(result.clusteringStatus).toBe('complete')
    })
  })

  describe('logGateEnforcement', () => {
    it('should log gate enforcement when allowed', async () => {
      const workflowId = 'workflow-123'
      const stepName = 'subtopic-generation'
      const result = {
        allowed: true,
        longtailStatus: 'complete',
        clusteringStatus: 'complete',
        workflowStatus: 'step_7_validation'
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
          action: 'workflow.gate.longtails_allowed',
          details: expect.objectContaining({
            attempted_step: stepName,
            enforcement_action: 'allowed'
          })
        })
      )
    })

    it('should log gate enforcement when blocked', async () => {
      const workflowId = 'workflow-123'
      const stepName = 'subtopic-generation'
      const result = {
        allowed: false,
        longtailStatus: 'not_complete',
        clusteringStatus: 'not_complete',
        workflowStatus: 'step_3_seeds',
        error: 'Longtail expansion and clustering required'
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
          action: 'workflow.gate.longtails_blocked',
          details: expect.objectContaining({
            attempted_step: stepName,
            enforcement_action: 'blocked'
          })
        })
      )
    })

    it('should log gate enforcement error when status is error', async () => {
      const workflowId = 'workflow-123'
      const stepName = 'subtopic-generation'
      const result = {
        allowed: false,
        longtailStatus: 'error',
        clusteringStatus: 'error',
        workflowStatus: 'error',
        error: 'Database error'
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
          action: 'workflow.gate.longtails_error'
        })
      )
    })

    it('should handle missing workflow gracefully during logging', async () => {
      const workflowId = 'workflow-invalid'
      const stepName = 'subtopic-generation'
      const result = {
        allowed: false,
        longtailStatus: 'not_complete',
        clusteringStatus: 'not_complete',
        workflowStatus: 'step_3_seeds'
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
      const stepName = 'subtopic-generation'
      const result = {
        allowed: false,
        longtailStatus: 'not_complete',
        clusteringStatus: 'not_complete',
        workflowStatus: 'step_3_seeds'
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
