import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { SeedApprovalGateValidator } from '@/lib/services/intent-engine/seed-approval-gate-validator'

vi.mock('@/lib/services/intent-engine/seed-approval-gate-validator')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('Seed Approval Gate Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enforceSeedApprovalGate', () => {
    it('should be exported from intent-engine-gate', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      expect(typeof enforceSeedApprovalGate).toBe('function')
    })

    it('should be a function that accepts workflowId and stepName', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      expect(enforceSeedApprovalGate.length).toBe(2)
    })

    it('should have withSeedApprovalGate wrapper function', async () => {
      const { withSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      expect(typeof withSeedApprovalGate).toBe('function')
    })
  })

  describe('Gate Function Signature', () => {
    it('should return Promise<NextResponse | null>', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      const result = enforceSeedApprovalGate('test-id', 'test-step')
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('Gate Blocking Behavior', () => {
    it('should return 423 response when seeds not approved', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: false,
          seedApprovalStatus: 'not_approved',
          workflowStatus: 'step_3_seeds',
          error: 'Seed keywords must be approved before longtail expansion',
          errorResponse: {
            error: 'Seed keywords must be approved before longtail expansion',
            workflowStatus: 'step_3_seeds',
            seedApprovalStatus: 'not_approved',
            requiredAction: 'Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds',
            currentStep: 'longtail-expand',
            blockedAt: new Date().toISOString()
          }
        }),
        logGateEnforcement: vi.fn().mockResolvedValue(undefined)
      } as any))

      const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response?.status).toBe(423)
    })

    it('should return null when seeds are approved', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: true,
          seedApprovalStatus: 'approved',
          workflowStatus: 'step_3_seeds'
        }),
        logGateEnforcement: vi.fn().mockResolvedValue(undefined)
      } as any))

      const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(response).toBeNull()
    })

    it('should return 423 with proper error response format', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: false,
          seedApprovalStatus: 'not_approved',
          workflowStatus: 'step_3_seeds',
          error: 'Seed keywords must be approved before longtail expansion',
          errorResponse: {
            error: 'Seed keywords must be approved before longtail expansion',
            workflowStatus: 'step_3_seeds',
            seedApprovalStatus: 'not_approved',
            requiredAction: 'Approve seed keywords via POST /api/intent/workflows/{workflow_id}/steps/approve-seeds',
            currentStep: 'longtail-expand',
            blockedAt: new Date().toISOString()
          }
        }),
        logGateEnforcement: vi.fn().mockResolvedValue(undefined)
      } as any))

      const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(response?.status).toBe(423)
      const body = await response?.json()
      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('workflowStatus')
      expect(body).toHaveProperty('seedApprovalStatus')
      expect(body).toHaveProperty('requiredAction')
      expect(body).toHaveProperty('currentStep')
      expect(body).toHaveProperty('blockedAt')
    })
  })

  describe('Error Handling', () => {
    it('should fail open on database errors', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: true,
          seedApprovalStatus: 'error',
          workflowStatus: 'error',
          error: 'Database error - failing open for availability'
        }),
        logGateEnforcement: vi.fn().mockResolvedValue(undefined)
      } as any))

      const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(response).toBeNull()
    })

    it('should handle validator exceptions gracefully', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockRejectedValue(new Error('Unexpected error')),
        logGateEnforcement: vi.fn().mockResolvedValue(undefined)
      } as any))

      const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(response).toBeNull()
    })
  })

  describe('Audit Logging', () => {
    it('should log gate enforcement when blocked', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      const mockLogGateEnforcement = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: false,
          seedApprovalStatus: 'not_approved',
          workflowStatus: 'step_3_seeds',
          error: 'Seed keywords must be approved'
        }),
        logGateEnforcement: mockLogGateEnforcement
      } as any))

      await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(mockLogGateEnforcement).toHaveBeenCalledWith(
        'workflow-123',
        'longtail-expand',
        expect.objectContaining({
          allowed: false,
          seedApprovalStatus: 'not_approved'
        })
      )
    })

    it('should not log when gate passes', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      const mockLogGateEnforcement = vi.fn().mockResolvedValue(undefined)
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: true,
          seedApprovalStatus: 'approved',
          workflowStatus: 'step_3_seeds'
        }),
        logGateEnforcement: mockLogGateEnforcement
      } as any))

      await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      
      expect(mockLogGateEnforcement).not.toHaveBeenCalled()
    })
  })

  describe('Middleware Integration', () => {
    it('should be callable with workflow ID and step name', async () => {
      const { enforceSeedApprovalGate } = await import('@/lib/middleware/intent-engine-gate')
      
      vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
        validateSeedApproval: vi.fn().mockResolvedValue({
          allowed: true,
          seedApprovalStatus: 'approved',
          workflowStatus: 'step_3_seeds'
        }),
        logGateEnforcement: vi.fn().mockResolvedValue(undefined)
      } as any))

      const result = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
      expect(result).toBeNull()
    })
  })
})
