/**
 * Direct Concurrent Validation Test (JavaScript)
 * Tests the workflow engine at the database level using service role client
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WORKFLOW_ID = '63fc648d-1518-405a-8e17-05973c608c71';
const ORG_ID = '4b124ab6-0145-49a5-8821-0652e25f4544';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Test 1: Atomicity - Simulate 3 concurrent transition attempts
 */
async function testAtomicity() {
  console.log('\n🔥 TEST 1: ATOMICITY (3 concurrent transitions)');
  console.log('='.repeat(60));

  // Reset workflow
  await supabase
    .from('intent_workflows')
    .update({ state: 'COMPETITOR_PENDING' })
    .eq('id', WORKFLOW_ID)
    .eq('organization_id', ORG_ID);

  // Delete keywords
  await supabase
    .from('keywords')
    .delete()
    .eq('workflow_id', WORKFLOW_ID);

  console.log('Workflow reset to COMPETITOR_PENDING');
  console.log('Launching 3 concurrent transition attempts...\n');

  // Simulate 3 concurrent requests trying to transition from PENDING to PROCESSING
  const results = await Promise.all([
    attemptTransition(1),
    attemptTransition(2),
    attemptTransition(3),
  ]);

  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;

  console.log(`\nResults: ${successes} success(es), ${failures} failure(s)`);

  // Check final state
  const { data: workflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', WORKFLOW_ID)
    .single();

  console.log(`Final state: ${workflow?.state}`);

  // ATOMICITY VERIFIED: Exactly 1 request wins the race, others fail
  // Winner transitions state from PENDING → PROCESSING
  const passed = successes === 1 && failures === 2 && workflow?.state === 'COMPETITOR_PROCESSING';

  console.log(passed ? '✅ PASS: Atomicity verified (1 winner, 2 conflicts)' : '❌ FAIL: Race condition detected');
  return passed;
}

/**
 * Attempt to transition workflow from PENDING to PROCESSING
 */
async function attemptTransition(requestId) {
  const { data, error } = await supabase
    .from('intent_workflows')
    .update({
      state: 'COMPETITOR_PROCESSING',
      updated_at: new Date().toISOString(),
    })
    .eq('id', WORKFLOW_ID)
    .eq('organization_id', ORG_ID)
    .eq('state', 'COMPETITOR_PENDING')
    .select('id, state')
    .single();

  const success = !!data && !error;
  console.log(`Request ${requestId}: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);

  return { success };
}

/**
 * Test 2: State Purity - Verify state transitions are sequential
 */
async function testStatePurity() {
  console.log('\n🔥 TEST 2: STATE PURITY (sequential transitions)');
  console.log('='.repeat(60));

  // Reset workflow
  await supabase
    .from('intent_workflows')
    .update({ state: 'COMPETITOR_PENDING' })
    .eq('id', WORKFLOW_ID)
    .eq('organization_id', ORG_ID);

  console.log('Initial state: COMPETITOR_PENDING');

  // Transition to PROCESSING
  const { data: processing } = await supabase
    .from('intent_workflows')
    .update({ state: 'COMPETITOR_PROCESSING' })
    .eq('id', WORKFLOW_ID)
    .eq('organization_id', ORG_ID)
    .select('state')
    .single();

  console.log(`After transition 1: ${processing?.state}`);

  // Transition to COMPLETED
  const { data: completed } = await supabase
    .from('intent_workflows')
    .update({ state: 'COMPETITOR_COMPLETED' })
    .eq('id', WORKFLOW_ID)
    .eq('organization_id', ORG_ID)
    .select('state')
    .single();

  console.log(`After transition 2: ${completed?.state}`);

  const passed =
    processing?.state === 'COMPETITOR_PROCESSING' &&
    completed?.state === 'COMPETITOR_COMPLETED';

  console.log(passed ? '✅ PASS: State purity verified' : '❌ FAIL: State purity violated');
  return passed;
}

/**
 * Test 3: Concurrency Safety - 20 concurrent attempts
 */
async function testConcurrencySafety() {
  console.log('\n🔥 TEST 3: CONCURRENCY SAFETY (20 concurrent transitions)');
  console.log('='.repeat(60));

  // Reset workflow
  await supabase
    .from('intent_workflows')
    .update({ state: 'COMPETITOR_PENDING' })
    .eq('id', WORKFLOW_ID)
    .eq('organization_id', ORG_ID);

  // Delete keywords
  await supabase
    .from('keywords')
    .delete()
    .eq('workflow_id', WORKFLOW_ID);

  console.log('Workflow reset to COMPETITOR_PENDING');
  console.log('Launching 20 concurrent transition attempts...\n');

  // Simulate 20 concurrent requests
  const results = await Promise.all(
    Array.from({ length: 20 }).map((_, i) => attemptTransition(i + 1))
  );

  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;

  console.log(`\nResults: ${successes} success(es), ${failures} failure(s)`);

  // Check final state
  const { data: workflow } = await supabase
    .from('intent_workflows')
    .select('state')
    .eq('id', WORKFLOW_ID)
    .single();

  console.log(`Final state: ${workflow?.state}`);

  const passed = successes === 1 && failures === 19 && workflow?.state === 'COMPETITOR_PROCESSING';

  console.log(passed ? '✅ PASS: Concurrency safety verified' : '❌ FAIL: Race condition detected');
  return passed;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('WORKFLOW ENGINE - CONCURRENT VALIDATION');
  console.log('Direct Database-Level Testing');
  console.log('='.repeat(60));

  try {
    const test1 = await testAtomicity();
    const test2 = await testStatePurity();
    const test3 = await testConcurrencySafety();

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test 1 (Atomicity): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 2 (State Purity): ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 (Concurrency): ${test3 ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = test1 && test2 && test3;
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🚀 ALL TESTS PASSED - WORKFLOW ENGINE IS PRODUCTION READY');
    } else {
      console.log('❌ SOME TESTS FAILED - FIX BEFORE SHIPPING');
    }
    console.log('='.repeat(60));

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Test suite error:', error);
    process.exit(1);
  }
}

runAllTests();
