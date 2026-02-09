/**
 * Blocking Condition Resolver Tests
 * Story 39-7: Display Workflow Blocking Conditions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BlockingConditionResolver } from '@/lib/services/intent-engine/blocking-condition-resolver'
import { createServiceRoleClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('BlockingConditionResolver', () => {
  let resolver: BlockingConditionResolver
  let mockSupabase: any

  beforeEach(() => {
    resolver = new BlockingConditionResolver()
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
  })

  describe('resolveBlockingCondition', () => {
    it('should return null when workflow is not blocked', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-1',
          status: 'step_2_competitors',
          organization_id: 'org-1',
        },
        error: null,
      })

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).toBeNull()
    })

    it('should return blocking condition when ICP is required', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-1',
          status: 'step_0_auth',
          organization_id: 'org-1',
        },
        error: null,
      })

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).not.toBeNull()
      expect(result?.blocked_at_step).toBe('step_0_auth')
      expect(result?.blocking_gate).toBe('gate_icp_required')
      expect(result?.blocking_reason).toContain('ICP generation required')
      expect(result?.required_action).toContain('Generate ICP document')
    })

    it('should return blocking condition when competitors are required', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-1',
          status: 'step_1_icp',
          organization_id: 'org-1',
        },
        error: null,
      })

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).not.toBeNull()
      expect(result?.blocked_at_step).toBe('step_1_icp')
      expect(result?.blocking_gate).toBe('gate_competitors_required')
      expect(result?.blocking_reason).toContain('Competitor analysis required')
    })

    it('should return blocking condition when seed approval is required', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-1',
          status: 'step_3_seeds',
          organization_id: 'org-1',
          seed_keywords_approved: false,
        },
        error: null,
      })

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).not.toBeNull()
      expect(result?.blocking_gate).toBe('gate_seeds_approval_required')
      expect(result?.blocking_reason).toContain('must be approved')
    })

    it('should return null when workflow not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST001', message: 'Database error' },
      })

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).toBeNull()
    })

    it('should handle unexpected errors', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Unexpected error'))

      const result = await resolver.resolveBlockingCondition('workflow-1', 'org-1')

      expect(result).toBeNull()
    })
  })

  describe('getBlockingConditionMap', () => {
    it('should return correct blocking condition for each step', () => {
      const map = resolver.getBlockingConditionMap()

      expect(map.step_0_auth).toBeDefined()
      expect(map.step_0_auth.gate_id).toBe('gate_icp_required')
      expect(map.step_1_icp).toBeDefined()
      expect(map.step_1_icp.gate_id).toBe('gate_competitors_required')
    })

    it('should have action links for all blocking conditions', () => {
      const map = resolver.getBlockingConditionMap()

      Object.values(map).forEach((condition) => {
        expect(condition.action_link_template).toBeDefined()
        expect(condition.action_link_template).toContain('{workflow_id}')
      })
    })
  })

  describe('formatBlockingCondition', () => {
    it('should format blocking condition with all required fields', () => {
      const condition = resolver.formatBlockingCondition(
        'workflow-1',
        'step_0_auth',
        'gate_icp_required',
        'ICP generation required before competitor analysis',
        'Generate ICP document'
      )

      expect(condition.blocked_at_step).toBe('step_0_auth')
      expect(condition.blocking_gate).toBe('gate_icp_required')
      expect(condition.blocking_reason).toBe('ICP generation required before competitor analysis')
      expect(condition.required_action).toBe('Generate ICP document')
      expect(condition.action_link).toContain('workflow-1')
      expect(condition.blocked_since).toBeDefined()
    })
  })

  describe('isWorkflowBlocked', () => {
    it('should return true when workflow is at step_0_auth', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-1',
          status: 'step_0_auth',
          organization_id: 'org-1',
        },
        error: null,
      })

      const result = await resolver.isWorkflowBlocked('workflow-1', 'org-1')

      expect(result).toBe(true)
    })

    it('should return false when workflow has progressed past initial step', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'workflow-1',
          status: 'step_2_competitors',
          organization_id: 'org-1',
        },
        error: null,
      })

      const result = await resolver.isWorkflowBlocked('workflow-1', 'org-1')

      expect(result).toBe(false)
    })
  })
})
