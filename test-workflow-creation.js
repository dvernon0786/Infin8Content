// Test script for workflow creation
// Run this in browser console when logged into the dashboard

async function testWorkflowCreation() {
  console.log('🧪 Testing workflow creation...');
  
  try {
    const response = await fetch('/api/intent/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Intent Workflow',
        description: 'Created to verify dashboard functionality'
      })
    });
    
    if (response.ok) {
      const workflow = await response.json();
      console.log('✅ Workflow created successfully:', workflow);
      
      // Test dashboard refresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } else {
      const error = await response.json();
      console.error('❌ Failed to create workflow:', error);
    }
  } catch (error) {
    console.error('❌ Error creating workflow:', error);
  }
}

// Test dashboard API
async function testDashboardAPI() {
  console.log('🧪 Testing dashboard API...');
  
  try {
    const response = await fetch('/api/intent/workflows/dashboard');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dashboard data:', data);
      console.log('📊 Summary:', data.summary);
      console.log('📋 Workflows count:', data.workflows.length);
    } else {
      const error = await response.json();
      console.error('❌ Failed to fetch dashboard:', error);
    }
  } catch (error) {
    console.error('❌ Error fetching dashboard:', error);
  }
}

// Run tests
console.log('🚀 Starting workflow tests...');
testDashboardAPI();
testWorkflowCreation();
