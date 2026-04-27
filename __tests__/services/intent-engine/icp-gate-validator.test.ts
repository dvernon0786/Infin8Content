import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ICPGateValidator } from '@/lib/services/intent-engine/icp-gate-validator'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

// Mock audit logger
vi.mock('@/lib/services/intent-engine/intent-audit-logger', () => ({
  logIntentAction: vi.fn()
}))

describe('ICPGateValidator', () => {
  let validator: ICPGateValidator
  let mockSingle: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetAllMocks()
    validator = new ICPGateValidator()

    // Stable chain: every call to from().select().eq().single() goes to mockSingle
    mockSingle = vi.fn()
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(createServiceRoleClient).mockReturnValue({ from: mockFrom } as any)
  })

  describe('validateICPCompletion', () => {
    it('should allow access when ICP is complete', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'wf-1', state: 'step_2_icp_complete', organization_id: 'org-1', icp_data: { niche: 'SaaS' } },
        error: null
      })

      const result = await validator.validateICPCompletion('wf-1')

      expect(result.allowed).toBe(true)
      expect(result.workflowStatus).toBe('step_2_icp_complete')
      expect(result.error).toBeUndefined()
    })

    it('should block access when ICP is not complete (state = step_1_icp)', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'wf-1', state: 'step_1_icp', organization_id: 'org-1', icp_data: null },
        error: null
      })

      const result = await validator.validateICPCompletion('wf-1')

      expect(result.allowed).toBe(false)
      expect(result.workflowStatus).toBe('step_1_icp')
      expect(result.error).toContain('ICP must be completed')
    })

    it('should block access when icp_data is missing', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'wf-1', state: 'step_2_icp_complete', organization_id: 'org-1', icp_data: null },
        error: null
      })

      const result = await validator.validateICPCompletion('wf-1')

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('ICP data missing')
    })

    it('should allow access when workflow state is past ICP completion', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'wf-1', state: 'step_3_competitors', organization_id: 'org-1', icp_data: { niche: 'SaaS' } },
        error: null
      })

      const result = await validator.validateICPCompletion('wf-1')

      expect(result.allowed).toBe(true)
      expect(result.workflowStatus).toBe('step_3_competitors')
    })

    it('should handle database errors gracefully (fail closed)', async () => {
      // Supabase .single() throwing causes the catch block to return fail-closed
      mockSingle.mockRejectedValue(new Error('Database connection failed'))

      const result = await validator.validateICPCompletion('wf-1')

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('ICP validation failed unexpectedly')
    })

    it('should handle workflow not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      })

      const result = await validator.validateICPCompletion('non-existent-id')

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Workflow not found')
    })
  })

  describe('logGateEnforcement', () => {
    it('should log gate enforcement attempts', async () => {
      // Provide org data for the second supabase query inside logGateEnforcement
      mockSingle.mockResolvedValue({
        data: { organization_id: 'org-1' },
        error: null
      })

      const gateResult = {
        allowed: false,
        icpStatus: 'not_completed',
        workflowStatus: 'step_1_icp',
        error: 'ICP must be completed before competitor analysis'
      }

      await validator.logGateEnforcement('wf-1', 'competitor-analyze', gateResult)

      expect(logIntentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          workflowId: 'wf-1',
          details: expect.objectContaining({
            attempted_step: 'competitor-analyze',
            enforcement_action: 'blocked'
          })
        })
      )
    })
  })

  describe('performance', () => {
    it('should complete validation in under 50ms', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'wf-1', state: 'step_2_icp_complete', organization_id: 'org-1', icp_data: { niche: 'SaaS' } },
        error: null
      })

      const startTime = performance.now()
      await validator.validateICPCompletion('wf-1')
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})

vi.mock('@/lib/services/intent-engine/intent-audit-logger', () => ({
  logIntentAction: vi.fn()
}))

