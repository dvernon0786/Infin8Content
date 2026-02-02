import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'

// Mock the ICP gate validator module
const { mockValidateICPCompletion, mockLogGateEnforcement } = vi.hoisted(() => {
  return {
    mockValidateICPCompletion: vi.fn(),
    mockLogGateEnforcement: vi.fn().mockResolvedValue(undefined)
  }
})

vi.mock('@/lib/services/intent-engine/icp-gate-validator', () => ({
  ICPGateValidator: class {
    constructor() {
      this.validateICPCompletion = mockValidateICPCompletion
      this.logGateEnforcement = mockLogGateEnforcement
    }
  }
}))

describe('ICP Gate Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate ICP completion in under 50ms when allowed', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const stepName = 'competitor-analyze'
    
    mockValidateICPCompletion.mockResolvedValue({
      allowed: true,
      icpStatus: 'step_2_icp_complete',
      workflowStatus: 'step_2_icp_complete'
    })

    // Act
    const startTime = performance.now()
    const result = await enforceICPGate(workflowId, stepName)
    const endTime = performance.now()
    const duration = endTime - startTime

    // Assert
    expect(result).toBeNull() // null means allowed
    expect(duration).toBeLessThan(50) // Should be under 50ms
    expect(mockValidateICPCompletion).toHaveBeenCalledWith(workflowId)
  })

  it('should validate ICP completion in under 50ms when blocked', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const stepName = 'competitor-analyze'
    
    mockValidateICPCompletion.mockResolvedValue({
      allowed: false,
      icpStatus: 'step_1_icp',
      workflowStatus: 'step_1_icp',
      error: 'ICP completion required',
      errorResponse: {
        error: 'ICP completion required',
        workflowStatus: 'step_1_icp',
        icpStatus: 'step_1_icp',
        requiredAction: 'Complete ICP generation (step 2) before proceeding'
      }
    })

    // Act
    const startTime = performance.now()
    const result = await enforceICPGate(workflowId, stepName)
    const endTime = performance.now()
    const duration = endTime - startTime

    // Assert
    expect(result).not.toBeNull()
    expect(result?.status).toBe(423)
    expect(duration).toBeLessThan(50) // Should be under 50ms
  })

  it('should handle database errors gracefully in under 50ms', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const stepName = 'competitor-analyze'
    
    mockValidateICPCompletion.mockRejectedValue(new Error('Database connection failed'))

    // Act
    const startTime = performance.now()
    const result = await enforceICPGate(workflowId, stepName)
    const endTime = performance.now()
    const duration = endTime - startTime

    // Assert
    expect(result).toBeNull() // Fail open - allow access
    expect(duration).toBeLessThan(50) // Should be under 50ms even with errors
  })
})
