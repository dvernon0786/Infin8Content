// Epic 12: Story 12-6 — API tests for /api/onboarding/success-events

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/services/onboarding/user-success-tracker', () => ({
  getCompletedSuccessEvents: vi.fn(),
  recordSuccessEvent: vi.fn(),
  SUCCESS_EVENTS: {
    FIRST_WORKFLOW_CREATED: 'FIRST_WORKFLOW_CREATED',
    FIRST_ARTICLE_GENERATED: 'FIRST_ARTICLE_GENERATED',
    FIRST_ARTICLE_PUBLISHED: 'FIRST_ARTICLE_PUBLISHED',
    CMS_CONNECTED: 'CMS_CONNECTED',
    KEYWORD_RESEARCH_DONE: 'KEYWORD_RESEARCH_DONE',
  },
}))

const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
const { getCompletedSuccessEvents, recordSuccessEvent } = await import(
  '@/lib/services/onboarding/user-success-tracker'
)
const { GET, POST } = await import('@/app/api/onboarding/success-events/route')

const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  org_id: 'org-1',
  role: 'user',
}

describe('/api/onboarding/success-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null as any)

      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('returns completed events for authenticated user', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
      vi.mocked(getCompletedSuccessEvents).mockResolvedValue(
        new Set(['FIRST_WORKFLOW_CREATED', 'CMS_CONNECTED']) as any
      )

      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.events).toContain('FIRST_WORKFLOW_CREATED')
      expect(body.events).toContain('CMS_CONNECTED')
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null as any)

      const req = new NextRequest('http://localhost/api/onboarding/success-events', {
        method: 'POST',
        body: JSON.stringify({ event: 'FIRST_WORKFLOW_CREATED' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid event type', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)

      const req = new NextRequest('http://localhost/api/onboarding/success-events', {
        method: 'POST',
        body: JSON.stringify({ event: 'INVALID_EVENT' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('records valid event and returns ok', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
      vi.mocked(recordSuccessEvent).mockResolvedValue(undefined)

      const req = new NextRequest('http://localhost/api/onboarding/success-events', {
        method: 'POST',
        body: JSON.stringify({ event: 'FIRST_WORKFLOW_CREATED' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
      expect(recordSuccessEvent).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        'FIRST_WORKFLOW_CREATED'
      )
    })

    it('returns 400 for invalid JSON body', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)

      const req = new NextRequest('http://localhost/api/onboarding/success-events', {
        method: 'POST',
        body: 'not-json',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
