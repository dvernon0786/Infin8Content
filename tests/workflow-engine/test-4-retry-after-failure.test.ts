/**
 * Test 4 - Retry After Failure
 * 
 * Verify: FAILED → PROCESSING → COMPLETED should succeed
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState } from '@/types/workflow-state'
import { getWorkflowState, transitionWorkflow } from '@/lib/services/workflow-engine/transition-engine'

describe('Workflow Engine - Test 4: Retry After Failure', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string
  let testUserId: string
  let workflowId: string

  beforeEach(async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org Retry' })
      .select('id')
      .single()
    testOrgId = org!.id

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-retry@example.com',
      password: 'test123456',
      email_confirm: true
    })
    testUserId = user.user!.id

    // Create workflow in COMPETITOR_FAILED state (simulating previous failure)
    const { data: workflow } = await supabase
      .from('intent_workflows')
      .insert({
        organization_id: testOrgId,
        created_by: testUserId,
        state: WorkflowState.COMPETITOR_FAILED,
        title: 'Test Workflow Retry'
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

  it('should retry from FAILED state and succeed', async () => {
    // Verify initial FAILED state
    const initialState = await getWorkflowState(workflowId, testOrgId)
    expect(initialState).toBe(WorkflowState.COMPETITOR_FAILED)

    // First, transition back to PENDING (legal transition from FAILED)
    const resetResult = await transitionWorkflow({
      workflowId,
      organizationId: testOrgId,
      from: WorkflowState.COMPETITOR_FAILED,
      to: WorkflowState.COMPETITOR_PENDING
    })
    expect(resetResult.success).toBe(true)

    // Verify state is now PENDING
    const pendingState = await getWorkflowState(workflowId, testOrgId)
    expect(pendingState).toBe(WorkflowState.COMPETITOR_PENDING)

    // Call competitor-analyze endpoint
    const response = await fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserId}`
      }
    })

    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.success).toBe(true)

    // Verify final state
    const finalState = await getWorkflowState(workflowId, testOrgId)
    expect(finalState).toBe(WorkflowState.COMPETITOR_COMPLETED)

    // Verify keywords were created
    const { data: keywords } = await supabase
      .from('keywords')
      .select('id')
      .eq('workflow_id', workflowId)

    expect(keywords).toBeDefined()
    expect(keywords!.length).toBeGreaterThan(0)

    console.log(`✅ Retry Test: ${keywords!.length} keywords created, state = ${finalState}`)
  })
})
