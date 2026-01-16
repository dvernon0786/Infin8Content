/**
 * Tests for UX Metrics Rollup Computation Functions
 * Story 32.1: User Experience Metrics Tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  computeArticleCreationCompletionRate,
  computeCollaborationAdoptionRate,
  computeAverageRating,
  computeUXMetricsRollup,
} from '@/lib/services/ux-metrics-rollup'

// Mock Supabase client
const mockClient = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => mockClient),
}))

describe('UX Metrics Rollup Computation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('computeArticleCreationCompletionRate', () => {
    it('should compute completion rate with all completed within 24h', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      // Mock STARTED events
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({
                  data: [
                    { flow_instance_id: 'flow-1', created_at: '2025-01-05T10:00:00Z' },
                    { flow_instance_id: 'flow-2', created_at: '2025-01-06T12:00:00Z' },
                    { flow_instance_id: 'flow-3', created_at: '2025-01-07T14:00:00Z' },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      // Mock COMPLETED events
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              data: [
                { flow_instance_id: 'flow-1', created_at: '2025-01-05T18:00:00Z' }, // 8h
                { flow_instance_id: 'flow-2', created_at: '2025-01-07T10:00:00Z' }, // 22h
                { flow_instance_id: 'flow-3', created_at: '2025-01-08T10:00:00Z' }, // 44h
              ],
              error: null,
            }),
          }),
        }),
      })

      const result = await computeArticleCreationCompletionRate(orgId, weekStart)

      expect(result).toBe(2 / 3) // 2 out of 3 completed within 24h
    })

    it('should return null when no STARTED events exist', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await computeArticleCreationCompletionRate(orgId, weekStart)

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
              }),
            }),
          }),
        }),
      })

      const result = await computeArticleCreationCompletionRate(orgId, weekStart)

      expect(result).toBeNull()
    })
  })

  describe('computeCollaborationAdoptionRate', () => {
    it('should return 1 when org has collaboration events and is active', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      // Mock collaboration events (adopted)
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ event_name: 'collaboration_interaction.INVITE_ACCEPTED' }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      // Mock article events (active)
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ event_name: 'article_create_flow.STARTED' }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await computeCollaborationAdoptionRate(orgId, weekStart)

      expect(result).toBe(1)
    })

    it('should return 0 when org is active but has no collaboration events', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      // No collaboration events
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      // Active org (has article events)
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ event_name: 'article_create_flow.STARTED' }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await computeCollaborationAdoptionRate(orgId, weekStart)

      expect(result).toBe(0)
    })

    it('should return null when org is not active', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      // No collaboration events
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      // No article events (not active)
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      })

      const result = await computeCollaborationAdoptionRate(orgId, weekStart)

      expect(result).toBeNull()
    })
  })

  describe('computeAverageRating', () => {
    it('should compute average rating from valid scores', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({
                  data: [
                    { payload: { score: 5 } },
                    { payload: { score: 4 } },
                    { payload: { score: 3 } },
                    { payload: { score: 5 } },
                    { payload: { score: 4 } },
                    { payload: { invalid: 'data' } }, // Should be filtered out
                    { payload: { score: 6 } }, // Should be filtered out (out of range)
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const result = await computeAverageRating(orgId, weekStart, 'rating.TRUST_AI')

      expect(result).toBe(4.2) // (5+4+3+5+4) / 5
    })

    it('should return null when no rating events exist', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await computeAverageRating(orgId, weekStart, 'rating.TRUST_AI')

      expect(result).toBeNull()
    })

    it('should return null when no valid scores exist', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({
                  data: [
                    { payload: { invalid: 'data' } },
                    { payload: { score: 0 } }, // Out of range
                    { payload: { score: 6 } }, // Out of range
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const result = await computeAverageRating(orgId, weekStart, 'rating.TRUST_AI')

      expect(result).toBeNull()
    })
  })

  describe('computeUXMetricsRollup', () => {
    it('should compute all metrics', async () => {
      const weekStart = '2025-01-05'
      const orgId = 'org-123'

      // Mock all the individual computation functions
      vi.mocked(computeArticleCreationCompletionRate).mockResolvedValue(0.85)
      vi.mocked(computeCollaborationAdoptionRate).mockResolvedValue(1)
      vi.mocked(computeAverageRating)
        .mockResolvedValueOnce(4.2) // TRUST_AI
        .mockResolvedValueOnce(4.5) // COLLAB_VALUE

      const result = await computeUXMetricsRollup(orgId, weekStart)

      expect(result).toEqual({
        article_creation_completion_rate: 0.85,
        review_flow_median_duration_minutes: null, // Not implemented
        collaboration_adoption_rate: 1,
        avg_trust_score: 4.2,
        avg_collaboration_value_score: 4.5,
      })

      expect(vi.mocked(computeArticleCreationCompletionRate)).toHaveBeenCalledWith(orgId, weekStart)
      expect(vi.mocked(computeCollaborationAdoptionRate)).toHaveBeenCalledWith(orgId, weekStart)
      expect(vi.mocked(computeAverageRating)).toHaveBeenCalledWith(orgId, weekStart, 'rating.TRUST_AI')
      expect(vi.mocked(computeAverageRating)).toHaveBeenCalledWith(orgId, weekStart, 'rating.COLLAB_VALUE')
    })
  })
})
