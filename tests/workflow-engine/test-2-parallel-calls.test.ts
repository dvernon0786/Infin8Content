/**
 * Test 2 - Parallel 3 Calls
 * 
 * Verify: 1 success, 2 failures (409), exactly 1 keyword set, final state = COMPLETED
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState } from '@/types/workflow-state'
import { getWorkflowState } from '@/lib/services/workflow-engine/transition-engine'

describe('Workflow Engine - Test 2: Parallel Calls', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string
  let testUserId: string
  let workflowId: string

  beforeEach(async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org Parallel' })
      .select('id')
      .single()
    testOrgId = org!.id

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-parallel@example.com',
      password: 'test123456',
      email_confirm: true
    })
    testUserId = user.user!.id

    // Create workflow in COMPETITOR_PENDING state
    const { data: workflow } = await supabase
      .from('intent_workflows')
      .insert({
        organization_id: testOrgId,
        created_by: testUserId,
        state: WorkflowState.COMPETITOR_PENDING,
        title: 'Test Workflow Parallel'
      })
      .select('id')
      .single()
    workflowId = workflow!.id

    // Add test competitors
    await supabase
      .from('organization_competitors')
      .insert([
        {
          organization_id: testOrgId,
          url: 'https://competitor1.com',
          domain: 'competitor1.com',
          is_active: true
        }
      ])
  })

  afterEach(async () => {
    // Cleanup
    await supabase
      .from('keywords')
      .delete()
      .eq('workflow_id', workflowId)

    await supabase
      .from('intent_workflows')
      .delete()
      .eq('id', workflowId)

    await supabase
      .from('organization_competitors')
      .delete()
      .eq('organization_id', testOrgId)

    await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrgId)

    await supabase.auth.admin.deleteUser(testUserId)
  })

  it('should handle 3 parallel calls with 1 success and 2 conflicts', async () => {
    // Verify initial state
    const initialState = await getWorkflowState(workflowId, testOrgId)
    expect(initialState).toBe(WorkflowState.COMPETITOR_PENDING)

    // Run 3 parallel calls
    const parallelCalls = await Promise.allSettled([
      fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`
        }
      }),
      fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`
        }
      }),
      fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserId}`
        }
      })
    ])

    // Analyze results
    const results = await Promise.all(
      parallelCalls.map(async (r) => {
        if (r.status === 'fulfilled') {
          const response = r.value as Response
          const json = await response.json().catch(() => ({}))
          return {
            status: response.status,
            success: json.success,
            error: json.error
          }
        }
        return { status: 500, success: false, error: 'Promise rejected' }
      })
    )

    const successes = results.filter(r => r.status === 200 && r.success)
    const conflicts = results.filter(r => r.status === 409)

    // ATOMICITY ASSERTIONS
    expect(successes.length).toBe(1) // Only one should succeed
    expect(conflicts.length).toBe(2) // Two should fail with 409

    // Verify final state
    const finalState = await getWorkflowState(workflowId, testOrgId)
    expect(finalState).toBe(WorkflowState.COMPETITOR_COMPLETED)

    // Verify exactly one keyword set (no duplicates)
    const { data: keywords } = await supabase
      .from('keywords')
      .select('id, keyword')
      .eq('workflow_id', workflowId)

    expect(keywords).toBeDefined()
    expect(keywords!.length).toBeGreaterThan(0)

    // Verify no duplicate keywords
    const keywordSet = new Set(keywords!.map(k => k.keyword))
    expect(keywordSet.size).toBe(keywords!.length)

    console.log(`✅ Parallel Test: ${successes.length} success, ${conflicts.length} conflicts, ${keywords!.length} keywords, state = ${finalState}`)
  })
})
