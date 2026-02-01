/**
 * Unit Tests: Long-Tail Keyword Expander Service
 * Story 35.2: Expand Keywords Using Multiple DataForSEO Methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { 
  expandSeedKeywordsToLongtails, 
  ExpansionSummary,
  LONGTAIL_RETRY_POLICY 
} from '@/lib/services/intent-engine/longtail-keyword-expander'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

// Mock analytics
vi.mock('@/lib/services/analytics/event-emitter', () => ({
  emitAnalyticsEvent: vi.fn()
}))

// Mock retry utils to control timing
vi.mock('@/lib/services/intent-engine/retry-utils', () => ({
  RetryPolicy: {},
  isRetryableError: vi.fn((error) => false),
  calculateBackoffDelay: vi.fn((attempt) => attempt * 1000),
  sleep: vi.fn((ms) => Promise.resolve()),
  classifyErrorType: vi.fn(() => 'unknown')
}))

describe('LongtailKeywordExpander', () => {
  const mockSupabase = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    limit: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
    
    // Setup chain mocks
    mockSupabase.from.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.is.mockReturnThis()
    mockSupabase.single.mockReturnThis()
    mockSupabase.insert.mockReturnThis()
    mockSupabase.update.mockReturnThis()
    mockSupabase.gte.mockReturnThis()
    mockSupabase.lt.mockReturnThis()
    mockSupabase.order.mockReturnThis()
    mockSupabase.limit.mockReturnThis()
  })

  describe('expandSeedKeywordsToLongtails', () => {
    const mockWorkflowId = 'workflow-123'
    const mockOrganizationId = 'org-123'
    const mockSeedKeyword = {
      id: 'seed-123',
      keyword: 'best seo tools',
      organization_id: mockOrganizationId,
      competitor_url_id: 'competitor-123',
      search_volume: 1000,
      competition_level: 'medium' as const,
      competition_index: 50,
      keyword_difficulty: 45,
      cpc: 2.50
    }

    it('should fail when database schema does not have parent_seed_keyword_id', async () => {
      // Mock workflow retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          id: mockWorkflowId,
          organization_id: mockOrganizationId,
          status: 'step_3_seeds'
        },
        error: null
      })

      // Mock seed keywords retrieval with schema error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'column "parent_seed_keyword_id" does not exist' }
      })

      const result = await expandSeedKeywordsToLongtails(mockWorkflowId)

      expect(result.seeds_processed).toBe(0)
      // Should throw an error due to schema issue
    })

    it('should retrieve seed keywords with longtail_status = not_started', async () => {
      // Mock workflow retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          id: mockWorkflowId,
          organization_id: mockOrganizationId,
          status: 'step_3_seeds'
        },
        error: null
      })

      // Mock organization settings
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          default_location_code: 2840,
          default_language_code: 'en'
        },
        error: null
      })

      // Mock seed keywords retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: [mockSeedKeyword],
        error: null
      })

      // Mock DataForSEO responses
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status_code: 200,
          tasks: [{
            result: [
              {
                keyword: 'best seo tools 2024',
                search_volume: 1200,
                competition: 'low',
                competition_index: 30,
                keyword_difficulty: 40,
                cpc: 2.5
              }
            ]
          }]
        })
      })
      Object.defineProperty(global, 'fetch', {
        value: mockFetch,
        writable: true
      })

      const result = await expandSeedKeywordsToLongtails(mockWorkflowId)

      expect(mockSupabase.from).toHaveBeenCalledWith('keywords')
      expect(mockSupabase.is).toHaveBeenCalledWith('parent_seed_keyword_id', null)
      expect(mockSupabase.eq).toHaveBeenCalledWith('longtail_status', 'not_started')
    })

    it('should handle case when no seed keywords need expansion', async () => {
      // Mock workflow retrieval
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          id: mockWorkflowId,
          organization_id: mockOrganizationId,
          status: 'step_3_seeds'
        },
        error: null
      })

      // Mock organization settings
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          default_location_code: 2840,
          default_language_code: 'en'
        },
        error: null
      })

      // Mock empty seed keywords
      mockSupabase.single.mockResolvedValueOnce({
        data: [],
        error: null
      })

      await expect(expandSeedKeywordsToLongtails(mockWorkflowId)).rejects.toThrow('No seed keywords found')
    })

    it('should validate workflow status before processing', async () => {
      // Mock workflow with wrong status
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          id: mockWorkflowId,
          organization_id: mockOrganizationId,
          status: 'step_2_icp' // Wrong status
        },
        error: null
      })

      await expect(expandSeedKeywordsToLongtails(mockWorkflowId)).rejects.toThrow('Workflow not found')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' }
      })

      await expect(expandSeedKeywordsToLongtails(mockWorkflowId)).rejects.toThrow('Workflow not found')
    })
  })

  describe('LONGTAIL_RETRY_POLICY', () => {
    it('should have correct retry configuration', () => {
      expect(LONGTAIL_RETRY_POLICY.maxAttempts).toBe(3)
      expect(LONGTAIL_RETRY_POLICY.initialDelayMs).toBe(2000)
      expect(LONGTAIL_RETRY_POLICY.backoffMultiplier).toBe(2)
      expect(LONGTAIL_RETRY_POLICY.maxDelayMs).toBe(8000)
    })
  })
})