describe('ICPGateValidator', () => {
  let validator: ICPGateValidator
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    validator = new ICPGateValidator()
    
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }
    
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
  })

  describe('validateICPCompletion', () => {
    it('should allow access when ICP is complete', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        data: {
          id: workflowId,
          status: 'step_2_icp_complete',
          organization_id: 'test-org-id',
          icp_completed_at: '2026-01-31T10:00:00Z'
        },
        error: null
      }

      mockSupabase.from().select().eq().single.mockResolvedValue(mockWorkflow)

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.icpStatus).toBe('step_2_icp_complete')
      expect(result.workflowStatus).toBe('step_2_icp_complete')
      expect(result.error).toBeUndefined()
    })

    it('should block access when ICP is not complete', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        data: {
          id: workflowId,
          status: 'step_1_icp',
          organization_id: 'test-org-id',
          icp_completed_at: null
        },
        error: null
      }

      mockSupabase.from().select().eq().single.mockResolvedValue(mockWorkflow)

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.icpStatus).toBe('step_1_icp')
      expect(result.workflowStatus).toBe('step_1_icp')
      expect(result.error).toContain('ICP completion required')
    })

    it('should block access when workflow status is before ICP completion', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        data: {
          id: workflowId,
          status: 'step_0_auth',
          organization_id: 'test-org-id',
          icp_completed_at: null
        },
        error: null
      }

      mockSupabase.from().select().eq().single.mockResolvedValue(mockWorkflow)

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.icpStatus).toBe('step_0_auth')
      expect(result.workflowStatus).toBe('step_0_auth')
      expect(result.error).toContain('ICP completion required')
    })

    it('should allow access when workflow status is after ICP completion', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        data: {
          id: workflowId,
          status: 'step_3_competitors',
          organization_id: 'test-org-id',
          icp_completed_at: '2026-01-31T10:00:00Z'
        },
        error: null
      }

      mockSupabase.from().select().eq().single.mockResolvedValue(mockWorkflow)

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.icpStatus).toBe('step_3_competitors')
      expect(result.workflowStatus).toBe('step_3_competitors')
      expect(result.error).toBeUndefined()
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const dbError = new Error('Database connection failed')

      mockSupabase.from().select().eq().single.mockRejectedValue(dbError)

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true) // Fail-open for availability
      expect(result.error).toContain('Database error')
    })

    it('should handle workflow not found', async () => {
      // Arrange
      const workflowId = 'non-existent-workflow-id'
      const mockWorkflow = {
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      }

      mockSupabase.from().select().eq().single.mockResolvedValue(mockWorkflow)

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Workflow not found')
    })
  })

  describe('logGateEnforcement', () => {
    it('should log gate enforcement attempts', async () => {
      // Arrange
      const { logIntentAction } = await import('@/lib/services/intent-engine/intent-audit-logger')
      const workflowId = 'test-workflow-id'
      const stepName = 'competitor-analyze'
      const gateResult = {
        allowed: false,
        icpStatus: 'step_1_icp',
        workflowStatus: 'step_1_icp',
        error: 'ICP completion required before competitor analysis'
      }

      // Act
      await validator.logGateEnforcement(workflowId, stepName, gateResult)

      // Assert
      expect(logIntentAction).toHaveBeenCalledWith({
        orgId: expect.any(String),
        workflowId,
        action: 'workflow.gate.icp.blocked',
        details: {
          attempted_step: stepName,
          icp_status: gateResult.icpStatus,
          workflow_status: gateResult.workflowStatus,
          enforcement_action: 'blocked',
          error_message: gateResult.error
        },
        ipAddress: expect.any(String),
        userAgent: expect.any(String)
      })
    })
  })

  describe('performance', () => {
    it('should complete validation in under 50ms', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        data: {
          id: workflowId,
          status: 'step_2_icp_complete',
          organization_id: 'test-org-id',
          icp_completed_at: '2026-01-31T10:00:00Z'
        },
        error: null
      }

      mockSupabase.from().select().eq().single.mockResolvedValue(mockWorkflow)

      // Act
      const startTime = performance.now()
      await validator.validateICPCompletion(workflowId)
      const endTime = performance.now()

      // Assert
      const duration = endTime - startTime
      expect(duration).toBeLessThan(50) // Should complete in under 50ms
    })
  })
})
