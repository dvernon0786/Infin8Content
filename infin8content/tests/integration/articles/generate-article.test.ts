import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * Article Generation API Integration Tests
 * Story 4a-1: Article Generation Initiation and Queue Setup
 * 
 * Tests the article generation API endpoint:
 * - Request validation
 * - Usage credit checking
 * - Article record creation
 * - Inngest event queuing
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/articles/generate/route'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { inngest } from '@/lib/inngest/client'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/inngest/client')
vi.mock('@/lib/supabase/env', () => ({
  validateSupabaseEnv: vi.fn(),
}))

describe('Article Generation API', () => {
  const mockUserId = 'user-123'
  const mockOrgId = 'org-123'
  const mockPlan = 'starter'
  const mockCurrentMonth = '2026-01'

  const mockUser = {
    id: mockUserId,
    org_id: mockOrgId,
    organizations: {
      plan: mockPlan,
    },
  }

  const mockArticle = {
    id: 'article-123',
  }

  let mockSupabase: any
  let mockSupabaseAdmin: any
  let mockInngest: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))

    // Mock Supabase clients
    mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    }

    mockSupabaseAdmin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { usage_count: 5 }, 
          error: null 
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      })),
    }

    mockInngest = {
      send: vi.fn().mockResolvedValue({ ids: ['event-123'] }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabaseAdmin)
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(inngest).send = mockInngest.send
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should validate request body', async () => {
    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: '', // Invalid: empty keyword
        targetWordCount: 2000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Keyword must not be empty')
  })

  it('should check usage limits before creating article', async () => {
    // Mock usage at limit
    mockSupabaseAdmin.from().single.mockResolvedValue({
      data: { usage_count: 10 }, // At limit for starter plan
      error: null,
    })

    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: 'test keyword',
        targetWordCount: 2000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('reached your article limit')
    expect(data.details.usageLimitExceeded).toBe(true)
    expect(data.details.currentUsage).toBe(10)
    expect(data.details.limit).toBe(10)
  })

  it('should create article record and queue Inngest event', async () => {
    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: 'test keyword',
        targetWordCount: 2000,
        writingStyle: 'Professional',
        targetAudience: 'General',
        customInstructions: 'Test instructions',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.articleId).toBe(mockArticle.id)
    expect(data.status).toBe('queued')
    expect(mockSupabase.from).toHaveBeenCalledWith('articles')
    expect(mockInngest.send).toHaveBeenCalledWith({
      name: 'article/generate',
      data: {
        articleId: mockArticle.id,
      },
    })
  })

  it('should handle Inngest event failure', async () => {
    mockInngest.send.mockRejectedValueOnce(new Error('Inngest error'))

    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: 'test keyword',
        targetWordCount: 2000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to queue article generation')
    // Verify article status was updated to failed
    expect(mockSupabase.from().update).toHaveBeenCalled()
  })

  it('should handle first usage in billing period (PGRST116 error)', async () => {
    // Mock PGRST116 error (no rows returned)
    mockSupabaseAdmin.from().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })

    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: 'test keyword',
        targetWordCount: 2000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should proceed with usage count 0
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should increment usage tracking after successful queue', async () => {
    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: 'test keyword',
        targetWordCount: 2000,
      }),
    })

    await POST(request)

    // Verify usage tracking was incremented
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('usage_tracking')
    expect(mockSupabaseAdmin.from().upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: mockOrgId,
        metric_type: 'article_generation',
        billing_period: mockCurrentMonth,
        usage_count: 6, // 5 + 1
      }),
      expect.objectContaining({
        onConflict: 'organization_id,metric_type,billing_period',
      })
    )
  })

  it('should handle unlimited plan (agency)', async () => {
    const agencyUser = {
      ...mockUser,
      organizations: { plan: 'agency' },
    }
    vi.mocked(getCurrentUser).mockResolvedValue(agencyUser as any)

    const request = mockNextRequest({url: ''http://localhost/api/articles/generate', {
      method: 'POST',
      body: JSON.stringify({
        keyword: 'test keyword',
        targetWordCount: 2000,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

