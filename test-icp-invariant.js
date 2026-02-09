#!/usr/bin/env node

/**
 * INVARIANT TEST: ICP cannot run without valid inputs
 * 
 * This test ensures the critical safety invariant:
 * "POST /steps/icp-generate with missing fields → must 400 in <50ms"
 * 
 * Run this test after any deployment to prevent regressions.
 */

const http = require('http');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  timeout: 50, // 50ms max response time
  workflowId: process.env.TEST_WORKFLOW_ID || 'test-workflow-id'
};

// Test cases - each should return 400
const TEST_CASES = [
  {
    name: 'Empty payload',
    payload: {},
    expectedStatus: 400
  },
  {
    name: 'Missing organization_name',
    payload: {
      organization_url: 'https://example.com',
      organization_linkedin_url: 'https://linkedin.com/company/example'
    },
    expectedStatus: 400
  },
  {
    name: 'Missing organization_url',
    payload: {
      organization_name: 'Test Organization',
      organization_linkedin_url: 'https://linkedin.com/company/example'
    },
    expectedStatus: 400
  },
  {
    name: 'Missing organization_linkedin_url',
    payload: {
      organization_name: 'Test Organization',
      organization_url: 'https://example.com'
    },
    expectedStatus: 400
  },
  {
    name: 'Invalid URL format',
    payload: {
      organization_name: 'Test Organization',
      organization_url: 'not-a-url',
      organization_linkedin_url: 'not-a-url'
    },
    expectedStatus: 400
  },
  {
    name: 'Empty strings',
    payload: {
      organization_name: '',
      organization_url: '',
      organization_linkedin_url: ''
    },
    expectedStatus: 400
  }
];

function makeRequest(testCase) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify(testCase.payload);
    const options = {
      hostname: new URL(TEST_CONFIG.baseUrl).hostname,
      port: new URL(TEST_CONFIG.baseUrl).port || 80,
      path: `/api/intent/workflows/${TEST_CONFIG.workflowId}/steps/icp-generate`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(TEST_CONFIG.timeout);
    req.write(postData);
    req.end();
  });
}

async function runInvariantTest() {
  console.log('🔒 ICP INVARIANT TEST: "Cannot run without valid inputs"\n');
  console.log(`📍 Target: ${TEST_CONFIG.baseUrl}/api/intent/workflows/${TEST_CONFIG.workflowId}/steps/icp-generate`);
  console.log(`⏱️  Max response time: ${TEST_CONFIG.timeout}ms\n`);

  let allPassed = true;

  for (const testCase of TEST_CASES) {
    try {
      console.log(`🧪 Testing: ${testCase.name}`);
      
      const result = await makeRequest(testCase);
      
      const statusCorrect = result.statusCode === testCase.expectedStatus;
      const timeCorrect = result.responseTime <= TEST_CONFIG.timeout;
      
      if (statusCorrect && timeCorrect) {
        console.log(`  ✅ PASS: ${result.statusCode} (${result.responseTime}ms)`);
      } else {
        console.log(`  ❌ FAIL: Expected ${testCase.expectedStatus} in ≤${TEST_CONFIG.timeout}ms, got ${result.statusCode} (${result.responseTime}ms)`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      allPassed = false;
    }
    
    console.log('');
  }

  if (allPassed) {
    console.log('🎉 ALL INVARIANT TESTS PASSED');
    console.log('✅ ICP cannot run without valid inputs');
    console.log('✅ Response times within limits');
    console.log('✅ Production safety maintained');
    process.exit(0);
  } else {
    console.log('💥 INVARIANT TESTS FAILED');
    console.log('❌ Safety regression detected');
    console.log('❌ DO NOT DEPLOY TO PRODUCTION');
    process.exit(1);
  }
}

// Run the test
runInvariantTest().catch(console.error);
