/**
 * Update Role API Route Tests
 * 
 * Unit tests for POST /api/team/update-role endpoint
 * Tests cover authorization, validation, role change restrictions, and role updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { sendRoleChangeEmail } from '@/lib/services/team-notifications'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/team-notifications')

describe('POST /api/team/update-role', () => {
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
    vi.mocked(sendRoleChangeEmail).mockResolvedValue(undefined)
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)
      
      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to update roles")
    })

    it('should reject non-owner users', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        role: 'editor',
      })
      
      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("You don't have permission to update roles")
    })
  })

  describe('Request Validation', () => {
    it('should validate userId is UUID', async () => {
      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'invalid-uuid', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid user ID')
    })

    it('should validate role is editor or viewer', async () => {
      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'owner' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Role must be editor or viewer')
    })
  })

  describe('Role Change Restrictions', () => {
    it('should reject changing own role', async () => {
      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'owner-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot change your own role')
    })

    it('should reject changing owner role', async () => {
      const targetUser = {
        id: 'user-123',
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

      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot change owner role')
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

      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found in organization')
    })
  })

  describe('Successful Role Update', () => {
    it('should update role and send notification email', async () => {
      const targetUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'viewer',
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

      // Update user role
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

      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(sendRoleChangeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          oldRole: 'viewer',
          newRole: 'editor',
        })
      )
    })

    it('should handle email sending failure gracefully', async () => {
      const targetUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'viewer',
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

      vi.mocked(sendRoleChangeEmail).mockRejectedValue(new Error('Email failed'))

      mockRequest = new Request('http://localhost/api/team/update-role', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123', role: 'editor' }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      // Should still succeed even if email fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

