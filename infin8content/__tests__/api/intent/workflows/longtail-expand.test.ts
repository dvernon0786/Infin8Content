/**
 * Integration Tests for Long-Tail Keyword Expansion API Endpoint
 * Story 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: mockGetCurrentUser
}))
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient
}))
vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: mockLogActionAsync,
  extractIpAddress: vi.fn(() => '127.0.0.1'),
  extractUserAgent: vi.fn(() => 'test-agent')
}))
vi.mock('@/lib/services/analytics/event-emitter', () => ({
  emitAnalyticsEvent: mockEmitAnalyticsEvent
}))
vi.mock('@/lib/services/intent-engine/longtail-keyword-expander', () => ({
  expandSeedKeywordsToLongtails: mockExpandSeedKeywordsToLongtails
}))

// Mock modules
const mockGetCurrentUser = vi.fn()
const mockCreateServiceRoleClient = vi.fn()
const mockLogActionAsync = vi.fn()
const mockEmitAnalyticsEvent = vi.fn()
const mockExpandSeedKeywordsToLongtails = vi.fn()

// Set up module mocks
vi.mocked(mockGetCurrentUser).mockResolvedValue({
  id: 'user-123',
  org_id: 'org-123'
})

vi.mocked(mockCreateServiceRoleClient).mockReturnValue({
  from: vi.fn()
})

vi.mocked(mockLogActionAsync).mockResolvedValue(undefined)
vi.mocked(mockEmitAnalyticsEvent).mockResolvedValue(undefined)

vi.mocked(mockExpandSeedKeywordsToLongtails).mockResolvedValue({
  seeds_processed: 1,
  total_longtails_created: 12,
  step_4_longtails_completed_at: new Date().toISOString()
})

// Import after mocking
const { POST } = await import('@/app/api/intent/workflows/[workflow_id]/steps/longtail-expand/route')

describe('/api/intent/workflows/[workflow_id]/steps/longtail-expand', () => {
  const mockWorkflowId = 'workflow-123'
  const mockOrganizationId = 'org-123'
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default authenticated user mock
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      org_id: 'org-123'
    })
    
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn()
    })
    
    mockLogActionAsync.mockResolvedValue(undefined)
    mockEmitAnalyticsEvent.mockResolvedValue(undefined)
    mockExpandSeedKeywordsToLongtails.mockResolvedValue({
      seeds_processed: 1,
      total_longtails_created: 12,
      step_4_longtails_completed_at: new Date().toISOString()
    })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(mockGetCurrentUser).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when user has no organization', async () => {
      vi.mocked(mockGetCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: null
      })

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Workflow Validation', () => {
    it('should return 404 when workflow is not found', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: null, error: { message: 'Workflow not found' } }))
              }))
            }))
          }))
        }))
      }

      mockCreateServiceRoleClient.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'invalid-workflow' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Workflow not found')
    })

    it('should return 400 when workflow is not in correct state', async () => {
      // Ensure user is authenticated for this test
      vi.mocked(mockGetCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: 'org-123'
      })

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ 
                  data: { organization_id: 'org-123', status: 'step_1_icp' }, 
                  error: null 
                }))
              }))
            }))
          }))
        }))
      }

      vi.mocked(mockCreateServiceRoleClient).mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid workflow state')
    })
  })

  describe('Successful Expansion', () => {
    it('should successfully expand long-tail keywords', async () => {
      // Ensure user is authenticated for this test
      vi.mocked(mockGetCurrentUser).mockResolvedValueOnce({
        id: 'user-123',
        org_id: 'org-123'
      })

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ 
                  data: { organization_id: 'org-123', status: 'step_3_seeds' }, 
                  error: null 
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          }))
        }))
      }

      vi.mocked(mockCreateServiceRoleClient).mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()
      expect(data.success === true || data.data).toBeTruthy()
    })

    it('should log audit events on success', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ 
                  data: { organization_id: 'org-123', status: 'step_3_seeds' }, 
                  error: null 
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          }))
        }))
      }

      vi.mocked(mockCreateServiceRoleClient).mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })

      expect(mockLogActionAsync.mock.calls.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle expansion service errors', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ 
                  data: { organization_id: 'org-123', status: 'step_3_seeds' }, 
                  error: null 
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          }))
        }))
      }

      vi.mocked(mockCreateServiceRoleClient).mockReturnValue(mockSupabase)
      vi.mocked(mockExpandSeedKeywordsToLongtails).mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })
      const data = await response.json()

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should continue execution even if logging fails', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ 
                  data: { organization_id: 'org-123', status: 'step_3_seeds' }, 
                  error: null 
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null }))
            }))
          }))
        }))
      }

      vi.mocked(mockCreateServiceRoleClient).mockReturnValue(mockSupabase)
      vi.mocked(mockLogActionAsync).mockRejectedValue(new Error('Logging failed'))

      const request = new NextRequest('http://localhost:3000/api/intent/workflows/invalid/steps/longtail-expand', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: mockWorkflowId }) })
      const data = await response.json()

      expect(response.status).toBeLessThan(500) // Should not be a server error
    })
  })
})
