import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * Keyword Research API Integration Tests
 * 
 * Integration tests for keyword research API route
 * Story 3.1: Keyword Research Interface and DataForSEO Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/research/keywords/route'
import { searchKeywords } from '@/lib/services/dataforseo'

// Mock DataForSEO service
vi.mock('@/lib/services/dataforseo', () => ({
  searchKeywords: vi.fn(),
}))

// Mock Supabase clients
const mockGetCurrentUser = vi.fn()
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

const mockSupabaseAdmin = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabaseClient,
  createServiceRoleClient: () => mockSupabaseAdmin,
}))

vi.mock('@/lib/supabase/env', () => ({
  validateSupabaseEnv: vi.fn(),
}))

describe('Keyword Research API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/research/keywords', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'test keyword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 if keyword is empty', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-id',
        org_id: 'org-id',
        organizations: { plan: 'starter' },
      })

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('must not be empty')
    })

    it('should return 400 if keyword is too long', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-id',
        org_id: 'org-id',
        organizations: { plan: 'starter' },
      })

      const longKeyword = 'a'.repeat(201)

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: longKeyword }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 200 characters')
    })

    it('should return 403 if usage limit exceeded', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-id',
        org_id: 'org-id',
        organizations: { plan: 'starter' },
      })

      // Mock usage tracking - limit exceeded
      const mockUsageChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { usage_count: 50 },
          error: null,
        }),
      }
      mockUsageChain.eq.mockReturnValue(mockUsageChain)
      mockUsageChain.eq.mockReturnValue(mockUsageChain)
      mockUsageChain.eq.mockReturnValue(mockUsageChain)

      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockUsageChain),
      })

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'test keyword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('reached your keyword research limit')
      expect(data.details?.usageLimitExceeded).toBe(true)
    })

    it('should return cached results if available', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-id',
        org_id: 'org-id',
        organizations: { plan: 'starter' },
      })

      const cachedUntil = new Date()
      cachedUntil.setDate(cachedUntil.getDate() + 7)

      // Mock usage tracking - within limit
      const mockUsageChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { usage_count: 10 },
          error: { code: 'PGRST116' }, // No rows
        }),
      }
      mockUsageChain.eq.mockReturnValue(mockUsageChain)
      mockUsageChain.eq.mockReturnValue(mockUsageChain)
      mockUsageChain.eq.mockReturnValue(mockUsageChain)

      // Mock cache lookup - cache hit
      const mockCacheChain = {
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'cache-id',
            results: {
              tasks: [{
                status_code: 20000,
                result: [{
                  keyword: 'test keyword',
                  search_volume: 1000,
                  competition_index: 50,
                  cpc: 1.0,
                  monthly_searches: [
                    { year: 2024, month: 1, search_volume: 1000 },
                  ],
                  keyword_info: {
                    competition: 'MEDIUM',
                  },
                }],
              }],
            },
            api_cost: 0.001,
            cached_until: cachedUntil.toISOString(),
          },
          error: null,
        }),
      }
      mockCacheChain.eq.mockReturnValue(mockCacheChain)
      mockCacheChain.eq.mockReturnValue(mockCacheChain)
      mockCacheChain.gt.mockReturnValue(mockCacheChain)
      mockCacheChain.order.mockReturnValue(mockCacheChain)
      mockCacheChain.limit.mockReturnValue(mockCacheChain)

      const mockCacheUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockCacheUpdate.update.mockReturnValue(mockCacheUpdate)

      mockSupabaseAdmin.from.mockReturnValue({
        select: () => mockUsageChain,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: () => mockCacheChain,
        update: () => mockCacheUpdate,
      })

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'test keyword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data?.cached).toBe(true)
      expect(data.data?.results).toHaveLength(1)
      expect(data.data?.results[0].keyword).toBe('test keyword')
    })

    it('should call DataForSEO API and store results on cache miss', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-id',
        org_id: 'org-id',
        organizations: { plan: 'starter' },
      })

      // Mock usage tracking - within limit
      const mockUsageChain2 = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { usage_count: 10 },
          error: { code: 'PGRST116' }, // No rows
        }),
      }
      mockUsageChain2.eq.mockReturnValue(mockUsageChain2)
      mockUsageChain2.eq.mockReturnValue(mockUsageChain2)
      mockUsageChain2.eq.mockReturnValue(mockUsageChain2)

      // Mock cache lookup - cache miss
      const mockCacheChain2 = {
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows
        }),
      }
      mockCacheChain2.eq.mockReturnValue(mockCacheChain2)
      mockCacheChain2.eq.mockReturnValue(mockCacheChain2)
      mockCacheChain2.gt.mockReturnValue(mockCacheChain2)
      mockCacheChain2.order.mockReturnValue(mockCacheChain2)
      mockCacheChain2.limit.mockReturnValue(mockCacheChain2)

      const mockCacheInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      const mockUsageUpsert = {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }

      const mockCostInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'usage_tracking') {
          return {
            select: () => mockUsageChain2,
            upsert: () => mockUsageUpsert,
          }
        }
        if (table === 'api_costs') {
          return {
            insert: () => mockCostInsert,
          }
        }
        return {}
      })

      mockSupabaseClient.from.mockReturnValue({
        select: () => mockCacheChain2,
        insert: () => mockCacheInsert,
      })

      // Mock DataForSEO API response
      const mockSearchKeywords = vi.mocked(searchKeywords)
      mockSearchKeywords.mockResolvedValue({
        success: true,
        data: {
          keyword: 'test keyword',
          searchVolume: 1000,
          keywordDifficulty: 50,
          trend: [1000, 1100, 1200],
          cpc: 1.0,
          competition: 'Medium',
        },
        cost: 0.001,
      })

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'test keyword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data?.cached).toBe(false)
      expect(data.data?.results).toHaveLength(1)
      expect(mockSearchKeywords).toHaveBeenCalledWith({
        keywords: ['test keyword'],
        locationCode: 2840,
        languageCode: 'en',
      })
    })

    it('should handle DataForSEO API errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-id',
        org_id: 'org-id',
        organizations: { plan: 'starter' },
      })

      // Mock usage tracking - within limit
      const mockUsageChain3 = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { usage_count: 10 },
          error: { code: 'PGRST116' },
        }),
      }
      mockUsageChain3.eq.mockReturnValue(mockUsageChain3)
      mockUsageChain3.eq.mockReturnValue(mockUsageChain3)
      mockUsageChain3.eq.mockReturnValue(mockUsageChain3)

      // Mock cache lookup - cache miss
      const mockCacheChain3 = {
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockCacheChain3.eq.mockReturnValue(mockCacheChain3)
      mockCacheChain3.eq.mockReturnValue(mockCacheChain3)
      mockCacheChain3.gt.mockReturnValue(mockCacheChain3)
      mockCacheChain3.order.mockReturnValue(mockCacheChain3)
      mockCacheChain3.limit.mockReturnValue(mockCacheChain3)

      mockSupabaseAdmin.from.mockReturnValue({
        select: () => mockUsageChain3,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: () => mockCacheChain3,
      })

      // Mock DataForSEO API error
      const mockSearchKeywords = vi.mocked(searchKeywords)
      mockSearchKeywords.mockRejectedValue(new Error('API error'))

      const request = mockNextRequest({url: ''http://localhost/api/research/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword: 'test keyword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Keyword research failed')
    })
  })
})

