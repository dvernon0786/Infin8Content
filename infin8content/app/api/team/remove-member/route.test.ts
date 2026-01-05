/**
 * Remove Member API Route Tests
 * 
 * Unit tests for POST /api/team/remove-member endpoint
 * Tests cover authorization, validation, removal restrictions, and member removal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendMemberRemovedEmail } from '@/lib/services/team-notifications'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/team-notifications')

// Test Constants - Valid UUIDs
const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '22222222-2222-4222-8222-222222222222'
const ORG_ID = '33333333-3333-4333-8333-333333333333'

describe('POST /api/team/remove-member', () => {
  let mockSupabase: any
  let mockRequest: Request
  let mockCurrentUser: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    // Mock current user (organization owner)
    mockCurrentUser = {
      id: OWNER_ID,
      email: 'owner@example.com',
      org_id: ORG_ID,
      role: 'owner',
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)
    vi.mocked(sendMemberRemovedEmail).mockResolvedValue(undefined)
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to remove members")
    })

    it('should reject non-owner users', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        role: 'editor',
      })

      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to remove members")
    })
  })

  describe('Request Validation', () => {
    it('should validate userId is UUID', async () => {
      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: 'invalid-uuid' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid user ID')
    })
  })

  describe('Removal Restrictions', () => {
    it('should reject removing self', async () => {
      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: OWNER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot remove yourself')
    })

    it('should reject removing owner', async () => {
      const targetUser = {
        id: USER_ID,
        email: 'user@example.com',
        role: 'owner',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: targetUser,
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot remove organization owner')
    })

    it('should reject if user not found in organization', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found in organization')
    })
  })

  describe('Successful Member Removal', () => {
    it('should remove member and send notification email', async () => {
      const targetUser = {
        id: USER_ID,
        email: 'user@example.com',
        role: 'editor',
      }

      // Get target user
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: targetUser,
          error: null,
        }),
      })

      // Remove user from organization
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn()
          .mockImplementationOnce(function () {
            return this
          })
          .mockResolvedValueOnce({
            error: null,
          }),
      })

      // Get organization
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'Test Org' },
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(sendMemberRemovedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          organizationName: 'Test Org',
        })
      )
    })

    it('should handle email sending failure gracefully', async () => {
      const targetUser = {
        id: USER_ID,
        email: 'user@example.com',
        role: 'editor',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: targetUser,
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn()
          .mockImplementationOnce(function () {
            return this
          })
          .mockResolvedValueOnce({
            error: null,
          }),
      })

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'Test Org' },
          error: null,
        }),
      })

      vi.mocked(sendMemberRemovedEmail).mockRejectedValue(new Error('Email failed'))

      mockRequest = new Request('http://localhost/api/team/remove-member', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      // Should still succeed even if email fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
