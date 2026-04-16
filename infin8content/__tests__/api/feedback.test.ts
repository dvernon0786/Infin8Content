// Epic 12: Story 12-9 — API tests for /api/feedback

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}))

const { getCurrentUser } = await import('@/lib/supabase/get-current-user')
const { createServiceRoleClient } = await import('@/lib/supabase/server')
const { POST } = await import('@/app/api/feedback/route')

const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  org_id: 'org-1',
  role: 'user',
}

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function buildInsertMock(error: any = null) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error }),
    })),
  }
}

describe('/api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null as any)
    const res = await POST(makeReq({ feedback_type: 'nps', nps_score: 8 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    const res = await POST(makeReq('not-json'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid feedback_type', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    const res = await POST(makeReq({ feedback_type: 'unknown' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for NPS with missing nps_score', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    const res = await POST(makeReq({ feedback_type: 'nps' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for NPS score out of range', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    const res = await POST(makeReq({ feedback_type: 'nps', nps_score: 11 }))
    expect(res.status).toBe(400)
  })

  it('saves NPS feedback and returns ok', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    vi.mocked(createServiceRoleClient).mockReturnValue(buildInsertMock() as any)

    const res = await POST(makeReq({ feedback_type: 'nps', nps_score: 9, body: 'Love it' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('saves general feedback without nps_score', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    vi.mocked(createServiceRoleClient).mockReturnValue(buildInsertMock() as any)

    const res = await POST(makeReq({ feedback_type: 'general', body: 'Needs dark mode' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('returns 500 when DB insert fails', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as any)
    vi.mocked(createServiceRoleClient).mockReturnValue(
      buildInsertMock({ message: 'DB error' }) as any
    )

    const res = await POST(makeReq({ feedback_type: 'general', body: 'Test' }))
    expect(res.status).toBe(500)
  })
})
