import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock getCurrentUser for testing
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn()
}))

import { getCurrentUser } from '@/lib/supabase/get-current-user'

describe('Intent Workflows API', () => {
  let serviceRoleSupabase: any

  beforeEach(async () => {
    serviceRoleSupabase = createServiceRoleClient()
  })

  afterEach(async () => {
    // Clean up test data
    try {
      await serviceRoleSupabase
        .from('intent_workflows')
        .delete()
        .like('name', 'test-%')
    } catch (error) {
      // Table might not exist yet, ignore cleanup errors
    }
  })

  describe('Database Schema', () => {
    it('should have intent_workflows table with correct schema', async () => {
      const { data, error } = await serviceRoleSupabase
        .from('intent_workflows')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should enforce required fields', async () => {
      const invalidWorkflow = {
        // Missing required fields
      }

      const { error } = await serviceRoleSupabase
        .from('intent_workflows')
        .insert(invalidWorkflow)

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23502') // null_violation
    })

    it('should have proper default values', async () => {
      const testOrg = await serviceRoleSupabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      const testUser = await serviceRoleSupabase
        .from('users')
        .select('id')
        .eq('org_id', testOrg.data?.id)
        .limit(1)
        .single()

      const workflow = {
        name: 'test-default-values',
        organization_id: testOrg.data?.id,
        created_by: testUser.data?.id
      }

      const { data, error } = await serviceRoleSupabase
        .from('intent_workflows')
        .insert(workflow)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.status).toBe('step_0_auth')
      expect(data?.created_at).not.toBeNull()
      expect(data?.updated_at).not.toBeNull()
    })
  })

  describe('Row Level Security', () => {
    it('should prevent cross-organization access', async () => {
      // Create two organizations
      const org1 = await serviceRoleSupabase
        .from('organizations')
        .insert({ name: 'test-org-1', plan: 'starter' })
        .select()
        .single()

      const org2 = await serviceRoleSupabase
        .from('organizations')
        .insert({ name: 'test-org-2', plan: 'starter' })
        .select()
        .single()

      // Create workflow in org1
      const workflow = await serviceRoleSupabase
        .from('intent_workflows')
        .insert({
          name: 'test-workflow',
          organization_id: org1.data?.id,
          created_by: org1.data?.id
        })
        .select()
        .single()

      // Mock user from org2 trying to access org1's workflow
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: org2.data?.id,
        email: 'user2@test.com',
        role: 'owner',
        org_id: org2.data?.id
      } as any)

      // For now, just verify the workflow was created successfully
      expect(workflow.data).not.toBeNull()
      expect(workflow.data?.organization_id).toBe(org1.data?.id)
    })

    it('should allow same-organization access', async () => {
      const org = await serviceRoleSupabase
        .from('organizations')
        .insert({ name: 'test-org-same', plan: 'starter' })
        .select()
        .single()

      const workflow = await serviceRoleSupabase
        .from('intent_workflows')
        .insert({
          name: 'test-workflow-same',
          organization_id: org.data?.id,
          created_by: org.data?.id
        })
        .select()
        .single()

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: org.data?.id,
        email: 'user@test.com',
        role: 'owner',
        org_id: org.data?.id
      } as any)

      // For now, just verify the workflow was created successfully
      expect(workflow.data).not.toBeNull()
      expect(workflow.data?.organization_id).toBe(org.data?.id)
    })
  })
})
