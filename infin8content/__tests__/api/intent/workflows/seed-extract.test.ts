import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * Integration Tests for Competitor Gate Enforcement
 * Story 39.2: Enforce Hard Gate - Competitors Required for Seed Keywords
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/seed-extract/route'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { enforceICPGate, enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/middleware/intent-engine-gate')

describe('Seed Extract API - Competitor Gate Integration', () => {
  let mockSupabase: any
  let mockCurrentUser: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock current user
    mockCurrentUser = {
      id: 'test-user-id',
      org_id: 'test-org-id'
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)
    
    // Mock Supabase
    mockSupabase = {
      from: vi.fn(() => {
        const mockSingle = vi.fn()
        const mockEq = vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) }))
        const mockSelect = vi.fn(() => ({ eq: mockEq }))
        return { select: mockSelect, update: vi.fn(() => ({ eq: vi.fn() })) }
      })
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    
    // Mock gates to pass by default
    vi.mocked(enforceICPGate).mockResolvedValue(null)
    vi.mocked(enforceCompetitorGate).mockResolvedValue(null)
  })

  it('should allow seed extraction when both gates pass', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const mockWorkflow = {
      id: workflowId,
      status: 'step_2_competitors',
      organization_id: 'test-org-id'
    }
    
    const mockSeedKeywords = [{ id: 'seed-1' }]
    
    // Set up mocks
    const fromMock = mockSupabase.from()
    const selectMock = fromMock.select
    const eqMock = selectMock().eq
    const singleMock = eqMock().eq().single
    singleMock.mockResolvedValue({ data: mockWorkflow, error: null })
    
    const keywordsMock = mockSupabase.from().select().eq().eq().limit
    keywordsMock.mockResolvedValue({ data: mockSeedKeywords, error: null })
    
    const updateMock = mockSupabase.from().update().eq
    updateMock.mockResolvedValue({ error: null })

    // Mock request
    const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow-id/steps/seed-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-agent',
        'X-Forwarded-For': '127.0.0.1'
      }
    })
    
    const params = Promise.resolve({ workflow_id: workflowId })

    // Act
    const response = await POST(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.new_status).toBe('step_3_seeds')
    expect(data.data.previous_status).toBe('step_2_competitors')
  })

  it('should block when competitor gate returns 423 response', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    
    // Mock competitor gate to block
    const gateResponse = new Response('Competitor analysis required', { status: 423 })
    vi.mocked(enforceCompetitorGate).mockResolvedValue(gateResponse as any)
    
    // Mock request
    const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow-id/steps/seed-extract', {
      method: 'POST'
    })
    
    const params = Promise.resolve({ workflow_id: workflowId })

    // Act
    const response = await POST(request, { params })

    // Assert
    expect(response.status).toBe(423)
  })

  it('should block when ICP gate returns 423 response', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    
    // Mock ICP gate to block
    const gateResponse = new Response('ICP completion required', { status: 423 })
    vi.mocked(enforceICPGate).mockResolvedValue(gateResponse as any)
    
    // Mock request
    const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow-id/steps/seed-extract', {
      method: 'POST'
    })
    
    const params = Promise.resolve({ workflow_id: workflowId })

    // Act
    const response = await POST(request, { params })

    // Assert
    expect(response.status).toBe(423)
  })

  it('should return 400 when workflow is not in step_2_competitors state', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const mockWorkflow = {
      id: workflowId,
      status: 'step_1_icp', // Wrong state
      organization_id: 'test-org-id'
    }
    
    // Set up mocks
    const fromMock = mockSupabase.from()
    const selectMock = fromMock.select
    const eqMock = selectMock().eq
    const singleMock = eqMock().eq().single
    singleMock.mockResolvedValue({ data: mockWorkflow, error: null })
    
    // Mock request
    const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow-id/steps/seed-extract', {
      method: 'POST'
    })
    
    const params = Promise.resolve({ workflow_id: workflowId })

    // Act
    const response = await POST(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid workflow state')
    expect(data.message).toContain('step_2_competitors state')
  })

  it('should return 400 when no seed keywords exist', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    const mockWorkflow = {
      id: workflowId,
      status: 'step_2_competitors',
      organization_id: 'test-org-id'
    }
    
    // Set up mocks - workflow exists but no seed keywords
    const fromMock = mockSupabase.from()
    const selectMock = fromMock.select
    const eqMock = selectMock().eq
    const singleMock = eqMock().eq().single
    singleMock.mockResolvedValue({ data: mockWorkflow, error: null })
    
    const keywordsMock = mockSupabase.from().select().eq().eq().limit
    keywordsMock.mockResolvedValue({ data: [], error: null }) // No keywords
    
    // Mock request
    const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow-id/steps/seed-extract', {
      method: 'POST'
    })
    
    const params = Promise.resolve({ workflow_id: workflowId })

    // Act
    const response = await POST(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.error).toBe('No seed keywords found')
    expect(data.message).toContain('Competitor analysis must be completed first')
  })

  it('should return 401 when user is not authenticated', async () => {
    // Arrange
    const workflowId = 'test-workflow-id'
    
    // Mock unauthenticated user
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    
    // Mock request
    const request = mockNextRequest({url: 'http://localhost/api/intent/workflows/test-workflow-id/steps/seed-extract', {
      method: 'POST'
    })
    
    const params = Promise.resolve({ workflow_id: workflowId })

    // Act
    const response = await POST(request, { params })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })
})
