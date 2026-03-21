/**
 * Test 5 - Illegal Re-run
 * 
 * Verify: Run endpoint when state = COMPLETED, expect 409, state unchanged
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState } from '@/types/workflow-state'
import { getWorkflowState, transitionWorkflow } from '@/lib/services/workflow-engine/transition-engine'

describe('Workflow Engine - Test 5: Illegal Re-run', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string
  let testUserId: string
  let workflowId: string

  beforeEach(async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org Illegal' })
      .select('id')
      .single()
    testOrgId = org!.id

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-illegal@example.com',
      password: 'test123456',
      email_confirm: true
    })
    testUserId = user.user!.id

    // Create workflow in COMPLETED state
    const { data: workflow } = await supabase
      .from('intent_workflows')
      .insert({
        organization_id: testOrgId,
        created_by: testUserId,
        state: WorkflowState.COMPETITOR_COMPLETED,
        title: 'Test Workflow Illegal'
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

  it('should reject re-run when state is COMPLETED', async () => {
    // Verify initial COMPLETED state
    const initialState = await getWorkflowState(workflowId, testOrgId)
    expect(initialState).toBe(WorkflowState.COMPETITOR_COMPLETED)

    // Attempt to run competitor-analyze endpoint on COMPLETED workflow
    const response = await fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserId}`
      }
    })

    // Should return 409 - illegal transition
    expect(response.status).toBe(409)
    const result = await response.json()
    expect(result.error).toBe('ILLEGAL_TRANSITION')
    expect(result.message).toContain('Cannot re-run competitor analysis after completion')

    // Verify state is unchanged
    const finalState = await getWorkflowState(workflowId, testOrgId)
    expect(finalState).toBe(WorkflowState.COMPETITOR_COMPLETED)

    // Verify no new keywords were created
    const { data: keywords } = await supabase
      .from('keywords')
      .select('id')
      .eq('workflow_id', workflowId)

    expect(keywords).toBeDefined()
    expect(keywords!.length).toBe(0)

    console.log(`✅ Illegal Re-run Test: state unchanged = ${finalState}, 409 error returned`)
  })

  it('should reject re-run when state is PROCESSING', async () => {
    // First, transition to PROCESSING state
    const processResult = await transitionWorkflow({
      workflowId,
      organizationId: testOrgId,
      from: WorkflowState.COMPETITOR_COMPLETED,
      to: WorkflowState.COMPETITOR_PROCESSING
    })
    expect(processResult.success).toBe(true)

    // Verify state is PROCESSING
    const processingState = await getWorkflowState(workflowId, testOrgId)
    expect(processingState).toBe(WorkflowState.COMPETITOR_PROCESSING)

    // Attempt to run competitor-analyze endpoint on PROCESSING workflow
    const response = await fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserId}`
      }
    })

    // Should return 409 - illegal transition
    expect(response.status).toBe(409)
    const result = await response.json()
    expect(result.error).toBe('ILLEGAL_TRANSITION')

    // Verify state is unchanged
    const finalState = await getWorkflowState(workflowId, testOrgId)
    expect(finalState).toBe(WorkflowState.COMPETITOR_PROCESSING)

    console.log(`✅ Processing Re-run Test: state unchanged = ${finalState}, 409 error returned`)
  })
})
