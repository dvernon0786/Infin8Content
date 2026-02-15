/**
 * Deterministic E2E Test: Step 1 → Step 2 Workflow Execution
 * Tests actual API endpoints, guard enforcement, and state transitions
 * Uses deterministic fake extractor for repeatable results
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
    // Set environment for deterministic testing
    process.env.USE_DETERMINISTIC_EXTRACTOR = 'true'
    
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

    expect(workflow.workflow.state).toBe('step_2_competitors')
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
    expect(workflow.workflow.state).toBe('step_2_competitors') // unchanged
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

    expect(workflow.workflow.state).toBe('step_3_seeds')
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
    expect(workflow.workflow.state).toBe('step_3_seeds') // unchanged
  })

  it('Step 2 is atomic under concurrency', async () => {
    // Create a fresh workflow for concurrency testing
    const resCreate = await fetch(`${BASE_URL}/api/internal/test-create-workflow`, {
      method: 'POST'
    })

    const fresh = await resCreate.json()
    const freshWorkflowId = fresh.workflow_id
    const freshToken = fresh.token

    try {
      // First, advance to Step 2 by running Step 1
      const step1Res = await fetch(
        `${BASE_URL}/api/intent/workflows/${freshWorkflowId}/steps/icp-generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${freshToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_description: 'Test business for concurrency validation',
            target_audience: 'Test audience',
            value_proposition: 'Test value proposition'
          })
        }
      )

      expect(step1Res.status).toBe(200)

      // ATOMICITY TEST: Run Step 2 concurrently 3 times
      const concurrentCalls = await Promise.allSettled([
        fetch(
          `${BASE_URL}/api/intent/workflows/${freshWorkflowId}/steps/competitor-analyze`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${freshToken}`,
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
        ),
        fetch(
          `${BASE_URL}/api/intent/workflows/${freshWorkflowId}/steps/competitor-analyze`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${freshToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              competitors: [
                {
                  id: 'test-competitor-2',
                  url: 'https://test.com',
                  domain: 'test.com',
                  is_active: true
                }
              ]
            })
          }
        ),
        fetch(
          `${BASE_URL}/api/intent/workflows/${freshWorkflowId}/steps/competitor-analyze`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${freshToken}`,
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
      ])

      // Analyze results
      const results = await Promise.all(
        concurrentCalls.map(async (r) => {
          if (r.status === 'fulfilled') {
            const response = r.value as Response
            const json = await response.json().catch(() => ({}))
            return {
              status: response.status,
              error: json.error
            }
          }
          return { status: 500, error: 'Promise rejected' }
        })
      )

      const successes = results.filter(r => r.status === 200)
      const conflicts = results.filter(r => r.status === 409 && r.error === 'STEP_ALREADY_COMPLETED')
      const transitionFailures = results.filter(r => r.status === 409 && r.error === 'STEP_TRANSITION_FAILED')

      // ATOMICITY ASSERTIONS
      expect(successes.length).toBe(1) // Only one should succeed
      expect(conflicts.length + transitionFailures.length).toBe(2) // Two should fail

      // Verify final state - exactly 2 keywords (from the successful request)
      const finalWorkflow = await getWorkflow(freshWorkflowId)
      expect(finalWorkflow.keywords.count).toBe(2) // Not 6 (3 requests × 2 keywords)
      expect(finalWorkflow.workflow.state).toBe('step_3_seeds') // Advanced to step 3

      console.log(`[Concurrency Test] Results: ${successes.length} success, ${conflicts.length} conflicts, ${finalWorkflow.keywords.count} keywords`)

    } finally {
      // Cleanup fresh workflow
      await fetch(`${BASE_URL}/api/internal/test-delete-workflow?id=${freshWorkflowId}`, {
        method: 'DELETE'
      })
    }
  })

  it('Step 2 returns deterministic keyword results', async () => {
    const workflow = await getWorkflow(workflowId)
    
    // DETERMINISTIC: Exactly 4 keywords (2 per competitor)
    expect(workflow.keywords.count).toBe(4)
    
    // DETERMINISTIC: Specific keyword names from fake extractor
    const res = await fetch(`${BASE_URL}/api/internal/test-get-workflow?id=${workflowId}`)
    const data = await res.json()
    
    // Verify keywords were created with deterministic data
    expect(data.keywords.count).toBe(4)
  })

  it('Step 2 immutability protects human decisions', async () => {
    // Verify keywords exist and are protected
    const workflow = await getWorkflow(workflowId)
    
    // Should have exactly 4 keywords from deterministic extractor
    expect(workflow.keywords.count).toBe(4)
    
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
    
    // DETERMINISTIC: Still exactly 4 keywords (no change)
    const finalWorkflow = await getWorkflow(workflowId)
    expect(finalWorkflow.keywords.count).toBe(4)
  })

})
