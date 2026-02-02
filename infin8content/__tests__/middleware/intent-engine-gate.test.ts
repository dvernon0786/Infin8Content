// Mock the ICP gate validator module with proper mock initialization
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// Mock before imports using hoisted variables
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

import { enforceICPGate, withICPGate } from '@/lib/middleware/intent-engine-gate'

describe('Intent Engine Gate Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enforceICPGate', () => {
    it('should allow access when ICP is complete', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'competitor-analyze'
      
      mockValidateICPCompletion.mockResolvedValue({
        allowed: true,
        icpStatus: 'step_2_icp_complete',
        workflowStatus: 'step_2_icp_complete'
      })

      // Act
      const result = await enforceICPGate(workflowId, stepName)

      // Assert
      expect(result).toBeNull() // null means allowed
      expect(mockValidateICPCompletion).toHaveBeenCalledWith(workflowId)
      expect(mockLogGateEnforcement).not.toHaveBeenCalled()
    })

    it('should block access when ICP is not complete', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'competitor-analyze'
      
      mockValidateICPCompletion.mockResolvedValue({
        allowed: false,
        icpStatus: 'step_1_icp',
        workflowStatus: 'step_1_icp',
        error: 'ICP completion required before competitor analysis',
        errorResponse: {
          error: 'ICP completion required before competitor analysis',
          workflowStatus: 'step_1_icp',
          icpStatus: 'step_1_icp',
          requiredAction: 'Complete ICP generation (step 2) before proceeding'
        }
      })

      // Act
      const result = await enforceICPGate(workflowId, stepName)

      // Assert
      expect(result).toBeInstanceOf(NextResponse)
      expect(result?.status).toBe(423)
      
      const responseData = await result?.json()
      expect(responseData).toMatchObject({
        error: 'ICP completion required before competitor analysis',
        workflowStatus: 'step_1_icp',
        icpStatus: 'step_1_icp',
        requiredAction: 'Complete ICP generation (step 2) before proceeding'
      })
      
      expect(mockLogGateEnforcement).toHaveBeenCalledWith(
        workflowId,
        stepName,
        expect.objectContaining({ allowed: false })
      )
    })

    it('should use default error response when none provided', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'competitor-analyze'
      
      mockValidateICPCompletion.mockResolvedValue({
        allowed: false,
        icpStatus: 'step_1_icp',
        workflowStatus: 'step_1_icp',
        error: 'ICP completion required'
        // No errorResponse provided
      })

      // Act
      const result = await enforceICPGate(workflowId, stepName)

      // Assert
      expect(result).toBeInstanceOf(NextResponse)
      expect(result?.status).toBe(423)
      
      const responseData = await result?.json()
      expect(responseData).toMatchObject({
        error: 'ICP completion required',
        workflowStatus: 'step_1_icp',
        icpStatus: 'step_1_icp',
        requiredAction: 'Complete ICP generation (step 2) before proceeding',
        currentStep: stepName,
        blockedAt: expect.any(String)
      })
    })

    it('should fail open when gate enforcement throws error', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'competitor-analyze'
      
      mockValidateICPCompletion.mockRejectedValue(new Error('Gate failure'))

      // Act
      const result = await enforceICPGate(workflowId, stepName)

      // Assert
      expect(result).toBeNull() // Fail open - allow access
      expect(mockLogGateEnforcement).toHaveBeenCalledWith(
        workflowId,
        stepName,
        expect.objectContaining({ 
          allowed: true,
          error: 'Gate enforcement failed - failing open for availability'
        })
      )
    })

    it('should handle logging failures gracefully', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'competitor-analyze'
      
      mockValidateICPCompletion.mockResolvedValue({
        allowed: false,
        icpStatus: 'step_1_icp',
        workflowStatus: 'step_1_icp',
        error: 'ICP completion required'
      })
      
      mockLogGateEnforcement.mockRejectedValue(new Error('Logging failed'))

      // Act
      const result = await enforceICPGate(workflowId, stepName)

      // Assert
      expect(result).toBeInstanceOf(NextResponse)
      expect(result?.status).toBe(423)
      // Should still return blocked response even if logging fails
    })
  })

  describe('withICPGate', () => {
    it('should create a middleware function for specific step', async () => {
      // Arrange
      const stepName = 'competitor-analyze'
      const workflowId = 'test-workflow-id'
      
      mockValidateICPCompletion.mockResolvedValue({
        allowed: true,
        icpStatus: 'step_2_icp_complete',
        workflowStatus: 'step_2_icp_complete'
      })

      // Act
      const middleware = withICPGate(stepName)
      const result = await middleware(workflowId)

      // Assert
      expect(typeof middleware).toBe('function')
      expect(result).toBeNull()
      expect(mockValidateICPCompletion).toHaveBeenCalledWith(workflowId)
    })
  })
})
