/**
 * Cancel Invitation API Route Tests
 * 
 * Unit tests for POST /api/team/cancel-invitation endpoint
 * Tests cover authorization, validation, invitation lookup, and cancellation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')

// Test Constants - Valid UUIDs
const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const ORG_ID = '33333333-3333-4333-8333-333333333333'
const INVITATION_ID = '44444444-4444-4444-8444-444444444444'

describe('POST /api/team/cancel-invitation', () => {
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
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: INVITATION_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to cancel invitations")
    })

    it('should reject non-owner users', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        role: 'editor',
      })

      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: INVITATION_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to cancel invitations")
    })
  })

  describe('Request Validation', () => {
    it('should validate invitationId is UUID', async () => {
      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invalid-uuid' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid invitation ID')
    })
  })

  describe('Invitation Lookup', () => {
    it('should reject if invitation not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: INVITATION_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Invitation not found')
    })

    it('should reject if invitation belongs to different organization', async () => {
      // Invitation query returns null because org_id doesn't match
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: INVITATION_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Invitation not found')
    })
  })

  describe('Successful Cancellation', () => {
    it('should update invitation status to expired', async () => {
      const mockInvitation = {
        id: INVITATION_ID,
      }

      // Get invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      // Update invitation
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: INVITATION_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle update failure', async () => {
      const mockInvitation = {
        id: INVITATION_ID,
      }

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      })

      mockRequest = new Request('http://localhost/api/team/cancel-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: INVITATION_ID }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to cancel invitation. Please try again.')
    })
  })
})
