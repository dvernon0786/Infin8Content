/* 
  Pure FSM Linear Test Harness
  ---------------------------
  Tests mathematical state machine: step_1_icp → completed
  Skips business logic, AI, role gates, rate limits
  Validates FSM integrity only
*/

import { createClient } from '@supabase/supabase-js'
import { WorkflowFSM } from '../lib/fsm/workflow-fsm'

// Environment setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const FSM_EVENTS = [
  'ICP_COMPLETED',
  'COMPETITORS_COMPLETED', 
  'SEEDS_APPROVED',
  'LONGTAILS_COMPLETED',
  'FILTERING_COMPLETED',
  'CLUSTERING_COMPLETED',
  'VALIDATION_COMPLETED',
  'SUBTOPICS_APPROVED',
  'ARTICLES_COMPLETED'
] as const

async function createTestWorkflow(): Promise<string> {
  console.log('🆕 Creating test workflow...')
  
  // Get test organization and user
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  const { data: user } = await supabase
    .from('auth.users')
    .select('id')
    .limit(1)
    .single()

  if (!org || !user) {
    console.error('❌ Need test organization and user')
    console.log('Available organizations:', await supabase.from('organizations').select('id, name').limit(5))
    console.log('Available users:', await supabase.from('auth.users').select('id, email').limit(5))
    process.exit(1)
  }

  const { data, error } = await supabase
    .from('intent_workflows')
    .insert({
      name: `FSM Pure Test ${Date.now()}`,
      organization_id: org.id,
      created_by: user.id,
      state: 'step_1_icp'
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Failed to create workflow:', error)
    process.exit(1)
  }

  console.log(`✅ Workflow created: ${data.id}`)
  return data.id
}

async function callFSMTransition(workflowId: string, event: string): Promise<boolean> {
  console.log(`\n▶ Event: ${event}`)
  
  const before = await WorkflowFSM.getCurrentState(workflowId)
  console.log(`   Before: ${before}`)

  try {
    // Direct FSM transition - bypass all business logic
    const nextState = await WorkflowFSM.transition(workflowId, event as any)
    
    const after = await WorkflowFSM.getCurrentState(workflowId)
    console.log(`   After: ${after}`)

    if (nextState !== after) {
      console.error('❌ State mismatch after transition')
      return false
    }

    console.log('✅ Transition OK')
    return true
  } catch (error) {
    console.error('❌ FSM transition failed:', (error as Error).message)
    return false
  }
}

async function runPureFSMTest(): Promise<void> {
  console.log('🚀 Pure FSM Linear Test')
  console.log('========================')
  console.log('Testing mathematical state machine integrity')
  console.log('Skipping business logic, AI, role gates\n')

  const workflowId = await createTestWorkflow()

  for (const event of FSM_EVENTS) {
    const success = await callFSMTransition(workflowId, event)
    if (!success) {
      console.error(`❌ Test failed at event: ${event}`)
      process.exit(1)
    }
  }

  const finalState = await WorkflowFSM.getCurrentState(workflowId)
  
  if (finalState !== 'completed') {
    console.error(`❌ Final state incorrect: ${finalState} (expected: completed)`)
    process.exit(1)
  }

  console.log('\n🎉 SUCCESS: FSM reached completed state cleanly!')
  console.log('✅ All 9 transitions validated mathematically')
  console.log('✅ State machine integrity confirmed')
  process.exit(0)
}

runPureFSMTest().catch(err => {
  console.error('❌ FATAL ERROR:', err)
  process.exit(1)
})
