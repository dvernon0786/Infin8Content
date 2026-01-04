/**
 * Resend Invitation API Route Tests
 * 
 * Unit tests for POST /api/team/resend-invitation endpoint
 * Tests cover authorization, validation, invitation lookup, and resending
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendTeamInvitationEmail } from '@/lib/services/team-notifications'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/team-notifications')

describe('POST /api/team/resend-invitation', () => {
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
      id: 'owner-123',
      email: 'owner@example.com',
      org_id: 'org-123',
      role: 'owner',
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)
    vi.mocked(sendTeamInvitationEmail).mockResolvedValue(undefined)
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)
      
      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invitation-123' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to resend invitations")
    })

    it('should reject non-owner users', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        role: 'editor',
      })
      
      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invitation-123' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to resend invitations")
    })
  })

  describe('Request Validation', () => {
    it('should validate invitationId is UUID', async () => {
      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
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

      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invitation-123' }),
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

      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invitation-123' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Invitation not found')
    })
  })

  describe('Successful Resend', () => {
    it('should regenerate token and send email', async () => {
      const mockInvitation = {
        id: 'invitation-123',
        email: 'user@example.com',
        org_id: 'org-123',
        role: 'editor',
        token: 'old-token',
        status: 'pending',
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

      // Get organization
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'Test Org' },
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invitation-123' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(sendTeamInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          role: 'editor',
          invitationToken: expect.any(String),
        })
      )
      // Verify new token is different from old token
      const emailCall = vi.mocked(sendTeamInvitationEmail).mock.calls[0][0]
      expect(emailCall.invitationToken).not.toBe('old-token')
    })

    it('should handle email sending failure gracefully', async () => {
      const mockInvitation = {
        id: 'invitation-123',
        email: 'user@example.com',
        org_id: 'org-123',
        role: 'editor',
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

      vi.mocked(sendTeamInvitationEmail).mockRejectedValue(new Error('Email failed'))

      mockRequest = new Request('http://localhost/api/team/resend-invitation', {
        method: 'POST',
        body: JSON.stringify({ invitationId: 'invitation-123' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      // Should still succeed even if email fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

