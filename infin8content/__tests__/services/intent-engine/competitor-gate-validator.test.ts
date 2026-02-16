/**
 * Unit Tests for CompetitorGateValidator
 * Story 39.2: Enforce Hard Gate - Competitors Required for Seed Keywords
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CompetitorGateValidator } from '@/lib/services/intent-engine/competitor-gate-validator'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('CompetitorGateValidator', () => {
  let validator: CompetitorGateValidator
  let mockSupabase: any
  let mockSingle: any

  beforeEach(() => {
    vi.clearAllMocks()
    validator = new CompetitorGateValidator()
    
    // Create simple mock structure matching actual validator usage
    mockSingle = vi.fn()
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      }))
    }
    
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
  })

  describe('validateCompetitorCompletion', () => {
    it('should allow access when workflow status is step_3_competitors', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        id: workflowId,
        status: 'step_3_competitors',
        organization_id: 'test-org-id',
        competitor_completed_at: '2026-02-03T10:00:00Z'
      }
      
      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.competitorStatus).toBe('step_3_competitors')
      expect(result.workflowState).toBe('step_3_competitors')
      expect(result.error).toBeUndefined()
    })

    it('should allow access when workflow status is step_4_longtails', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        id: workflowId,
        status: 'step_4_longtails',
        organization_id: 'test-org-id',
        competitor_completed_at: '2026-02-03T10:00:00Z'
      }
      
      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.competitorStatus).toBe('step_4_longtails')
      expect(result.workflowState).toBe('step_4_longtails')
    })

    it('should block access when workflow status is step_2_icp_complete', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        id: workflowId,
        status: 'step_2_icp_complete',
        organization_id: 'test-org-id',
        competitor_completed_at: null
      }
      
      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.competitorStatus).toBe('step_2_icp_complete')
      expect(result.workflowState).toBe('step_2_icp_complete')
      expect(result.error).toBe('Competitor analysis required before seed keywords')
      expect(result.errorResponse).toEqual({
        error: 'Competitor analysis required before seed keywords',
        workflowState: 'step_2_icp_complete',
        competitorStatus: 'not_complete',
        requiredAction: 'Complete competitor analysis (step 2) before proceeding',
        currentStep: 'step_2_icp_complete',
        blockedAt: expect.any(String)
      })
    })

    it('should block access when workflow status is step_1_icp', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        id: workflowId,
        status: 'step_1_icp',
        organization_id: 'test-org-id',
        competitor_completed_at: null
      }
      
      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.competitorStatus).toBe('step_1_icp')
      expect(result.workflowState).toBe('step_1_icp')
      expect(result.error).toBe('Competitor analysis required before seed keywords')
    })

    it('should fail open when database error occurs', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST301', message: 'Database connection failed' }
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.competitorStatus).toBe('error')
      expect(result.workflowState).toBe('error')
      expect(result.error).toBe('Database error - failing open for availability')
    })

    it('should return not found when workflow does not exist', async () => {
      // Arrange
      const workflowId = 'non-existent-workflow'
      
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.competitorStatus).toBe('not_found')
      expect(result.workflowState).toBe('not_found')
      expect(result.error).toBe('Workflow not found')
      expect(result.errorResponse).toEqual({
        error: 'Workflow not found',
        workflowId,
        requiredAction: 'Provide valid workflow ID'
      })
    })

    it('should fail open when unexpected error occurs', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      // Act
      const result = await validator.validateCompetitorCompletion(workflowId)

      // Assert
      expect(result.allowed).toBe(true)
      expect(result.competitorStatus).toBe('error')
      expect(result.workflowState).toBe('error')
      expect(result.error).toBe('Unexpected error - failing open for availability')
    })

    it('should handle key allowed statuses individually', async () => {
      const testCases = [
        'step_3_competitors',
        'step_4_longtails', 
        'step_5_filtering',
        'completed'
      ]

      for (const status of testCases) {
        // Reset mocks for each iteration
        mockSingle = vi.fn()
        mockSupabase = {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: mockSingle
              }))
            }))
          }))
        }
        vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
        
        // Arrange
        const workflowId = 'test-workflow-id'
        const mockWorkflow = {
          id: workflowId,
          status,
          organization_id: 'test-org-id',
          competitor_completed_at: '2026-02-03T10:00:00Z'
        }
        
        mockSingle.mockResolvedValue({
          data: mockWorkflow,
          error: null
        })

        // Act
        const result = await validator.validateCompetitorCompletion(workflowId)

        // Assert
        expect(result.allowed).toBe(true)
        expect(result.workflowState).toBe(status)
      }
    })

    it('should handle key blocked statuses individually', async () => {
      const testCases = [
        'step_0_auth',
        'step_1_icp',
        'step_2_icp_complete'
      ]

      for (const status of testCases) {
        // Reset mocks for each iteration
        mockSingle = vi.fn()
        mockSupabase = {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: mockSingle
              }))
            }))
          }))
        }
        vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
        
        // Arrange
        const workflowId = 'test-workflow-id'
        const mockWorkflow = {
          id: workflowId,
          status,
          organization_id: 'test-org-id',
          competitor_completed_at: null
        }
        
        mockSingle.mockResolvedValue({
          data: mockWorkflow,
          error: null
        })

        // Act
        const result = await validator.validateCompetitorCompletion(workflowId)

        // Assert
        expect(result.allowed).toBe(false)
        expect(result.workflowState).toBe(status)
        expect(result.error).toBe('Competitor analysis required before seed keywords')
      }
    })
  })

  describe('logGateEnforcement', () => {
    let mockLogSupabase: any
    let mockLogSingle: any

    beforeEach(() => {
      // Create separate mock for logging tests
      mockLogSingle = vi.fn()
      mockLogSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockLogSingle
            }))
          }))
        }))
      }
      
      // Override the mock for logging tests
      vi.mocked(createServiceRoleClient).mockReturnValue(mockLogSupabase)
      vi.mocked(logIntentAction).mockResolvedValue(undefined)
    })

    it('should log gate enforcement when allowed', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'seed-extract'
      const gateResult = {
        allowed: true,
        competitorStatus: 'step_3_competitors',
        workflowState: 'step_3_competitors'
      }
      
      const mockWorkflow = {
        organization_id: 'test-org-id'
      }
      
      mockLogSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      await validator.logGateEnforcement(workflowId, stepName, gateResult)

      // Assert
      expect(mockLogSupabase.from).toHaveBeenCalledWith('intent_workflows')
      expect(logIntentAction).toHaveBeenCalledWith({
        organizationId: 'test-org-id',
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: 'system',
        action: 'workflow.gate.competitors_allowed',
        details: {
          attempted_step: stepName,
          competitor_status: 'step_3_competitors',
          workflow_status: 'step_3_competitors',
          enforcement_action: 'allowed',
          error_message: undefined
        },
        ipAddress: null,
        userAgent: null
      })
    })

    it('should log gate enforcement when blocked', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'seed-extract'
      const gateResult = {
        allowed: false,
        competitorStatus: 'step_2_icp_complete',
        workflowState: 'step_2_icp_complete',
        error: 'Competitor analysis required before seed keywords'
      }
      
      const mockWorkflow = {
        organization_id: 'test-org-id'
      }
      
      mockLogSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      await validator.logGateEnforcement(workflowId, stepName, gateResult)

      // Assert
      expect(logIntentAction).toHaveBeenCalledWith({
        organizationId: 'test-org-id',
        workflowId,
        entityType: 'workflow',
        entityId: workflowId,
        actorId: 'system',
        action: 'workflow.gate.competitors_blocked',
        details: {
          attempted_step: stepName,
          competitor_status: 'step_2_icp_complete',
          workflow_status: 'step_2_icp_complete',
          enforcement_action: 'blocked',
          error_message: 'Competitor analysis required before seed keywords'
        },
        ipAddress: null,
        userAgent: null
      })
    })

    it('should handle logging errors gracefully', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const stepName = 'seed-extract'
      const gateResult = {
        allowed: true,
        competitorStatus: 'step_3_competitors',
        workflowState: 'step_3_competitors'
      }
      
      mockLogSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Workflow not found' }
      })

      vi.mocked(logIntentAction).mockRejectedValue(new Error('Logging failed'))

      // Act & Assert - should not throw
      await expect(validator.logGateEnforcement(workflowId, stepName, gateResult)).resolves.toBeUndefined()
    })
  })

  describe('Performance', () => {
    it('should complete validation within 100ms for happy path', async () => {
      // Arrange
      const workflowId = 'test-workflow-id'
      const mockWorkflow = {
        id: workflowId,
        status: 'step_3_competitors',
        organization_id: 'test-org-id',
        competitor_completed_at: '2026-02-03T10:00:00Z'
      }
      
      mockSingle.mockResolvedValue({
        data: mockWorkflow,
        error: null
      })

      // Act
      const startTime = Date.now()
      const result = await validator.validateCompetitorCompletion(workflowId)
      const duration = Date.now() - startTime

      // Assert
      expect(result.allowed).toBe(true)
      expect(duration).toBeLessThan(100)
    })
  })
})
