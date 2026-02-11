/**
 * MOCKED E2E VALIDATION - Step 1 → Step 2 Canonical Progression
 * 
 * This test validates the API endpoint structure and guard logic
 * without requiring a live database connection.
 * 
 * Validates:
 * - Step 1 guard structure (current_step === 1 check)
 * - Step 2 guard structure (current_step === 2 check) 
 * - INVALID_STEP_ORDER error responses
 * - API endpoint availability and structure
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase to avoid connection issues
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { id: 'test-workflow-id', current_step: 1, status: 'step_1_icp' },
              error: null
            })
          })
        })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'test-workflow-id', current_step: 1, status: 'step_1_icp' },
            error: null
          })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  })
}))

// Mock getCurrentUser for authentication
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: () => Promise.resolve({
    id: 'test-user-id',
    org_id: 'test-org-id',
    email: 'test@example.com'
  })
}))

// Mock rate limiting
vi.mock('@/lib/services/rate-limiting/persistent-rate-limiter', () => ({
  checkRateLimit: () => Promise.resolve({ allowed: true })
}))

// Mock ICP generation
vi.mock('@/lib/services/intent-engine/icp-generator', () => ({
  generateICPDocument: () => Promise.resolve({
    success: true,
    icp_data: {
      ideal_customer_profile: {
        demographics: 'Test demographics',
        psychographics: 'Test psychographics'
      }
    }
  }),
  storeICPGenerationResult: () => Promise.resolve({ success: true }),
  handleICPGenerationFailure: () => Promise.resolve()
}))

// Mock competitor gate
vi.mock('@/lib/middleware/intent-engine-gate', () => ({
  enforceICPGate: () => null, // Allow passage
  enforceCompetitorGate: () => null // Allow passage
}))

// Mock competitor seed extractor
vi.mock('@/lib/services/intent-engine/competitor-seed-extractor', () => ({
  extractSeedKeywords: () => Promise.resolve({
    success: true,
    keywords: ['test-keyword-1', 'test-keyword-2']
  }),
  updateWorkflowStatus: () => Promise.resolve()
}))

describe('E2E: Step 1 → Step 2 Canonical Guards (Mocked)', () => {
  let workflowId: string

  beforeAll(() => {
    workflowId = 'test-workflow-id'
  })

  describe('Step 1 (ICP Generation) Guard Validation', () => {
    it('should allow execution when current_step = 1', async () => {
      // Import the actual handler
      const { POST } = await import('@/app/api/intent/workflows/[workflow_id]/steps/icp-generate/route')

      // Create mock request
      const mockRequest = new NextRequest('http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: 'Test Company',
          organization_url: 'https://test-company.com',
          organization_linkedin_url: 'https://linkedin.com/company/test-company'
        })
      })

      // Mock params
      const mockParams = Promise.resolve({ workflow_id: workflowId })

      // Call the handler
      const response = await POST(mockRequest, { params: mockParams })

      // Should succeed (status 200 or similar)
      expect(response.status).not.toBe(400)
      
      const body = await response.json()
      expect(body.error).not.toBe('INVALID_STEP_ORDER')
    })

    it('should reject execution when current_step ≠ 1', async () => {
      // Override the mock to return current_step = 2
      vi.doMock('@/lib/supabase/server', () => ({
        createServiceRoleClient: () => {
          let callCount = 0
          return {
            from: () => ({
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () => {
                      callCount++
                      // First call: workflow lookup
                      if (callCount === 1) {
                        return Promise.resolve({
                          data: { id: 'test-workflow-id', current_step: 2, status: 'step_1_icp' },
                          error: null
                        })
                      }
                      // Second call: idempotency check
                      return Promise.resolve({
                        data: null,
                        error: null
                      })
                    }
                  })
                })
              })
            })
          }
        }
      }))

      // Re-import to get updated mock
      const { POST } = await import('@/app/api/intent/workflows/[workflow_id]/steps/icp-generate/route')

      const mockRequest = new NextRequest('http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: 'Test Company',
          organization_url: 'https://test-company.com',
          organization_linkedin_url: 'https://linkedin.com/company/test-company'
        })
      })

      const mockParams = Promise.resolve({ workflow_id: workflowId })

      const response = await POST(mockRequest, { params: mockParams })

      // Should reject with INVALID_STEP_ORDER
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('INVALID_STEP_ORDER')
      expect(body.message).toContain('Workflow must be at step 1')
    })
  })

  describe('Step 2 (Competitor Analysis) Guard Validation', () => {
    it('should allow execution when current_step = 2', async () => {
      // Mock current_step = 2 with competitor count
      vi.doMock('@/lib/supabase/server', () => ({
        createServiceRoleClient: () => {
          let callCount = 0
          return {
            from: () => ({
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () => {
                      callCount++
                      // First call: workflow lookup
                      if (callCount === 1) {
                        return Promise.resolve({
                          data: { id: 'test-workflow-id', current_step: 2, status: 'step_1_icp' },
                          error: null
                        })
                      }
                      // Second call: competitor lookup
                      return Promise.resolve({
                        data: { id: 'test-workflow-id', current_step: 2, status: 'step_1_icp' },
                        error: null
                      })
                    }
                  })
                })
              }),
              count: () => ({
                select: () => ({
                  eq: () => ({
                    eq: () => Promise.resolve({ count: 1 })
                  })
                })
              })
            })
          }
        }
      }))

      const { POST } = await import('@/app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route')

      const mockRequest = new NextRequest('http://localhost:3000/api/intent/workflows/test-workflow-id/steps/competitor-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const mockParams = Promise.resolve({ workflow_id: workflowId })

      const response = await POST(mockRequest, { params: mockParams })

      // Should succeed (not reject due to step order)
      expect(response.status).not.toBe(400)
      
      const body = await response.json()
      expect(body.error).not.toBe('INVALID_STEP_ORDER')
    })

    it('should reject execution when current_step ≠ 2', async () => {
      // Mock current_step = 1 (wrong step)
      vi.doMock('@/lib/supabase/server', () => ({
        createServiceRoleClient: () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'test-workflow-id', current_step: 1, status: 'step_1_icp' },
                    error: null
                  })
                })
              })
            }),
            count: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ count: 1 })
              })
            })
          })
        })
      }))

      const { POST } = await import('@/app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route')

      const mockRequest = new NextRequest('http://localhost:3000/api/intent/workflows/test-workflow-id/steps/competitor-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const mockParams = Promise.resolve({ workflow_id: workflowId })

      const response = await POST(mockRequest, { params: mockParams })

      // Should reject with INVALID_STEP_ORDER
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body.error).toBe('INVALID_STEP_ORDER')
      expect(body.message).toContain('Workflow must be at step 2')
    })
  })

  describe('Guard Logic Structure Validation', () => {
    it('should have proper guard structure in Step 1', async () => {
      // Read the actual source file to verify guard structure
      const fs = await import('fs')
      const path = await import('path')
      
      const filePath = path.join(process.cwd(), 'app/api/intent/workflows/[workflow_id]/steps/icp-generate/route.ts')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      // Verify canonical guard exists
      expect(fileContent).toContain('if (typedWorkflow.current_step !== 1)')
      expect(fileContent).toContain('INVALID_STEP_ORDER')
      expect(fileContent).toContain('Workflow must be at step 1')
    })

    it('should have proper guard structure in Step 2', async () => {
      const fs = await import('fs')
      const path = await import('path')
      
      const filePath = path.join(process.cwd(), 'app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route.ts')
      const fileContent = fs.readFileSync(filePath, 'utf8')

      // Verify canonical guard exists
      expect(fileContent).toContain('if (typedWorkflow.current_step !== 2)')
      expect(fileContent).toContain('INVALID_STEP_ORDER')
      expect(fileContent).toContain('Workflow must be at step 2')
    })
  })
})
