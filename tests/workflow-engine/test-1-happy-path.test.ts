/**
 * Test 1 - Happy Path
 * 
 * Verify: PENDING → PROCESSING → COMPLETED
 * Expect: Keywords exist, State = COMPLETED
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState } from '@/types/workflow-state'
import { getWorkflowState } from '@/lib/services/workflow-engine/transition-engine'

describe('Workflow Engine - Test 1: Happy Path', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string
  let testUserId: string
  let workflowId: string

  beforeEach(async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org Happy Path' })
      .select('id')
      .single()
    testOrgId = org!.id

    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-happy@example.com',
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
        title: 'Test Workflow Happy Path'
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
        },
        {
          organization_id: testOrgId,
          url: 'https://competitor2.com',
          domain: 'competitor2.com',
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

  it('should transition PENDING → PROCESSING → COMPLETED and create keywords', async () => {
    // Verify initial state
    const initialState = await getWorkflowState(workflowId, testOrgId)
    expect(initialState).toBe(WorkflowState.COMPETITOR_PENDING)

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

    console.log(`✅ Happy Path: ${keywords!.length} keywords created, state = ${finalState}`)
  })
})
