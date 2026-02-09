import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * Article Progress API Endpoint Tests
 * Story B-5: Article Status Tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../../app/api/articles/[article_id]/progress/route'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('@/lib/services/article-generation/progress-calculator', () => ({
  calculateArticleProgress: vi.fn()
}))

vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: vi.fn().mockResolvedValue(undefined),
  extractIpAddress: vi.fn().mockReturnValue('127.0.0.1'),
  extractUserAgent: vi.fn().mockReturnValue('test-agent')
}))

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { calculateArticleProgress } from '@/lib/services/article-generation/progress-calculator'

describe('GET /api/articles/[article_id]/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis()
  }

  const mockUser = {
    id: 'user-123',
    org_id: 'org-123',
    organizations: { plan: 'pro' }
  }

  const mockArticleData = {
    id: 'article-123',
    status: 'generating',
    generation_started_at: '2024-01-01T00:00:00Z',
    organization_id: 'org-123',
    article_sections: [
      {
        id: 'section-1',
        section_order: 1,
        section_header: 'Introduction',
        status: 'completed',
        updated_at: '2024-01-01T00:01:00Z'
      },
      {
        id: 'section-2',
        section_order: 2,
        section_header: 'Body',
        status: 'researching',
        updated_at: '2024-01-01T00:02:00Z'
      }
    ]
  }

  const mockProgressData = {
    articleId: 'article-123',
    status: 'generating' as const,
    progress: {
      completedSections: 1,
      totalSections: 2,
      percentage: 50,
      currentSection: {
        id: 'section-2',
        section_order: 2,
        section_header: 'Body',
        status: 'researching'
      }
    },
    timing: {
      startedAt: '2024-01-01T00:00:00Z',
      estimatedCompletionAt: '2024-01-01T00:05:00Z',
      averageSectionDurationSeconds: 150
    }
  }

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 401 for user without organization', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-123', org_id: null })

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 400 for invalid article ID', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/short/progress')
    const params = { article_id: 'short' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid article ID')
  })

  it('returns 404 for non-existent articles', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.from).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.select).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.eq).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.single).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    })

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Article not found')
  })

  it('returns 403 for cross-organization access', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.from).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.select).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.eq).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.single).mockResolvedValue({
      data: { ...mockArticleData, organization_id: 'different-org' },
      error: null
    })

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Access denied')
  })

  it('returns 200 with correct progress data', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.from).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.select).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.eq).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.single).mockResolvedValue({
      data: mockArticleData,
      error: null
    })
    vi.mocked(calculateArticleProgress).mockReturnValue(mockProgressData)

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockProgressData)
    expect(calculateArticleProgress).toHaveBeenCalledWith({
      article: {
        id: 'article-123',
        status: 'generating',
        generation_started_at: '2024-01-01T00:00:00Z',
        organization_id: 'org-123'
      },
      sections: mockArticleData.article_sections
    })
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.from).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.select).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.eq).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.single).mockResolvedValue({
      data: null,
      error: { code: 'UNKNOWN_ERROR', message: 'Database connection failed' }
    })

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database error')
  })

  it('includes error details for failed articles', async () => {
    const failedProgressData = {
      ...mockProgressData,
      status: 'failed' as const,
      error: {
        message: 'Article generation failed',
        failedSectionOrder: 2,
        failedAt: '2024-01-01T00:02:00Z'
      }
    }

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.from).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.select).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.eq).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.single).mockResolvedValue({
      data: { ...mockArticleData, status: 'failed' },
      error: null
    })
    vi.mocked(calculateArticleProgress).mockReturnValue(failedProgressData)

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = Promise.resolve({ article_id: 'article-123' })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('failed')
    expect(data.data.error).toBeDefined()
    expect(data.data.error?.failedSectionOrder).toBe(2)
  })

  it('performance under many sections (< 200ms)', async () => {
    // Create article with many sections to test performance
    const manySections = Array.from({ length: 50 }, (_, i) => ({
      id: `section-${i + 1}`,
      section_order: i + 1,
      section_header: `Section ${i + 1}`,
      status: i < 25 ? 'completed' : 'pending',
      updated_at: '2024-01-01T00:01:00Z'
    }))

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.from).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.select).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.eq).mockReturnValue(mockSupabaseClient)
    vi.mocked(mockSupabaseClient.single).mockResolvedValue({
      data: { ...mockArticleData, article_sections: manySections },
      error: null
    })
    vi.mocked(calculateArticleProgress).mockReturnValue({
      ...mockProgressData,
      progress: {
        completedSections: 25,
        totalSections: 50,
        percentage: 50,
        currentSection: {
          id: 'section-26',
          section_order: 26,
          section_header: 'Section 26',
          status: 'pending'
        }
      }
    })

    const request = mockNextRequest({url: 'http://localhost:3000/api/articles/article-123/progress')
    const params = { article_id: 'article-123' }

    const startTime = performance.now()
    const response = await GET(request, { params })
    const endTime = performance.now()
    const duration = endTime - startTime

    expect(response.status).toBe(200)
    expect(duration).toBeLessThan(200) // Should complete in under 200ms
  })
})
