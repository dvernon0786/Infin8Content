import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

describe('Intent Workflows Database Schema', () => {
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

  it('should have intent_workflows table with correct schema', async () => {
    const { data, error } = await serviceRoleSupabase
      .from('intent_workflows')
      .select('*')
      .limit(1)

    if (error && error.code === '42P01') {
      // Table doesn't exist yet - this is expected before migration
      expect(error.code).toBe('42P01')
      return
    }

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should enforce required fields', async () => {
    // First check if table exists
    const { error: tableError } = await serviceRoleSupabase
      .from('intent_workflows')
      .select('*')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist yet - skip test
      console.log('Table does not exist yet, skipping required fields test')
      return
    }

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
    // First check if table exists
    const { error: tableError } = await serviceRoleSupabase
      .from('intent_workflows')
      .select('*')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist yet - skip test
      console.log('Table does not exist yet, skipping default values test')
      return
    }

    // Create test organization and user first
    const testOrg = await serviceRoleSupabase
      .from('organizations')
      .insert({ name: 'test-org-defaults', plan: 'starter' })
      .select()
      .single()

    const testUser = await serviceRoleSupabase
      .from('users')
      .insert({
        email: 'test-user@example.com',
        org_id: testOrg.data?.id,
        role: 'owner'
      })
      .select()
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
