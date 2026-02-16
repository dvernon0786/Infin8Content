/* 
  Pure FSM Linear Test Harness
  ---------------------------
  Tests mathematical state machine: step_1_icp → completed
  Skips business logic, AI, role gates, rate limits
  Validates FSM integrity only
*/

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
]

async function createTestWorkflow() {
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

async function getWorkflowState(workflowId) {
  const { data, error } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .single()

  if (error) {
    console.error('❌ Failed to get workflow state:', error)
    process.exit(1)
  }

  return data.state
}

async function callFSMTransition(workflowId, event) {
  console.log(`\n▶ Event: ${event}`)
  
  const before = await getWorkflowState(workflowId)
  console.log(`   Before: ${before}`)

  // Direct FSM transition - bypass all business logic
  const { data, error } = await supabase.rpc('fsm_transition', {
    p_workflow_id: workflowId,
    p_event: event,
    p_user_id: null
  })

  if (error) {
    console.error('❌ FSM transition failed:', error)
    return false
  }

  const after = await getWorkflowState(workflowId)
  console.log(`   After: ${after}`)

  if (!data) {
    console.error('❌ Transition returned false')
    return false
  }

  console.log('✅ Transition OK')
  return true
}

async function runPureFSMTest() {
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

  const finalState = await getWorkflowState(workflowId)
  
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
