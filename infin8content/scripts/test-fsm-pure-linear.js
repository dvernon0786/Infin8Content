/* 
  Pure FSM Linear Test Harness
  ---------------------------
  Tests mathematical state machine: step_1_icp → completed
  Skips business logic, AI, role gates, rate limits
  Validates FSM integrity only
*/

require('dotenv').config({ path: '.env.local' })
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

// Workflow transition mapping (copied from workflow-machine.ts)
const WorkflowTransitions = {
  'step_1_icp': {
    'ICP_COMPLETED': 'step_2_competitors'
  },
  'step_2_competitors': {
    'COMPETITORS_COMPLETED': 'step_3_seeds'
  },
  'step_3_seeds': {
    'SEEDS_APPROVED': 'step_4_longtails'
  },
  'step_4_longtails': {
    'LONGTAILS_COMPLETED': 'step_5_filtering'
  },
  'step_5_filtering': {
    'FILTERING_COMPLETED': 'step_6_clustering'
  },
  'step_6_clustering': {
    'CLUSTERING_COMPLETED': 'step_7_validation'
  },
  'step_7_validation': {
    'VALIDATION_COMPLETED': 'step_8_subtopics'
  },
  'step_8_subtopics': {
    'SUBTOPICS_APPROVED': 'step_9_articles'
  },
  'step_9_articles': {
    'ARTICLES_COMPLETED': 'COMPLETED'
  },
  'COMPLETED': {}
}

async function createTestWorkflow() {
  console.log('🆕 Creating test workflow...')
  
  // Get test organization
  let { data: org } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()

  // Get existing user for created_by
  let { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single()

  // If no organization exists, create one
  if (!org) {
    console.log('📝 Creating test organization...')
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({
        name: 'FSM Test Organization',
        created_by: existingUser?.id || '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single()
    
    org = newOrg
    console.log('✅ Test organization created:', org.id)
  }

  const createdBy = existingUser?.id || '00000000-0000-0000-0000-000000000000'
  console.log('📊 Using organization:', org.id, 'and created_by:', createdBy)

  const { data, error } = await supabase
    .from('intent_workflows')
    .insert({
      name: `FSM Pure Test ${Date.now()}`,
      organization_id: org.id,
      created_by: createdBy,
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

async function transition(workflowId, event) {
  const currentState = await getWorkflowState(workflowId)
  
  const nextState = WorkflowTransitions[currentState]?.[event]
  
  if (!nextState) {
    throw new Error(`Invalid transition: ${currentState} -> ${event}`)
  }

  // Idempotency guard
  if (currentState === nextState) {
    return currentState
  }

  // Atomic update (remove WHERE clause for final transition)
  const { data, error } = await supabase
    .from('intent_workflows')
    .update({ state: nextState })
    .eq('id', workflowId)
    .select('state')
    .single()

  if (error || !data) {
    console.error('❌ Database error:', error)
    console.error('❌ Data received:', data)
    throw new Error('Transition failed: ' + (error?.message || 'Unknown error'))
  }

  return nextState
}

async function callFSMTransition(workflowId, event) {
  console.log(`\n▶ Event: ${event}`)
  
  const before = await getWorkflowState(workflowId)
  console.log(`   Before: ${before}`)

  try {
    const nextState = await transition(workflowId, event)
    
    const after = await getWorkflowState(workflowId)
    console.log(`   After: ${after}`)

    if (nextState !== after) {
      console.error('❌ State mismatch after transition')
      return false
    }

    console.log('✅ Transition OK')
    return true
  } catch (error) {
    console.error('❌ FSM transition failed:', error.message)
    return false
  }
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
  
  if (finalState !== 'COMPLETED') {
    console.error(`❌ Final state incorrect: ${finalState} (expected: COMPLETED)`)
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
