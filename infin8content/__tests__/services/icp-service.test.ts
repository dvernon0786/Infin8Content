import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getICPSettings, upsertICPSettings, validateICPAccess } from '@/lib/services/icp/icp-service'
import { createClient } from '@/lib/supabase/server'
import type { ICPSettings, CreateICPSettingsRequest } from '@/types/icp'

// Mock dependencies
vi.mock('@/lib/supabase/server')

const mockCreateClient = createClient as any

describe('ICP Service', () => {
  const mockOrganizationId = 'org-123'
  const mockUserId = 'user-123'
  
  const mockICPSettings: ICPSettings = {
    id: 'icp-123',
    organization_id: mockOrganizationId,
    target_industries: ['Software Development', 'Healthcare'],
    buyer_roles: ['CTO', 'Marketing Manager'],
    pain_points: ['High operational costs', 'Slow decision making'],
    value_proposition: 'Our solution reduces costs by 40% and improves efficiency.',
    created_at: '2024-01-01T00:00:00Z',
    created_by: mockUserId,
    updated_at: '2024-01-01T00:00:00Z',
    encrypted_data: {}
  }

  const mockCreateICPRequest: CreateICPSettingsRequest = {
    target_industries: ['Software Development', 'Healthcare'],
    buyer_roles: ['CTO', 'Marketing Manager'],
    pain_points: ['High operational costs', 'Slow decision making'],
    value_proposition: 'Our solution reduces costs by 40% and improves efficiency.'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getICPSettings', () => {
    it('should return ICP settings when found', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockICPSettings,
          error: null
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await getICPSettings(mockOrganizationId)

      expect(result).toEqual(mockICPSettings)
      expect(mockQueryBuilder.from).toHaveBeenCalledWith('icp_settings')
      expect(mockQueryBuilder.select).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', mockOrganizationId)
    })

    it('should return null when ICP settings not found', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await getICPSettings(mockOrganizationId)

      expect(result).toBeNull()
    })

    it('should throw error for database errors', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      await expect(getICPSettings(mockOrganizationId)).rejects.toThrow(
        'Failed to fetch ICP settings: Database connection failed'
      )
    })
  })

  describe('upsertICPSettings', () => {
    it('should create new ICP settings', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockICPSettings,
          error: null
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await upsertICPSettings(mockOrganizationId, mockUserId, mockCreateICPRequest)

      expect(result).toEqual(mockICPSettings)
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrganizationId,
          created_by: mockUserId,
          target_industries: mockCreateICPRequest.target_industries,
          buyer_roles: mockCreateICPRequest.buyer_roles,
          pain_points: mockCreateICPRequest.pain_points,
          value_proposition: mockCreateICPRequest.value_proposition
        }),
        expect.objectContaining({
          onConflict: 'organization_id',
          ignoreDuplicates: false
        })
      )
    })

    it('should throw error when upsert fails', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upsert failed' }
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      await expect(
        upsertICPSettings(mockOrganizationId, mockUserId, mockCreateICPRequest)
      ).rejects.toThrow('Failed to upsert ICP settings: Upsert failed')
    })
  })

  describe('validateICPAccess', () => {
    it('should return true for admin users', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { org_id: mockOrganizationId, role: 'admin' },
          error: null
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await validateICPAccess(mockUserId, mockOrganizationId)

      expect(result).toBe(true)
    })

    it('should return true for owner users', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { org_id: mockOrganizationId, role: 'owner' },
          error: null
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await validateICPAccess(mockUserId, mockOrganizationId)

      expect(result).toBe(true)
    })

    it('should return false for member users', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { org_id: mockOrganizationId, role: 'member' },
          error: null
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await validateICPAccess(mockUserId, mockOrganizationId)

      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await validateICPAccess(mockUserId, mockOrganizationId)

      expect(result).toBe(false)
    })

    it('should return false for database errors', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }
      mockCreateClient.mockReturnValue(mockQueryBuilder)

      const result = await validateICPAccess(mockUserId, mockOrganizationId)

      expect(result).toBe(false)
    })
  })
})
