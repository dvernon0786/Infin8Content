import { mockCurrentUser } from "@/tests/factories/current-user"
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/filter-keywords/route'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logActionAsync } from '@/lib/services/audit-logger'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/audit-logger')
vi.mock('@/lib/services/analytics/event-emitter')
vi.mock('@/lib/services/intent-engine/keyword-filter', () => ({
  filterKeywords: vi.fn(),
  getOrganizationFilterSettings: vi.fn()
}))

const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient)
const mockLogActionAsync = vi.mocked(logActionAsync)
const mockEmitAnalyticsEvent = vi.mocked(emitAnalyticsEvent)

describe('POST /api/intent/workflows/[workflow_id]/steps/filter-keywords', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    is: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    upsert: vi.fn(() => mockSupabase)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateServiceRoleClient.mockReturnValue(mockSupabase)
    
    // Reset all mock implementations
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.is.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.single.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.upsert.mockReturnValue(mockSupabase)
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'test-workflow' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when user has no organization', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user1', org_id: null })

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'test-workflow' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Workflow Validation', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user1', org_id: 'org1' })
    })

    it('should return 404 when workflow does not exist', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Workflow not found' }
      })

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Workflow not found')
    })

    it('should return 409 when workflow is not in correct state', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'workflow1', status: 'step_3_icp', organization_id: 'org1' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'workflow1' }) })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Invalid workflow state')
      expect(data.current_status).toBe('step_3_icp')
    })

    it('should return 404 when workflow belongs to different organization', async () => {
      // Mock the chain: from().select().eq().eq().single()
      // Since the user is from org1 but workflow belongs to org2, the query should return no results
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase) // This will be called twice
      mockSupabase.single.mockResolvedValue({
        data: null, // No workflow found for this organization
        error: { code: 'PGRST116', message: 'No rows returned' }
      })

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'workflow1' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Workflow not found')
    })
  })

  describe('Successful Keyword Filtering', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user1', org_id: 'org1' })
      mockSupabase.single.mockResolvedValue({
        data: { id: 'workflow1', status: 'step_4_longtails', organization_id: 'org1' },
        error: null
      })
    })

    it('should successfully filter keywords and update workflow', async () => {
      const { filterKeywords, getOrganizationFilterSettings } = await import('@/lib/services/intent-engine/keyword-filter')
      const mockFilterKeywords = vi.mocked(filterKeywords)
      const mockGetOrganizationFilterSettings = vi.mocked(getOrganizationFilterSettings)

      mockGetOrganizationFilterSettings.mockResolvedValue({
        min_search_volume: 100,
        similarity_threshold: 0.85
      })

      mockFilterKeywords.mockResolvedValue({
        total_keywords: 100,
        filtered_keywords_count: 25,
        removal_breakdown: { duplicates: 15, low_volume: 10 },
        remaining_keywords: []
      })

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: null
      })

      // Ensure the eq method is properly chained after update
      mockSupabase.update.mockReturnValue(mockSupabase)

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'workflow1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('step_5_filtering')
      expect(data.data.filter_result.total_keywords).toBe(100)
      expect(data.data.filter_result.filtered_keywords_count).toBe(25)

      // Verify workflow was updated
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'step_5_filtering',
        step_5_filtering_completed_at: expect.any(String),
        filtered_keywords_count: 25
      })

      // Verify audit logging
      expect(mockLogActionAsync).toHaveBeenCalledTimes(2)
      expect(mockLogActionAsync).toHaveBeenLastCalledWith({
        orgId: 'org1',
        userId: 'user1',
        action: 'workflow.keyword_filtering.completed',
        details: expect.objectContaining({
          workflow_id: 'workflow1',
          total_keywords: 100,
          filtered_keywords_count: 25,
          removal_breakdown: expect.any(Object)
        }),
        ipAddress: undefined,
        userAgent: undefined
      })

      // Verify analytics event
      expect(mockEmitAnalyticsEvent).toHaveBeenCalledWith({
        event_type: 'workflow.keyword_filtering.completed',
        timestamp: expect.any(String),
        organization_id: 'org1',
        workflow_id: 'workflow1',
        total_keywords: 100,
        filtered_keywords_count: 25
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user1', org_id: 'org1' })
      mockSupabase.single.mockResolvedValue({
        data: { id: 'workflow1', status: 'step_4_longtails', organization_id: 'org1' },
        error: null
      })
    })

    it('should handle timeout error', async () => {
      const { filterKeywords, getOrganizationFilterSettings } = await import('@/lib/services/intent-engine/keyword-filter')
      const mockFilterKeywords = vi.mocked(filterKeywords)
      const mockGetOrganizationFilterSettings = vi.mocked(getOrganizationFilterSettings)

      mockGetOrganizationFilterSettings.mockResolvedValue({
        min_search_volume: 100,
        similarity_threshold: 0.85
      })

      // Mock timeout by making filterKeywords return a promise that rejects after 2 seconds
      mockFilterKeywords.mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Keyword filtering timeout')), 2000)
      }))

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'workflow1' }) })
      const data = await response.json()

      expect(response.status).toBe(408)
      expect(data.error).toBe('Keyword filtering timeout - operation took longer than 1 minute')
    })

    it('should handle database update error', async () => {
      const { filterKeywords, getOrganizationFilterSettings } = await import('@/lib/services/intent-engine/keyword-filter')
      const mockFilterKeywords = vi.mocked(filterKeywords)
      const mockGetOrganizationFilterSettings = vi.mocked(getOrganizationFilterSettings)

      mockGetOrganizationFilterSettings.mockResolvedValue({
        min_search_volume: 100,
        similarity_threshold: 0.85
      })

      mockFilterKeywords.mockResolvedValue({
        total_keywords: 50,
        filtered_keywords_count: 10,
        removal_breakdown: { duplicates: 5, low_volume: 5 },
        remaining_keywords: []
      })

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database update failed' }
      })

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'workflow1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error during keyword filtering')

      // Verify error was logged
      expect(mockLogActionAsync).toHaveBeenLastCalledWith({
        orgId: 'org1',
        userId: 'user1',
        action: 'workflow.keyword_filtering.failed',
        details: expect.objectContaining({
          workflow_id: 'workflow1',
          error: expect.any(String)
        }),
        ipAddress: undefined,
        userAgent: undefined
      })
    })

    it('should handle general errors', async () => {
      const { getOrganizationFilterSettings } = await import('@/lib/services/intent-engine/keyword-filter')
      const mockGetOrganizationFilterSettings = vi.mocked(getOrganizationFilterSettings)

      mockGetOrganizationFilterSettings.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, { params: Promise.resolve({ workflow_id: 'workflow1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error during keyword filtering')
    })
  })
})
