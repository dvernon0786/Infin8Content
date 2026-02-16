import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { ICPGateValidator } from '@/lib/services/intent-engine/icp-gate-validator'

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

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockWorkflow)
          })
        })
      })

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

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockWorkflow)
          })
        })
      })

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.icpStatus).toBe('step_1_icp')
      expect(result.workflowStatus).toBe('step_1_icp')
      expect(result.error).toContain('ICP completion required')
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const dbError = new Error('Database connection failed')

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(dbError)
          })
        })
      })

      // Act
      const result = await validator.validateICPCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true) // Fail-open for availability
      expect(result.error).toContain('Unexpected error')
    })
  })
})
