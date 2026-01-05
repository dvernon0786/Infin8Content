/**
 * Accept Invitation API Route Tests
 * 
 * Unit tests for POST /api/team/accept-invitation endpoint
 * Tests cover token validation, expiration checks, user registration flow, and acceptance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendTeamInvitationAcceptedEmail } from '@/lib/services/team-notifications'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/team-notifications')

// Test Constants - Valid UUIDs
const USER_ID = '22222222-2222-4222-8222-222222222222'
const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const ORG_ID = '33333333-3333-4333-8333-333333333333'
const OTHER_ORG_ID = '77777777-7777-4777-8777-777777777777'
const INVITATION_ID = '44444444-4444-4444-8444-444444444444'

describe('POST /api/team/accept-invitation', () => {
  let mockSupabase: any
  let mockRequest: Request
  let mockInvitation: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    vi.mocked(sendTeamInvitationAcceptedEmail).mockResolvedValue(undefined)

    // Mock valid invitation
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    mockInvitation = {
      id: INVITATION_ID,
      email: 'user@example.com',
      org_id: ORG_ID,
      role: 'editor',
      token: 'valid-token',
      status: 'pending',
      expires_at: futureDate.toISOString(),
      created_by: OWNER_ID,
    }
  })

  describe('Token Validation', () => {
    it('should require token field', async () => {
      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
    })

    it('should reject invalid or non-existent tokens', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // Check for expired invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid-token' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Invitation not found or already accepted')
    })

    it('should reject expired invitations', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const expiredInvitation = {
        ...mockInvitation,
        expires_at: pastDate.toISOString(),
      }

      // First query returns null (expired)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      // Second query finds expired invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: expiredInvitation,
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: 'expired-token' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('This invitation has expired. Please request a new invitation.')
    })
  })

  describe('User Registration Flow', () => {
    it('should return redirect URL if user does not exist', async () => {
      // Valid invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      // User doesn't exist
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.requiresRegistration).toBe(true)
      expect(data.redirectUrl).toContain('/register?invitation_token=valid-token')
    })
  })

  describe('Organization Membership Checks', () => {
    it('should reject if user already belongs to an organization', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: USER_ID,
        email: 'user@example.com',
        org_id: OTHER_ORG_ID,
        role: 'editor',
      })

      // Valid invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('You already belong to an organization. Please leave your current organization first.')
    })

    it('should reject if user already belongs to this organization', async () => {
      const existingUser = {
        id: USER_ID,
        email: 'user@example.com',
        org_id: ORG_ID, // Same as invitation
        role: 'editor',
      }

      // Valid invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      // User exists and belongs to same org
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: existingUser,
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User already belongs to this organization')
    })
  })

  describe('Successful Acceptance', () => {
    it('should accept invitation and add user to organization', async () => {
      const existingUser = {
        id: USER_ID,
        email: 'user@example.com',
        org_id: null,
        role: 'viewer',
      }

      // Valid invitation
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvitation,
          error: null,
        }),
      })

      // User exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: existingUser,
          error: null,
        }),
      })

      // Update user
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
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

      // Get owner
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { email: 'owner@example.com' },
          error: null,
        }),
      })

      mockRequest = new Request('http://localhost/api/team/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.redirectUrl).toBe('/dashboard')
      expect(sendTeamInvitationAcceptedEmail).toHaveBeenCalled()
    })
  })
})
