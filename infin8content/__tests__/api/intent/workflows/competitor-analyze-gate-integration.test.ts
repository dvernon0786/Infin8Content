import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route'

// Mock all the dependencies
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('@/lib/middleware/intent-engine-gate', () => ({
  enforceICPGate: vi.fn()
}))

vi.mock('@/lib/services/intent-engine/competitor-seed-extractor', () => ({
  extractSeedKeywords: vi.fn(),
  updateWorkflowStatus: vi.fn()
}))

vi.mock('@/lib/services/competitor-workflow-integration', () => ({
  getWorkflowCompetitors: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

describe('ICP Gate Integration - Competitor Analysis Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 423 when ICP gate blocks access', async () => {
    // Arrange
    const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
    const { enforceICPGate } = await import('@/lib/middleware/intent-engine-gate')
    
    // Mock authentication success
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'test-user-id',
      org_id: 'test-org-id'
    })

    // Mock gate enforcement blocking access
    const mockGateResponse = new Response(
      JSON.stringify({
        error: 'ICP completion required before competitor analysis',
        workflowStatus: 'step_1_icp',
        icpStatus: 'step_1_icp',
        requiredAction: 'Complete ICP generation (step 2) before proceeding',
        currentStep: 'competitor-analyze',
        blockedAt: new Date().toISOString()
      }),
      { status: 423 }
    )
    
    vi.mocked(enforceICPGate).mockResolvedValue(mockGateResponse)

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' })
    })

    // Act
    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: 'test-workflow-id' })
    })

    // Assert
    expect(response.status).toBe(423)
    
    const responseData = await response.json()
    expect(responseData).toMatchObject({
      error: 'ICP completion required before competitor analysis',
      workflowStatus: 'step_1_icp',
      icpStatus: 'step_1_icp',
      requiredAction: 'Complete ICP generation (step 2) before proceeding',
      currentStep: 'competitor-analyze',
      blockedAt: expect.any(String)
    })

    expect(enforceICPGate).toHaveBeenCalledWith('test-workflow-id', 'competitor-analyze')
  })

  it('should continue when ICP gate allows access', async () => {
    // Arrange
    const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
    const { enforceICPGate } = await import('@/lib/middleware/intent-engine-gate')
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const { getWorkflowCompetitors } = await import('@/lib/services/competitor-workflow-integration')
    const { extractSeedKeywords } = await import('@/lib/services/intent-engine/competitor-seed-extractor')
    
    // Mock authentication success
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'test-user-id',
      org_id: 'test-org-id'
    })

    // Mock gate enforcement allowing access
    vi.mocked(enforceICPGate).mockResolvedValue(null)

    // Mock workflow verification
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'test-workflow-id',
                  status: 'step_2_icp_complete',
                  organization_id: 'test-org-id'
                },
                error: null
              })
            }))
          }))
        }))
      }))
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)

    // Mock competitor data
    vi.mocked(getWorkflowCompetitors).mockResolvedValue([
      { id: 'comp1', url: 'https://example.com' }
    ])

    // Mock extraction success
    vi.mocked(extractSeedKeywords).mockResolvedValue({
      success: true,
      seedsExtracted: 3,
      keywords: ['keyword1', 'keyword2', 'keyword3']
    })

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' })
    })

    // Act
    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: 'test-workflow-id' })
    })

    // Assert
    expect(response.status).toBe(200)
    
    expect(enforceICPGate).toHaveBeenCalledWith('test-workflow-id', 'competitor-analyze')
    expect(extractSeedKeywords).toHaveBeenCalled()
  })
})
