/**
 * Team Invite API Route Tests
 * 
 * Unit tests for POST /api/team/invite endpoint
 * Tests cover authorization, validation, duplicate checks, and invitation creation
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

// Test Constants - Valid UUIDs
const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const ORG_ID = '33333333-3333-4333-8333-333333333333'
const INVITATION_ID = '44444444-4444-4444-8444-444444444444'
const EXISTING_USER_ID = '66666666-6666-4666-8666-666666666666'

describe('POST /api/team/invite', () => {
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
      insert: vi.fn().mockReturnThis(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    // Mock current user (organization owner)
    mockCurrentUser = {
      id: OWNER_ID,
      email: 'owner@example.com',
      org_id: ORG_ID,
      role: 'owner',
      organizations: { name: 'Test Org' },
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)
    vi.mocked(sendTeamInvitationEmail).mockResolvedValue(undefined)
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to invite team members")
    })

    it('should reject non-owner users', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        role: 'editor',
      })

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to invite team members")
    })

    it('should reject users without organization', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        org_id: null,
      })

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to invite team members")
    })
  })

  describe('Request Validation', () => {
    it('should validate email format', async () => {
      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid email address')
    })

    it('should validate role is editor or viewer', async () => {
      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', role: 'owner' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Role must be editor or viewer')
    })

    it('should require email field', async () => {
      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Duplicate Checks', () => {
    it('should reject if user already belongs to organization', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: EXISTING_USER_ID },
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User already belongs to this organization')
    })

    it('should reject if pending invitation already exists', async () => {
      // First check: user doesn't exist
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // Second check: pending invitation exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: INVITATION_ID },
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'pending@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('A pending invitation already exists for this email')
    })
  })

  describe('Successful Invitation', () => {
    it('should create invitation and send email', async () => {
      // User doesn't exist
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // No pending invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // Insert invitation
      const mockInvitation = {
        id: INVITATION_ID,
        email: 'newuser@example.com',
        org_id: ORG_ID,
        role: 'editor',
        token: 'token-123',
      }
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'newuser@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.invitationId).toBe(INVITATION_ID)
      expect(sendTeamInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          role: 'editor',
          invitationToken: expect.any(String),
        })
      )
    })

    it('should handle email sending failure gracefully', async () => {
      // User doesn't exist
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // No pending invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // Insert invitation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: INVITATION_ID },
          error: null,
        }),
      })

      vi.mocked(sendTeamInvitationEmail).mockRejectedValue(new Error('Email failed'))

      mockRequest = new Request('http://localhost/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      // Should still succeed even if email fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
