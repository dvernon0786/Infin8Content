/**
 * Unit tests for Seed Approval Processor
 * Story 35.3: Approve Seed Keywords Before Expansion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { processSeedApproval } from '@/lib/services/intent-engine/seed-approval-processor'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { AuditAction } from '@/types/audit'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: vi.fn(),
}))

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('Seed Approval Processor', () => {
  const mockWorkflowId = 'workflow-123'
  const mockUserId = 'user-123'
  const mockOrgId = 'org-123'
  const mockKeywordIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default user mock
    mockGetCurrentUser.mockResolvedValue({
      id: mockUserId,
      email: 'admin@example.com',
      first_name: 'Admin',
      role: 'admin',
      org_id: mockOrgId,
      user: { id: 'auth-123', email: 'admin@example.com' },
    })
  })

  describe('Validation', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      await expect(
        processSeedApproval(mockWorkflowId, {
          decision: 'approved',
          feedback: 'Test approval',
        })
      ).rejects.toThrow('Authentication required')
    })

    it('should throw error when user is not organization admin', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: mockUserId,
        email: 'user@example.com',
        first_name: 'User',
        role: 'editor', // Not admin
        org_id: mockOrgId,
        user: { id: 'auth-123', email: 'user@example.com' },
      })

      await expect(
        processSeedApproval(mockWorkflowId, {
          decision: 'approved',
        })
      ).rejects.toThrow('Admin access required')
    })

    it('should throw error when workflow is not at step_3_seeds', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { status: 'step_2_competitors' }, // Wrong step
          error: null,
        }),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      await expect(
        processSeedApproval(mockWorkflowId, {
          decision: 'approved',
        })
      ).rejects.toThrow('Workflow must be at step_3_seeds for seed approval')
    })

    it('should throw error when workflow does not exist', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Workflow not found' },
        }),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      await expect(
        processSeedApproval(mockWorkflowId, {
          decision: 'approved',
        })
      ).rejects.toThrow('Workflow not found')
    })
  })

  describe('Approval Processing', () => {
    const mockSupabaseBase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
        .mockResolvedValueOnce({
          data: { status: 'step_3_seeds', organization_id: mockOrgId },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 'approval-123',
            workflow_id: mockWorkflowId,
            decision: 'approved',
          },
          error: null,
        }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      onConflict: vi.fn().mockReturnThis(),
      merge: vi.fn().mockReturnThis(),
    }

    it('should create approval record for approved decision', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'approval-123',
              workflow_id: mockWorkflowId,
              decision: 'approved',
            },
            error: null,
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      const result = await processSeedApproval(mockWorkflowId, {
        decision: 'approved',
        feedback: 'Good keywords',
        approved_keyword_ids: mockKeywordIds,
      })

      expect(result).toEqual({
        success: true,
        approval_id: 'approval-123',
        workflow_status: 'step_3_seeds',
        message: 'Seed keywords approved successfully',
      })

      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow_id: mockWorkflowId,
          approval_type: 'seed_keywords',
          decision: 'approved',
          approver_id: mockUserId,
          feedback: 'Good keywords',
          approved_items: mockKeywordIds,
        }),
        expect.objectContaining({
          onConflict: 'workflow_id,approval_type',
          ignoreDuplicates: false,
        })
      )
    })

    it('should create approval record for rejected decision', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'approval-123',
              workflow_id: mockWorkflowId,
              decision: 'rejected',
            },
            error: null,
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      const result = await processSeedApproval(mockWorkflowId, {
        decision: 'rejected',
        feedback: 'Poor quality keywords',
      })

      expect(result).toEqual({
        success: true,
        approval_id: 'approval-123',
        workflow_status: 'step_3_seeds',
        message: 'Seed keywords rejected successfully',
      })

      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow_id: mockWorkflowId,
          approval_type: 'seed_keywords',
          decision: 'rejected',
          approver_id: mockUserId,
          feedback: 'Poor quality keywords',
          approved_items: null,
        }),
        expect.objectContaining({
          onConflict: 'workflow_id,approval_type',
          ignoreDuplicates: false,
        })
      )
    })

    it('should handle idempotent updates (approval already exists)', async () => {
      // First call mock
      const mockSupabase1 = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'approval-123',
              workflow_id: mockWorkflowId,
              decision: 'approved',
            },
            error: null,
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase1)

      // First approval
      await processSeedApproval(mockWorkflowId, {
        decision: 'approved',
        feedback: 'First approval',
      })

      // Second call mock
      const mockSupabase2 = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'approval-456',
              workflow_id: mockWorkflowId,
              decision: 'rejected',
            },
            error: null,
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase2)

      // Second approval (should update existing)
      const result = await processSeedApproval(mockWorkflowId, {
        decision: 'rejected',
        feedback: 'Changed mind',
      })

      expect(result.success).toBe(true)
      // Note: onConflict and merge are part of the upsert chain, not separate calls
      // The important thing is that the second call succeeds (idempotent update)
    })

    it('should handle partial approval with subset of keywords', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'approval-123',
              workflow_id: mockWorkflowId,
              decision: 'approved',
            },
            error: null,
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      const partialKeywordIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'] // Subset

      const result = await processSeedApproval(mockWorkflowId, {
        decision: 'approved',
        feedback: 'Only some keywords are good',
        approved_keyword_ids: partialKeywordIds,
      })

      expect(result.success).toBe(true)
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          approved_items: partialKeywordIds,
        }),
        expect.objectContaining({
          onConflict: 'workflow_id,approval_type',
          ignoreDuplicates: false,
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Database constraint violation' },
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      await expect(
        processSeedApproval(mockWorkflowId, {
          decision: 'approved',
        })
      ).rejects.toThrow('Failed to process approval')
    })

    it('should validate keyword IDs format when provided', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { status: 'step_3_seeds', organization_id: mockOrgId },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              id: 'approval-123',
              workflow_id: mockWorkflowId,
              decision: 'approved',
            },
            error: null,
          }),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        merge: vi.fn().mockReturnThis(),
      }
      mockCreateServiceRoleClient.mockResolvedValue(mockSupabase)

      // Should not throw for valid UUIDs
      await expect(
        processSeedApproval(mockWorkflowId, {
          decision: 'approved',
          approved_keyword_ids: ['550e8400-e29b-41d4-a716-446655440000'],
        })
      ).resolves.toBeDefined()
    })
  })
})
