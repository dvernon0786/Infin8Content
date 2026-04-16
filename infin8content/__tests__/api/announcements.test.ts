// Epic 12: Story 12-8 — API tests for /api/announcements

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}))

const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
const { createServiceRoleClient } = await import('@/lib/supabase/server')
const { GET } = await import('@/app/api/announcements/route')

const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  org_id: 'org-1',
  role: 'user',
}

function buildSupabaseMock(announcements: any[], error: any = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: announcements, error }),
    })),
  }
}

describe('/api/announcements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null as any)

      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('returns empty array when no active announcements', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
      vi.mocked(createServiceRoleClient).mockReturnValue(buildSupabaseMock([]) as any)

      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.announcements).toEqual([])
    })

    it('returns unread announcements, filters read ones', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
      const mockData = [
        {
          id: 'ann-1',
          slug: 'new-feature',
          title: 'New Feature',
          body: 'Check it out',
          cta_url: null,
          cta_label: null,
          target_plans: null,
          active_from: '2025-01-01',
          active_until: null,
          announcement_reads: [], // Not yet read
        },
        {
          id: 'ann-2',
          slug: 'old-news',
          title: 'Old News',
          body: 'Already seen',
          cta_url: null,
          cta_label: null,
          target_plans: null,
          active_from: '2025-01-01',
          active_until: null,
          announcement_reads: [{ user_id: 'user-1' }], // Already read by this user
        },
      ]
      vi.mocked(createServiceRoleClient).mockReturnValue(buildSupabaseMock(mockData) as any)

      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.announcements).toHaveLength(1)
      expect(body.announcements[0].id).toBe('ann-1')
      // announcement_reads should be stripped
      expect(body.announcements[0].announcement_reads).toBeUndefined()
    })

    it('returns 500 when DB query fails', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
      vi.mocked(createServiceRoleClient).mockReturnValue(
        buildSupabaseMock([], { message: 'DB error' }) as any
      )

      const res = await GET()
      expect(res.status).toBe(500)
    })
  })
})
