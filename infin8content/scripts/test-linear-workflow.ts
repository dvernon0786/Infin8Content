/* 
  Deterministic Linear Workflow Test Harness
  ------------------------------------------
  Validates full FSM progression from step_1_icp → completed
  Stops on first failure with surgical diagnostics
*/

import fetch from 'node-fetch'
import process from 'process'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL!
const TEST_PASSWORD = process.env.TEST_PASSWORD!

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ Missing TEST_EMAIL or TEST_PASSWORD env vars')
  process.exit(1)
}

type StepDef = {
  name: string
  endpoint: string
  expectedNextState: string
  payload?: any
}

interface WorkflowResponse {
  id: string
  name: string
  state: string
  organization_id: string
  created_at: string
}

const STEPS: StepDef[] = [
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
    expectedNextState: 'step_3_seeds'
  },
  {
    name: 'Seeds',
    endpoint: 'approve-seeds',
    expectedNextState: 'step_4_longtails'
  },
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
  {
    name: 'Subtopics',
    endpoint: 'human-approval',
    expectedNextState: 'step_9_articles'
  },
  {
    name: 'Articles',
    endpoint: 'queue-articles',
    expectedNextState: 'completed'
  }
]

let authHeaders: Record<string, string> = {
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

  const data = await res.json() as WorkflowResponse
  console.log(`✅ Workflow created: ${data.id}\n`)
  return data.id
}

async function fetchWorkflow(workflowId: string): Promise<WorkflowResponse> {
  const res = await fetch(`${BASE_URL}/api/intent/workflows/${workflowId}`, {
    headers: authHeaders
  })

  if (!res.ok) {
    console.error('❌ Failed to fetch workflow')
    console.error('Status:', res.status)
    const body = await res.json().catch(() => ({}))
    console.error('Response:', body)
    process.exit(1)
  }

  return await res.json() as WorkflowResponse
}

async function runStep(workflowId: string, step: StepDef) {
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
