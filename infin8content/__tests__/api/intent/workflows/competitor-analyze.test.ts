/**
 * Integration Tests for Competitor Analysis API Endpoint
 * Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/competitor-analyze/route'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: vi.fn(),
  extractIpAddress: vi.fn(() => '127.0.0.1'),
  extractUserAgent: vi.fn(() => 'test-agent')
}))

vi.mock('@/lib/services/intent-engine/competitor-seed-extractor', () => ({
  extractSeedKeywords: vi.fn(),
  updateWorkflowStatus: vi.fn()
}))


import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { extractSeedKeywords } from '@/lib/services/intent-engine/competitor-seed-extractor'

describe('POST /api/intent/workflows/[workflow_id]/steps/competitor-analyze', () => {
  const mockWorkflowId = 'workflow-123'
  const mockOrganizationId = 'org-123'
  const mockUserId = 'user-123'

  const mockCurrentUser = {
    id: mockUserId,
    org_id: mockOrganizationId,
    email: 'test@example.com',
    role: 'owner'
  }

  const mockWorkflow = {
    id: mockWorkflowId,
    status: 'step_1_icp',
    organization_id: mockOrganizationId
  }

  const mockCompetitors = [
    {
      id: 'comp-1',
      url: 'https://example1.com',
      domain: 'example1.com',
      name: 'Example 1',
      is_active: true
    },
    {
      id: 'comp-2',
      url: 'https://example2.com',
      domain: 'example2.com',
      name: 'Example 2',
      is_active: true
    }
  ]

  const mockExtractionResult = {
    total_keywords_created: 6,
    competitors_processed: 2,
    competitors_failed: 0,
    results: [
      {
        competitor_id: 'comp-1',
        competitor_url: 'https://example1.com',
        seed_keywords_created: 3,
        keywords: [
          {
            seed_keyword: 'keyword 1',
            search_volume: 5000,
            competition_level: 'medium',
            competition_index: 50,
            keyword_difficulty: 50
          },
          {
            seed_keyword: 'keyword 2',
            search_volume: 4000,
            competition_level: 'medium',
            competition_index: 45,
            keyword_difficulty: 45
          },
          {
            seed_keyword: 'keyword 3',
            search_volume: 3000,
            competition_level: 'low',
            competition_index: 30,
            keyword_difficulty: 30
          }
        ]
      },
      {
        competitor_id: 'comp-2',
        competitor_url: 'https://example2.com',
        seed_keywords_created: 3,
        keywords: [
          {
            seed_keyword: 'keyword 4',
            search_volume: 6000,
            competition_level: 'high',
            competition_index: 70,
            keyword_difficulty: 70
          },
          {
            seed_keyword: 'keyword 5',
            search_volume: 5500,
            competition_level: 'high',
            competition_index: 65,
            keyword_difficulty: 65
          },
          {
            seed_keyword: 'keyword 6',
            search_volume: 4500,
            competition_level: 'medium',
            competition_index: 55,
            keyword_difficulty: 55
          }
        ]
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should extract seed keywords successfully', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
    ;(extractSeedKeywords as any).mockResolvedValue(mockExtractionResult)
    
    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST',
      body: JSON.stringify({
        additionalCompetitors: ['https://example1.com', 'https://example2.com']
      })
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.seed_keywords_created).toBe(6)
    expect(data.data.competitors_processed).toBe(2)
    expect(data.data.competitors_failed).toBe(0)
  })

  it('should return 401 when user is not authenticated', async () => {
    ;(getCurrentUser as any).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Authentication required')
  })

  it('should return 404 when workflow is not found', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Workflow not found')
  })

  it('should return 400 when workflow is in invalid state', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const invalidWorkflow = {
      id: mockWorkflowId,
      status: 'step_0_auth',
      organization_id: mockOrganizationId
    }

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: invalidWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid workflow state')
  })

  it('should return 400 when no competitors are configured', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
    
    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST',
      body: JSON.stringify({
        additionalCompetitors: []
      })
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('MIN_1_COMPETITOR_REQUIRED')
    expect(vi.mocked(createServiceRoleClient).mock.results[0].value.from().update).toHaveBeenCalledWith(
      mockWorkflowId,
      mockOrganizationId,
      'failed',
      'No active competitors configured for this organization'
    )
  })

  it('should update workflow status on success', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
    ;(extractSeedKeywords as any).mockResolvedValue(mockExtractionResult)
    
    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(mockSupabase.from().update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'step_2_competitors',
        current_step: 3
      })
    )
  })

  it('should handle extraction errors gracefully', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
    ;(extractSeedKeywords as any).mockRejectedValue(new Error('DataForSEO API error'))
    
    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Seed keyword extraction failed')
    expect(vi.mocked(createServiceRoleClient).mock.results[0].value.from().update).toHaveBeenCalledWith(
      mockWorkflowId,
      mockOrganizationId,
      'failed',
      'DataForSEO API error'
    )
  })

  it('should include results in response', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
    ;(extractSeedKeywords as any).mockResolvedValue(mockExtractionResult)
    
    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    const data = await response.json()
    expect(data.data.results).toBeDefined()
    expect(data.data.results).toHaveLength(2)
    expect(data.data.results[0].competitor_id).toBe('comp-1')
    expect(data.data.results[0].seed_keywords_created).toBe(3)
  })

  it('should handle partial competitor failures with 207 status', async () => {
    ;(getCurrentUser as any).mockResolvedValue(mockCurrentUser)

    const partialResult = {
      total_keywords_created: 3,
      competitors_processed: 1,
      competitors_failed: 1,
      results: [
        {
          competitor_id: 'comp-1',
          competitor_url: 'https://example1.com',
          seed_keywords_created: 3,
          keywords: mockExtractionResult.results[0].keywords
        },
        {
          competitor_id: 'comp-2',
          competitor_url: 'https://example2.com',
          seed_keywords_created: 0,
          keywords: [],
          error: 'Failed to extract keywords'
        }
      ]
    }

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockWorkflow,
                error: null
              })
            })
          })
        })
      })
    }

    ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
    ;(extractSeedKeywords as any).mockResolvedValue(partialResult)
    
    const request = new NextRequest('http://localhost:3000/api/intent/workflows/workflow-123/steps/competitor-analyze', {
      method: 'POST'
    })

    const response = await POST(request, {
      params: Promise.resolve({ workflow_id: mockWorkflowId })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.warning).toBe('1 competitor(s) failed during analysis')
    expect(data.data.seed_keywords_created).toBe(3)
    expect(data.data.competitors_processed).toBe(1)
    expect(data.data.competitors_failed).toBe(1)
  })
})
