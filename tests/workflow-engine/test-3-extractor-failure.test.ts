/**
 * Test 3 - Forced Extractor Failure
 * 
 * Verify: State = FAILED, no COMPLETED state, no partial keyword corruption
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState } from '@/types/workflow-state'
import { getWorkflowState } from '@/lib/services/workflow-engine/transition-engine'

describe('Workflow Engine - Test 3: Extractor Failure', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string
  let testUserId: string
  let workflowId: string

  beforeEach(async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org Failure' })
      .select('id')
      .single()
    testOrgId = org!.id

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-failure@example.com',
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
        title: 'Test Workflow Failure'
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

  it('should handle extractor failure and transition to FAILED state', async () => {
    // Verify initial state
    const initialState = await getWorkflowState(workflowId, testOrgId)
    expect(initialState).toBe(WorkflowState.COMPETITOR_PENDING)

    // Call competitor-analyze endpoint with forced failure
    // We'll simulate this by using an invalid competitor URL that will cause extraction to fail
    const response = await fetch(`http://localhost:3000/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserId}`
      },
      body: JSON.stringify({
        additionalCompetitors: ['https://invalid-url-that-will-fail-extraction.com']
      })
    })

    // Should return 500 due to extraction failure
    expect(response.status).toBe(500)
    const result = await response.json()
    expect(result.error).toBe('Seed keyword extraction failed')

    // Verify final state is FAILED
    const finalState = await getWorkflowState(workflowId, testOrgId)
    expect(finalState).toBe(WorkflowState.COMPETITOR_FAILED)

    // Verify no COMPLETED state was reached
    expect(finalState).not.toBe(WorkflowState.COMPETITOR_COMPLETED)

    // Verify no partial keyword corruption (should be 0 keywords)
    const { data: keywords } = await supabase
      .from('keywords')
      .select('id')
      .eq('workflow_id', workflowId)

    expect(keywords).toBeDefined()
    expect(keywords!.length).toBe(0)

    console.log(`✅ Failure Test: state = ${finalState}, keywords = ${keywords!.length}, no corruption`)
  })
})
