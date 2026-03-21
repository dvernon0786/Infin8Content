// Test UUID idempotency key fix
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create service role client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUUIDFix() {
  console.log('🧪 Testing UUID idempotency key fix...');
  
  // Test 1: Generate proper UUID
  const idempotencyKey = crypto.randomUUID();
  console.log(`✅ Generated UUID: ${idempotencyKey}`);
  
  // Test 2: Try to call the atomic function with UUID
  const workflowId = '63fc648d-1518-405a-8e17-05973c608c71';
  const organizationId = '4b124ab6-0145-49a5-8821-0652e25f4544';
  
  try {
    const { data, error } = await supabase
      .rpc('record_usage_increment_and_complete_step', {
        p_workflow_id: workflowId,
        p_organization_id: organizationId,
        p_model: 'test-model',
        p_prompt_tokens: 100,
        p_completion_tokens: 50,
        p_cost: 0.001,
        p_icp_data: { test: 'data' },
        p_tokens_used: 150,
        p_generated_at: new Date().toISOString(),
        p_idempotency_key: idempotencyKey
      });
    
    if (error) {
      console.error('❌ Database function failed:', error);
      
      // Check if it's the constraint error we're trying to fix
      if (error.message?.includes('invalid input syntax for type uuid')) {
        console.log('🔥 This is the UUID violation we need to fix');
      }
      
      if (error.message?.includes('unique constraint')) {
        console.log('ℹ️  Constraint error - may need to run migration');
      }
      
      return false;
    }
    
    console.log('✅ Database function succeeded with UUID idempotency key');
    console.log('✅ UUID fix is working correctly');
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Test the old composite string (should fail)
async function testOldCompositeString() {
  console.log('\n🧪 Testing old composite string (should fail)...');
  const workflowId = '63fc648d-1518-405a-8e17-05973c608c71';
  const organizationId = '4b124ab6-0145-49a5-8821-0652e25f4544';
  
  // This is the old problematic pattern
  const badIdempotencyKey = `${workflowId}:step_1_icp`;
  console.log(`❌ Bad composite key: ${badIdempotencyKey}`);
  
  try {
    const { data, error } = await supabase
      .rpc('record_usage_increment_and_complete_step', {
        p_workflow_id: workflowId,
        p_organization_id: organizationId,
        p_model: 'test-model',
        p_prompt_tokens: 100,
        p_completion_tokens: 50,
        p_cost: 0.001,
        p_icp_data: { test: 'data' },
        p_tokens_used: 150,
        p_generated_at: new Date().toISOString(),
        p_idempotency_key: badIdempotencyKey
      });
    
    if (error) {
      console.log('✅ Composite string correctly rejected:', error.message);
      return true;
    }
    
    console.log('❌ Composite string was accepted (unexpected)');
    return false;
    
  } catch (err) {
    console.log('✅ Composite string correctly rejected with exception:', err.message);
    return true;
  }
}

async function main() {
  console.log('🔧 Testing UUID Idempotency Key Fix');
  console.log('=====================================\n');
  
  const uuidTest = await testUUIDFix();
  const compositeTest = await testOldCompositeString();
  
  console.log('\n📊 Test Results:');
  console.log(`UUID fix working: ${uuidTest ? '✅' : '❌'}`);
  console.log(`Composite rejected: ${compositeTest ? '✅' : '❌'}`);
  
  if (uuidTest && compositeTest) {
    console.log('\n🚀 UUID fix is working correctly!');
    console.log('Step 1 ICP generation should now work.');
  } else {
    console.log('\n🚨 Issues detected - may need to run database migration');
  }
}

main().catch(console.error);
