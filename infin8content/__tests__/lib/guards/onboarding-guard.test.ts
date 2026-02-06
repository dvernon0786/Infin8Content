import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { checkOnboardingStatus } from '@/lib/guards/onboarding-guard'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

describe('checkOnboardingStatus', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
  })

  describe('when organization has completed onboarding', () => {
    it('should return true', async () => {
      const orgId = 'org-123'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: true },
              error: null
            })
          })
        })
      })

      const result = await checkOnboardingStatus(orgId)

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.from.mock.results[0].value.select).toHaveBeenCalledWith('onboarding_completed')
      expect(mockSupabase.from.mock.results[0].value.select.mock.results[0].value.eq).toHaveBeenCalledWith('id', orgId)
    })
  })

  describe('when organization has not completed onboarding', () => {
    it('should return false', async () => {
      const orgId = 'org-123'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: false },
              error: null
            })
          })
        })
      })

      const result = await checkOnboardingStatus(orgId)

      expect(result).toBe(false)
    })
  })

  describe('when onboarding_completed is null', () => {
    it('should return false', async () => {
      const orgId = 'org-123'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { onboarding_completed: null },
              error: null
            })
          })
        })
      })

      const result = await checkOnboardingStatus(orgId)

      expect(result).toBe(false)
    })
  })

  describe('when organization is not found', () => {
    it('should return false', async () => {
      const orgId = 'org-123'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' }
            })
          })
        })
      })

      const result = await checkOnboardingStatus(orgId)

      expect(result).toBe(false)
    })
  })

  describe('when database error occurs', () => {
    it('should return false (fail safe)', async () => {
      const orgId = 'org-123'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      const result = await checkOnboardingStatus(orgId)

      expect(result).toBe(false)
    })
  })

  describe('when database throws exception', () => {
    it('should return false (fail safe)', async () => {
      const orgId = 'org-123'
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database timeout'))
          })
        })
      })

      const result = await checkOnboardingStatus(orgId)

      expect(result).toBe(false)
    })
  })
})
