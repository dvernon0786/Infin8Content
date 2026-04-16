// Epic 12: Story 12-6 — Unit tests for user-success-tracker service

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}))

const { createServiceRoleClient } = await import('@/lib/supabase/server')
const { recordSuccessEvent, getCompletedSuccessEvents, SUCCESS_EVENTS } =
  await import('@/lib/services/onboarding/user-success-tracker')

describe('user-success-tracker', () => {
  let mockSupabase: ReturnType<typeof buildMockSupabase>

  function buildMockSupabase(overrides?: Partial<ReturnType<typeof buildChain>>) {
    const chain = buildChain(overrides)
    return { from: vi.fn(() => chain) }
  }

  function buildChain(overrides?: any) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      ...overrides,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = buildMockSupabase()
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
  })

  describe('recordSuccessEvent', () => {
    it('inserts a new success event when not previously recorded', async () => {
      const chain = buildChain()
      chain.maybeSingle.mockResolvedValue({ data: null })
      mockSupabase.from.mockReturnValue(chain)
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      await recordSuccessEvent('org-1', 'user-1', SUCCESS_EVENTS.FIRST_WORKFLOW_CREATED)

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-1',
          user_id: 'user-1',
          activity_type: 'onboarding_success',
          activity_data: { event: SUCCESS_EVENTS.FIRST_WORKFLOW_CREATED },
        })
      )
    })

    it('skips insert when event already recorded (idempotent)', async () => {
      const chain = buildChain()
      chain.maybeSingle.mockResolvedValue({ data: { id: 'existing-id' } })
      mockSupabase.from.mockReturnValue(chain)
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      await recordSuccessEvent('org-1', 'user-1', SUCCESS_EVENTS.FIRST_WORKFLOW_CREATED)

      expect(chain.insert).not.toHaveBeenCalled()
    })
  })

  describe('getCompletedSuccessEvents', () => {
    it('returns a Set of completed event types', async () => {
      const chain = buildChain()
      chain.eq.mockReturnThis()
      // Last call is awaited directly (no maybeSingle)
      vi.mocked(createServiceRoleClient).mockImplementation(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: any) =>
            resolve({
              data: [
                { activity_data: { event: SUCCESS_EVENTS.FIRST_WORKFLOW_CREATED } },
                { activity_data: { event: SUCCESS_EVENTS.CMS_CONNECTED } },
              ],
            }),
        })),
      }) as any)

      const result = await getCompletedSuccessEvents('org-1')

      expect(result).toBeInstanceOf(Set)
      expect(result.has(SUCCESS_EVENTS.FIRST_WORKFLOW_CREATED)).toBe(true)
      expect(result.has(SUCCESS_EVENTS.CMS_CONNECTED)).toBe(true)
      expect(result.has(SUCCESS_EVENTS.FIRST_ARTICLE_PUBLISHED)).toBe(false)
    })

    it('returns an empty Set when no events exist', async () => {
      vi.mocked(createServiceRoleClient).mockImplementation(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data: null }),
        })),
      }) as any)

      const result = await getCompletedSuccessEvents('org-1')

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(0)
    })
  })
})
