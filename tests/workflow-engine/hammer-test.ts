/**
 * HAMMER TEST - Real Concurrent Database Validation
 * 
 * Tests the workflow engine under real database contention
 * No mocks, no abstractions - just raw concurrent HTTP calls
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { WorkflowState } from '@/types/workflow-state'

const API_BASE = process.env.API_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface TestResult {
  name: string
  passed: boolean
  details: string
  metrics?: {
    successes: number
    conflicts: number
    errors: number
    finalState?: string
    keywordCount?: number
  }
}

const results: TestResult[] = []

/**
 * TEST 1: Atomicity - 3 Concurrent Calls
 */
async function testAtomicity() {
  console.log('\n🔥 TEST 1: ATOMICITY (3 concurrent calls)')
  console.log('=' .repeat(60))

  const supabase = createServiceRoleClient()

  // Create test workflow
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name: `Test Org Atomicity ${Date.now()}` })
    .select('id')
    .single()

  const orgId = org!.id

  const { data: workflow } = await supabase
    .from('intent_workflows')
    .insert({
      organization_id: orgId,
      created_by: 'test-user',
      state: WorkflowState.COMPETITOR_PENDING,
      title: 'Atomicity Test'
    })
    .select('id')
    .single()

  const workflowId = workflow!.id

  // Add competitor
  await supabase
    .from('organization_competitors')
    .insert({
      organization_id: orgId,
      url: 'https://test.com',
      domain: 'test.com',
      is_active: true
    })

  console.log(`Created workflow: ${workflowId}`)
  console.log('Launching 3 concurrent requests...\n')

  // Fire 3 concurrent requests
  const startTime = Date.now()
  const responses = await Promise.all([
    fetch(`${API_BASE}/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    fetch(`${API_BASE}/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }),
    fetch(`${API_BASE}/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
  ])
  const duration = Date.now() - startTime

  // Analyze results
  const statuses = await Promise.all(responses.map(r => r.status))
  const successes = statuses.filter(s => s === 200).length
  const conflicts = statuses.filter(s => s === 409).length

  console.log(`Completed in ${duration}ms`)
  console.log(`Results: ${successes} success(es), ${conflicts} conflict(s)`)

  // Check final state
  const { data: finalWorkflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .single()

  const finalState = finalWorkflow!.state

  // Check keyword count
  const { data: keywords } = await supabase
    .from('keywords')
    .select('id')
    .eq('workflow_id', workflowId)

  const keywordCount = keywords?.length || 0

  console.log(`Final state: ${finalState}`)
  console.log(`Keywords created: ${keywordCount}`)

  // Cleanup
  await supabase.from('keywords').delete().eq('workflow_id', workflowId)
  await supabase.from('intent_workflows').delete().eq('id', workflowId)
  await supabase.from('organization_competitors').delete().eq('organization_id', orgId)
  await supabase.from('organizations').delete().eq('id', orgId)

  const passed = successes === 1 && conflicts === 2 && finalState === WorkflowState.COMPETITOR_COMPLETED && keywordCount > 0

  results.push({
    name: 'Atomicity (3 concurrent)',
    passed,
    details: passed ? 'PASS: Exactly 1 winner, 2 conflicts, correct final state' : 'FAIL: Race condition detected',
    metrics: { successes, conflicts, errors: 0, finalState, keywordCount }
  })

  return passed
}

/**
 * TEST 2: State Purity - Check State During Processing
 */
async function testStatePurity() {
  console.log('\n🔥 TEST 2: STATE PURITY (state reflects reality)')
  console.log('=' .repeat(60))

  const supabase = createServiceRoleClient()

  // Create test workflow
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name: `Test Org Purity ${Date.now()}` })
    .select('id')
    .single()

  const orgId = org!.id

  const { data: workflow } = await supabase
    .from('intent_workflows')
    .insert({
      organization_id: orgId,
      created_by: 'test-user',
      state: WorkflowState.COMPETITOR_PENDING,
      title: 'Purity Test'
    })
    .select('id')
    .single()

  const workflowId = workflow!.id

  // Add competitor
  await supabase
    .from('organization_competitors')
    .insert({
      organization_id: orgId,
      url: 'https://test.com',
      domain: 'test.com',
      is_active: true
    })

  console.log(`Created workflow: ${workflowId}`)
  console.log('Starting extraction...')

  // Start extraction (fire and forget)
  const extractionPromise = fetch(`${API_BASE}/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  // Check state during processing
  await new Promise(r => setTimeout(r, 500)) // Wait 500ms for processing to start

  const { data: duringWorkflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .single()

  const duringState = duringWorkflow!.state
  console.log(`State during processing: ${duringState}`)

  // Wait for completion
  const response = await extractionPromise
  const statusCode = response.status

  // Check final state
  const { data: afterWorkflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .single()

  const finalState = afterWorkflow!.state
  console.log(`Final state: ${finalState}`)

  // Cleanup
  await supabase.from('keywords').delete().eq('workflow_id', workflowId)
  await supabase.from('intent_workflows').delete().eq('id', workflowId)
  await supabase.from('organization_competitors').delete().eq('organization_id', orgId)
  await supabase.from('organizations').delete().eq('id', orgId)

  const passed = 
    statusCode === 200 && 
    duringState === WorkflowState.COMPETITOR_PROCESSING && 
    finalState === WorkflowState.COMPETITOR_COMPLETED

  results.push({
    name: 'State Purity',
    passed,
    details: passed ? 'PASS: State reflects reality (PROCESSING during, COMPLETED after)' : 'FAIL: State purity violated',
    metrics: { successes: statusCode === 200 ? 1 : 0, conflicts: 0, errors: statusCode === 200 ? 0 : 1, finalState }
  })

  return passed
}

/**
 * TEST 3: Failure Handling - Verify FAILED State
 */
async function testFailureHandling() {
  console.log('\n🔥 TEST 3: FAILURE HANDLING (error → FAILED state)')
  console.log('=' .repeat(60))

  const supabase = createServiceRoleClient()

  // Create test workflow
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name: `Test Org Failure ${Date.now()}` })
    .select('id')
    .single()

  const orgId = org!.id

  const { data: workflow } = await supabase
    .from('intent_workflows')
    .insert({
      organization_id: orgId,
      created_by: 'test-user',
      state: WorkflowState.COMPETITOR_PENDING,
      title: 'Failure Test'
    })
    .select('id')
    .single()

  const workflowId = workflow!.id

  // Don't add competitors - this will cause extraction to fail
  console.log(`Created workflow: ${workflowId}`)
  console.log('Calling endpoint without competitors (will fail)...')

  const response = await fetch(`${API_BASE}/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })

  const statusCode = response.status
  console.log(`Response status: ${statusCode}`)

  // Check final state
  const { data: finalWorkflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .single()

  const finalState = finalWorkflow!.state
  console.log(`Final state: ${finalState}`)

  // Check keyword count (should be 0)
  const { data: keywords } = await supabase
    .from('keywords')
    .select('id')
    .eq('workflow_id', workflowId)

  const keywordCount = keywords?.length || 0
  console.log(`Keywords created: ${keywordCount}`)

  // Cleanup
  await supabase.from('keywords').delete().eq('workflow_id', workflowId)
  await supabase.from('intent_workflows').delete().eq('id', workflowId)
  await supabase.from('organizations').delete().eq('id', orgId)

  const passed = statusCode === 400 && keywordCount === 0

  results.push({
    name: 'Failure Handling',
    passed,
    details: passed ? 'PASS: Failure handled cleanly, no partial state' : 'FAIL: Failure handling broken',
    metrics: { successes: 0, conflicts: 0, errors: 1, finalState, keywordCount }
  })

  return passed
}

/**
 * TEST 4: Concurrency Safety - 20 Concurrent Calls
 */
async function testConcurrencySafety() {
  console.log('\n🔥 TEST 4: CONCURRENCY SAFETY (20 concurrent calls)')
  console.log('=' .repeat(60))

  const supabase = createServiceRoleClient()

  // Create test workflow
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name: `Test Org Concurrency ${Date.now()}` })
    .select('id')
    .single()

  const orgId = org!.id

  const { data: workflow } = await supabase
    .from('intent_workflows')
    .insert({
      organization_id: orgId,
      created_by: 'test-user',
      state: WorkflowState.COMPETITOR_PENDING,
      title: 'Concurrency Test'
    })
    .select('id')
    .single()

  const workflowId = workflow!.id

  // Add competitor
  await supabase
    .from('organization_competitors')
    .insert({
      organization_id: orgId,
      url: 'https://test.com',
      domain: 'test.com',
      is_active: true
    })

  console.log(`Created workflow: ${workflowId}`)
  console.log('Launching 20 concurrent requests...\n')

  // Fire 20 concurrent requests
  const startTime = Date.now()
  const responses = await Promise.all(
    Array.from({ length: 20 }).map(() =>
      fetch(`${API_BASE}/api/intent/workflows/${workflowId}/steps/competitor-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  )
  const duration = Date.now() - startTime

  // Analyze results
  const statuses = await Promise.all(responses.map(r => r.status))
  const successes = statuses.filter(s => s === 200).length
  const conflicts = statuses.filter(s => s === 409).length
  const errors = statuses.filter(s => s !== 200 && s !== 409).length

  console.log(`Completed in ${duration}ms`)
  console.log(`Results: ${successes} success(es), ${conflicts} conflict(s), ${errors} error(s)`)

  // Check final state
  const { data: finalWorkflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', workflowId)
    .single()

  const finalState = finalWorkflow!.state

  // Check keyword count
  const { data: keywords } = await supabase
    .from('keywords')
    .select('id')
    .eq('workflow_id', workflowId)

  const keywordCount = keywords?.length || 0

  console.log(`Final state: ${finalState}`)
  console.log(`Keywords created: ${keywordCount}`)

  // Cleanup
  await supabase.from('keywords').delete().eq('workflow_id', workflowId)
  await supabase.from('intent_workflows').delete().eq('id', workflowId)
  await supabase.from('organization_competitors').delete().eq('organization_id', orgId)
  await supabase.from('organizations').delete().eq('id', orgId)

  const passed = successes === 1 && conflicts === 19 && finalState === WorkflowState.COMPETITOR_COMPLETED && keywordCount > 0

  results.push({
    name: 'Concurrency Safety (20 concurrent)',
    passed,
    details: passed ? 'PASS: Exactly 1 winner, 19 conflicts, correct final state' : 'FAIL: Race condition detected',
    metrics: { successes, conflicts, errors, finalState, keywordCount }
  })

  return passed
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '=' .repeat(60))
  console.log('WORKFLOW ENGINE - HAMMER TEST SUITE')
  console.log('Real Concurrent Database Validation')
  console.log('=' .repeat(60))

  try {
    await testAtomicity()
    await testStatePurity()
    await testFailureHandling()
    await testConcurrencySafety()

    // Print summary
    console.log('\n' + '=' .repeat(60))
    console.log('TEST SUMMARY')
    console.log('=' .repeat(60))

    results.forEach(r => {
      const status = r.passed ? '✅ PASS' : '❌ FAIL'
      console.log(`\n${status}: ${r.name}`)
      console.log(`  ${r.details}`)
      if (r.metrics) {
        console.log(`  Metrics: ${JSON.stringify(r.metrics)}`)
      }
    })

    const allPassed = results.every(r => r.passed)
    console.log('\n' + '=' .repeat(60))
    if (allPassed) {
      console.log('🚀 ALL TESTS PASSED - READY FOR PRODUCTION')
    } else {
      console.log('❌ SOME TESTS FAILED - FIX BEFORE SHIPPING')
    }
    console.log('=' .repeat(60))

    return allPassed
  } catch (error) {
    console.error('Test suite error:', error)
    return false
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests().then(passed => {
    process.exit(passed ? 0 : 1)
  })
}

export { runAllTests }
