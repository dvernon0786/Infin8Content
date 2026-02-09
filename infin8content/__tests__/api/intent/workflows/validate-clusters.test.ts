import { mockNextRequest } from "@/tests/factories/next-request"
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/validate-clusters/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync } from '@/lib/services/audit-logger'
import { ClusterValidator } from '@/lib/services/intent-engine/cluster-validator'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/audit-logger')
vi.mock('@/lib/services/intent-engine/cluster-validator')

describe('/api/intent/workflows/[workflow_id]/steps/validate-clusters', () => {
  let mockSupabase: any
  let mockCurrentUser: any
  let mockClusterValidator: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock current user
    mockCurrentUser = {
      id: 'user-123',
      org_id: 'org-123'
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)

    // Mock Supabase client with proper chaining
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)

    // Mock cluster validator
    mockClusterValidator = {
      validateWorkflowClusters: vi.fn()
    }
    vi.mocked(ClusterValidator).mockImplementation(() => mockClusterValidator)

    // Mock audit logging
    vi.mocked(logActionAsync).mockResolvedValue(undefined)
  })

  it('should validate clusters successfully', async () => {
    // Mock workflow fetch
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'workflow-123',
        status: 'step_6_clustering',
        organization_id: 'org-123'
      },
      error: null
    })

    // Mock clusters fetch - create a proper chain
    const mockClustersChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({
        data: [
          {
            id: 'cluster-1',
            workflow_id: 'workflow-123',
            hub_keyword_id: 'hub-1',
            spoke_keyword_id: 'spoke-1',
            similarity_score: 0.8,
            created_at: '2026-02-01T00:00:00Z'
          }
        ],
        error: null
      })
    }

    // Mock keywords fetch - create a proper chain
    const mockKeywordsChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValueOnce({
        data: [
          {
            id: 'hub-1',
            keyword: 'content marketing',
            search_volume: 10000,
            competition_level: 'high',
            competition_index: 80,
            keyword_difficulty: 70
          },
          {
            id: 'spoke-1',
            keyword: 'content marketing strategy',
            search_volume: 5000,
            competition_level: 'medium',
            competition_index: 60,
            keyword_difficulty: 50
          }
        ],
        error: null
      })
    }

    // Set up from mock to return different chains
    mockSupabase.from
      .mockReturnValueOnce(mockClustersChain as any)
      .mockReturnValueOnce(mockKeywordsChain as any)

    // Mock validation result
    mockClusterValidator.validateWorkflowClusters.mockResolvedValueOnce({
      total_clusters: 1,
      valid_clusters: 1,
      invalid_clusters: 0,
      results: [
        {
          workflow_id: 'workflow-123',
          hub_keyword_id: 'hub-1',
          validation_status: 'valid',
          avg_similarity: 0.8,
          spoke_count: 1
        }
      ]
    })

    // Mock clearing previous results
    mockSupabase.from.mockReturnValueOnce({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null })
    } as any)

    // Mock storing validation results
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ error: null })
    } as any)

    // Mock workflow update
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValueOnce({ error: null })
    } as any)

    // Create mock request
    const mockRequest = {
      headers: new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'test-agent']
      ])
    } as unknown as Request

    // Call the API
    const response = await POST(mockRequest, {
      params: Promise.resolve({ workflow_id: 'workflow-123' })
    })

    // Verify response
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toMatchObject({
      workflow_id: 'workflow-123',
      status: 'step_7_validation',
      total_clusters: 1,
      valid_clusters: 1,
      invalid_clusters: 0
    })

    // Verify audit logging was called
    expect(logActionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workflow.cluster_validation.started',
        orgId: 'org-123',
        userId: 'user-123'
      })
    )

    expect(logActionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workflow.cluster_validation.completed',
        orgId: 'org-123',
        userId: 'user-123'
      })
    )
  })

  it('should return 401 for unauthenticated user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const mockRequest = {} as Request
    const response = await POST(mockRequest, {
      params: Promise.resolve({ workflow_id: 'workflow-123' })
    })

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Authentication required')
  })

  it('should return 404 for non-existent workflow', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows found' }
    })

    const mockRequest = {} as Request
    const response = await POST(mockRequest, {
      params: Promise.resolve({ workflow_id: 'non-existent' })
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Workflow not found')
  })

  it('should return 409 for invalid workflow state', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'workflow-123',
        status: 'step_5_filtering', // Wrong state
        organization_id: 'org-123'
      },
      error: null
    })

    const mockRequest = {} as Request
    const response = await POST(mockRequest, {
      params: Promise.resolve({ workflow_id: 'workflow-123' })
    })

    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.error).toBe('Invalid workflow state')
    expect(data.current_status).toBe('step_5_filtering')
    expect(data.required_status).toBe('step_6_clustering')
  })

  it('should return 400 when no clusters found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'workflow-123',
        status: 'step_6_clustering',
        organization_id: 'org-123'
      },
      error: null
    })

    // Mock empty clusters
    mockSupabase.single.mockResolvedValueOnce({
      data: [],
      error: null
    })

    const mockRequest = {} as Request
    const response = await POST(mockRequest, {
      params: Promise.resolve({ workflow_id: 'workflow-123' })
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('No clusters found for validation')
  })

  it('should handle validation errors gracefully', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'workflow-123',
        status: 'step_6_clustering',
        organization_id: 'org-123'
      },
      error: null
    })

    // Mock clusters
    mockSupabase.single.mockResolvedValueOnce({
      data: [
        {
          id: 'cluster-1',
          workflow_id: 'workflow-123',
          hub_keyword_id: 'hub-1',
          spoke_keyword_id: 'spoke-1',
          similarity_score: 0.8,
          created_at: '2026-02-01T00:00:00Z'
        }
      ],
      error: null
    })

    // Mock keywords
    mockSupabase.single.mockResolvedValueOnce({
      data: [
        {
          id: 'hub-1',
          keyword: 'content marketing',
          search_volume: 10000,
          competition_level: 'high',
          competition_index: 80,
          keyword_difficulty: 70
        }
      ],
      error: null
    })

    // Mock validation error
    mockClusterValidator.validateWorkflowClusters.mockRejectedValueOnce(
      new Error('Validation service failed')
    )

    const mockRequest = {} as Request
    const response = await POST(mockRequest, {
      params: Promise.resolve({ workflow_id: 'workflow-123' })
    })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Cluster validation failed')

    // Verify error audit logging was called
    expect(logActionAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workflow.cluster_validation.failed',
        orgId: 'org-123',
        userId: 'user-123'
      })
    )
  })
})
