/**
 * Deterministic E2E Test: Step 1 → Step 2 Workflow Execution
 * Tests actual API endpoints, guard enforcement, and state transitions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const BASE_URL = 'http://localhost:3000'
let workflowId: string
let authToken: string
let organizationId: string

async function getWorkflow(id: string) {
  const res = await fetch(`${BASE_URL}/api/internal/test-get-workflow?id=${id}`)
  return res.json()
}

describe('E2E: Step 1 → Step 2 Deterministic Execution', () => {

  beforeAll(async () => {
    // 1️⃣ Create fresh workflow via API (NOT DB insert)
    const res = await fetch(`${BASE_URL}/api/internal/test-create-workflow`, {
      method: 'POST'
    })

    expect(res.status).toBe(200)

    const data = await res.json()
    workflowId = data.workflow_id
    authToken = data.token
    organizationId = data.organization_id

    console.log(`[E2E] Created test workflow: ${workflowId}`)
  })

  afterAll(async () => {
    // Cleanup test data
    await fetch(`${BASE_URL}/api/internal/test-delete-workflow?id=${workflowId}`, {
      method: 'DELETE'
    })
    console.log(`[E2E] Cleaned up workflow: ${workflowId}`)
  })

  it('Step 1 executes successfully', async () => {
    const res = await fetch(
      `${BASE_URL}/api/intent/workflows/${workflowId}/steps/icp-generate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_description: 'Test business for E2E validation',
          target_audience: 'Test audience',
          value_proposition: 'Test value proposition'
        })
      }
    )

    expect(res.status).toBe(200)

    const workflow = await getWorkflow(workflowId)

    expect(workflow.workflow.current_step).toBe(2)
    expect(workflow.workflow.status).toBe('step_1_icp')
    expect(workflow.workflow.step_1_icp_completed_at).toBeTruthy()
  })

  it('Step 1 cannot execute again (guard enforced)', async () => {
    const res = await fetch(
      `${BASE_URL}/api/intent/workflows/${workflowId}/steps/icp-generate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_description: 'Test business for E2E validation',
          target_audience: 'Test audience',
          value_proposition: 'Test value proposition'
        })
      }
    )

    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBe('INVALID_STEP_ORDER')

    const workflow = await getWorkflow(workflowId)
    expect(workflow.workflow.current_step).toBe(2) // unchanged
  })

  it('Step 2 cannot execute before Step 1 (fresh workflow case)', async () => {
    // Create second workflow but do NOT run Step 1
    const resCreate = await fetch(`${BASE_URL}/api/internal/test-create-workflow`, {
      method: 'POST'
    })

    const fresh = await resCreate.json()
    const freshWorkflowId = fresh.workflow_id

    try {
      const res = await fetch(
        `${BASE_URL}/api/intent/workflows/${freshWorkflowId}/steps/competitor-analyze`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${fresh.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            competitors: [
              {
                id: 'test-competitor-1',
                url: 'https://example.com',
                domain: 'example.com',
                is_active: true
              }
            ]
          })
        }
      )

      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error).toBe('INVALID_STEP_ORDER')
    } finally {
      // Cleanup fresh workflow
      await fetch(`${BASE_URL}/api/internal/test-delete-workflow?id=${freshWorkflowId}`, {
        method: 'DELETE'
      })
    }
  })

  it('Step 2 executes correctly after Step 1', async () => {
    const res = await fetch(
      `${BASE_URL}/api/intent/workflows/${workflowId}/steps/competitor-analyze`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competitors: [
            {
              id: 'test-competitor-1',
              url: 'https://example.com',
              domain: 'example.com',
              is_active: true
            },
            {
              id: 'test-competitor-2',
              url: 'https://test.com',
              domain: 'test.com',
              is_active: true
            }
          ]
        })
      }
    )

    expect(res.status).toBe(200)

    const workflow = await getWorkflow(workflowId)

    expect(workflow.workflow.current_step).toBe(3)
    expect(workflow.workflow.status).toBe('step_2_competitors')
    expect(workflow.workflow.step_2_competitor_completed_at).toBeTruthy()
  })

  it('Step 2 cannot execute twice (immutability enforced)', async () => {
    const res = await fetch(
      `${BASE_URL}/api/intent/workflows/${workflowId}/steps/competitor-analyze`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competitors: [
            {
              id: 'test-competitor-1',
              url: 'https://example.com',
              domain: 'example.com',
              is_active: true
            }
          ]
        })
      }
    )

    expect(res.status).toBe(409) // STEP_ALREADY_COMPLETED

    const body = await res.json()
    expect(body.error).toBe('STEP_ALREADY_COMPLETED')

    const workflow = await getWorkflow(workflowId)
    expect(workflow.workflow.current_step).toBe(3) // unchanged
  })

  it('Step 2 immutability protects human decisions', async () => {
    // Verify keywords exist and are protected
    const workflow = await getWorkflow(workflowId)
    
    // Should have keywords from Step 2 execution
    expect(workflow.keywords.count).toBeGreaterThan(0)
    
    // Attempt to re-run Step 2 should be blocked
    const res = await fetch(
      `${BASE_URL}/api/intent/workflows/${workflowId}/steps/competitor-analyze`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          competitors: [
            {
              id: 'test-competitor-3',
              url: 'https://different.com',
              domain: 'different.com',
              is_active: true
            }
          ]
        })
      }
    )

    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('STEP_ALREADY_COMPLETED')
  })

})
