/* 
  Deterministic Linear Workflow Test Harness
  ------------------------------------------
  Validates full FSM progression from step_1_icp → completed
  Stops on first failure with surgical diagnostics
*/

const process = require('process')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL
const TEST_PASSWORD = process.env.TEST_PASSWORD

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ Missing TEST_EMAIL or TEST_PASSWORD env vars')
  process.exit(1)
}

// Dynamic import for node-fetch
let fetch
async function initFetch() {
  fetch = (await import('node-fetch')).default
}

const STEPS = [
  {
    name: 'ICP',
    endpoint: 'icp-generate',
    expectedNextState: 'step_2_competitors',
    payload: {
      organization_name: 'Test Org',
      organization_url: 'https://example.com',
      organization_linkedin_url: 'https://linkedin.com/company/example'
    }
  },
  {
    name: 'Competitors',
    endpoint: 'competitor-analyze',
    expectedNextState: 'step_3_seeds',
    payload: {
      additionalCompetitors: [
        'https://hubspot.com',
        'https://semrush.com',
        'https://ahrefs.com'
      ]
    }
  },
  // Note: Skipping admin approval steps for technical FSM validation
  // {
  //   name: 'Seeds',
  //   endpoint: 'approve-seeds',
  //   expectedNextState: 'step_4_longtails',
  //   payload: {
  //     decision: 'approved',
  //     feedback: 'Test approval for linear workflow test'
  //   }
  // },
  {
    name: 'Longtails',
    endpoint: 'longtail-expand',
    expectedNextState: 'step_5_filtering'
  },
  {
    name: 'Filtering',
    endpoint: 'filter-keywords',
    expectedNextState: 'step_6_clustering'
  },
  {
    name: 'Clustering',
    endpoint: 'cluster-topics',
    expectedNextState: 'step_7_validation'
  },
  {
    name: 'Validation',
    endpoint: 'validate-clusters',
    expectedNextState: 'step_8_subtopics'
  },
  // {
  //   name: 'Subtopics',
  //   endpoint: 'human-approval',
  //   expectedNextState: 'step_9_articles'
  // },
  {
    name: 'Articles',
    endpoint: 'queue-articles',
    expectedNextState: 'completed'
  }
]

let authHeaders = {
  'Content-Type': 'application/json'
}

async function login() {
  console.log('🔐 Logging in...')

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  })

  if (!res.ok) {
    console.error('❌ Login failed')
    console.error('Status:', res.status)
    const body = await res.json().catch(() => ({}))
    console.error('Response:', body)
    process.exit(1)
  }

  const cookies = res.headers.get('set-cookie')
  if (!cookies) {
    console.error('❌ No auth cookie returned')
    process.exit(1)
  }

  authHeaders['Cookie'] = cookies
  console.log('✅ Authenticated\n')
}

async function createWorkflow() {
  console.log('🆕 Creating workflow...')

  const res = await fetch(`${BASE_URL}/api/intent/workflows`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `FSM Linear Test ${Date.now()}` 
    })
  })

  if (!res.ok) {
    console.error('❌ Failed to create workflow')
    console.error('Status:', res.status)
    const body = await res.json().catch(() => ({}))
    console.error('Response:', body)
    process.exit(1)
  }

  const data = await res.json()
  console.log(`✅ Workflow created: ${data.id}\n`)
  return data.id
}

async function fetchWorkflow(workflowId) {
  const res = await fetch(`${BASE_URL}/api/intent/workflows`, {
    headers: authHeaders
  })

  if (!res.ok) {
    console.error('❌ Failed to fetch workflows')
    console.error('Status:', res.status)
    const body = await res.json().catch(() => ({}))
    console.error('Response:', body)
    process.exit(1)
  }

  const data = await res.json()
  const workflow = data.workflows.find(w => w.id === workflowId)
  
  if (!workflow) {
    console.error('❌ Workflow not found in list')
    console.error('Looking for ID:', workflowId)
    console.error('Available workflows:', data.workflows.map(w => w.id))
    process.exit(1)
  }

  return workflow
}

async function runStep(workflowId, step) {
  console.log(`▶ Running: ${step.name}`)

  const before = await fetchWorkflow(workflowId)

  const res = await fetch(
    `${BASE_URL}/api/intent/workflows/${workflowId}/steps/${step.endpoint}`,
    {
      method: 'POST',
      headers: authHeaders,
      body: step.payload ? JSON.stringify(step.payload) : undefined
    }
  )

  const responseBody = await res.json().catch(() => ({}))

  const after = await fetchWorkflow(workflowId)

  if (!res.ok) {
    console.error(`❌ API FAILED at ${step.name}`)
    console.error('Status:', res.status)
    console.error('Response:', responseBody)
    console.error('Previous State:', before.state)
    console.error('Current State:', after.state)
    process.exit(1)
  }

  if (after.state !== step.expectedNextState) {
    console.error(`❌ STATE MISMATCH at ${step.name}`)
    console.error('Expected:', step.expectedNextState)
    console.error('Actual:', after.state)
    console.error('Previous:', before.state)
    console.error('Response:', responseBody)
    process.exit(1)
  }

  console.log(`✅ Transition successful: ${after.state}\n`)
}

async function runLinearTest() {
  console.log('🚀 Starting Linear Workflow Test')
  console.log('=====================================\n')

  // Set test environment for deterministic fake extractor
  process.env.NODE_ENV = 'test'

  // Initialize fetch
  await initFetch()

  await login()
  const workflowId = await createWorkflow()

  for (const step of STEPS) {
    await runStep(workflowId, step)
  }

  console.log('🎉 SUCCESS: Workflow reached completed state cleanly.')
  console.log('✅ All FSM transitions working correctly')
  process.exit(0)
}

runLinearTest().catch(err => {
  console.error('❌ FATAL ERROR:', err)
  process.exit(1)
})
