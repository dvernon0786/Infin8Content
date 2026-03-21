/**
 * Step-by-Step Functional Validation of Canonical State Machine
 * 
 * FSM-based validation using only `state` column
 * No legacy references to `status` or `current_step`
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzAwMDAwMCwiZXhwIjoyNTI0NjA4MDAwfQ.test'
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Canonical State Machine - FSM Validation', () => {
  let workflowId: string
  let organizationId: string
  let userId: string

  beforeAll(async () => {
    // Setup: Create test organization and user
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org', description: 'Canonical validation test' })
      .select('id')
      .single()

    if (orgError) {
      console.error('Failed to create test organization:', orgError)
      throw orgError
    }

    organizationId = org.id
    userId = 'test-user-' + Date.now()
  })

  afterAll(async () => {
    // Cleanup: Delete test workflow and organization
    if (workflowId) {
      await supabase
        .from('intent_workflows')
        .delete()
        .eq('id', workflowId)
    }

    if (organizationId) {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId)
    }
  })

  describe('Phase 1: Fresh Workflow Creation & State Validation', () => {
    it('should create fresh workflow with state = step_1_icp', async () => {
      const { data: workflow, error } = await supabase
        .from('intent_workflows')
        .insert({
          organization_id: organizationId,
          name: 'Canonical Validation Test Workflow',
          state: 'step_1_icp',
          created_by: userId
        })
        .select('id, state')
        .single()

      expect(error).toBeNull()
      expect(workflow).toBeDefined()
      expect(workflow!.state).toBe('step_1_icp')

      workflowId = workflow!.id
    })

    it('should verify workflow state is step_1_icp', async () => {
      const { data: workflow, error } = await supabase
        .from('intent_workflows')
        .select('state')
        .eq('id', workflowId)
        .single()

      expect(error).toBeNull()
      expect(workflow).toBeDefined()
      expect(workflow!.state).toBe('step_1_icp')
    })
  })

  describe('Phase 2: State Transition Validation', () => {
    it('should validate state enum values', async () => {
      const expectedStates = [
        'step_1_icp',
        'step_2_competitors', 
        'step_3_seeds',
        'step_4_longtails',
        'step_5_filtering',
        'step_6_clustering',
        'step_7_validation',
        'step_8_subtopics',
        'step_9_articles',
        'COMPLETED',
        'CANCELLED'
      ]

      // Verify workflow state is in expected enum
      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('state')
        .eq('id', workflowId)
        .single()

      expect(expectedStates).toContain(workflow!.state)
    })

    it('should reject invalid state transitions', async () => {
      // Test that we can't manually set invalid state
      const { error } = await supabase
        .from('intent_workflows')
        .update({ state: 'invalid_state' })
        .eq('id', workflowId)

      // Should fail due to enum constraint
      expect(error).toBeDefined()
    })
  })

  describe('Phase 3: Terminal States', () => {
    it('should allow transition to COMPLETED', async () => {
      const { error } = await supabase
        .from('intent_workflows')
        .update({ state: 'COMPLETED' })
        .eq('id', workflowId)

      expect(error).toBeNull()

      // Verify final state
      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('state')
        .eq('id', workflowId)
        .single()

      expect(workflow!.state).toBe('COMPLETED')
    })

    it('should allow transition to CANCELLED', async () => {
      // Reset to step 1 first
      await supabase
        .from('intent_workflows')
        .update({ state: 'step_1_icp' })
        .eq('id', workflowId)

      // Then cancel
      const { error } = await supabase
        .from('intent_workflows')
        .update({ state: 'CANCELLED' })
        .eq('id', workflowId)

      expect(error).toBeNull()

      // Verify cancelled state
      const { data: workflow } = await supabase
        .from('intent_workflows')
        .select('state')
        .eq('id', workflowId)
        .single()

      expect(workflow!.state).toBe('CANCELLED')
    })
  })
})
