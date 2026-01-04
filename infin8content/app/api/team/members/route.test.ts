/**
 * Get Team Members API Route Tests
 * 
 * Unit tests for GET /api/team/members endpoint
 * Tests cover authorization, fetching members and pending invitations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')

describe('GET /api/team/members', () => {
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
      order: vi.fn().mockReturnThis(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    
    // Mock current user
    mockCurrentUser = {
      id: 'user-123',
      email: 'user@example.com',
      org_id: 'org-123',
      role: 'owner',
    }
    vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)
  })

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)
      
      mockRequest = new Request('http://localhost/api/team/members', {
        method: 'GET',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })

    it('should reject users without organization', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...mockCurrentUser,
        org_id: null,
      })
      
      mockRequest = new Request('http://localhost/api/team/members', {
        method: 'GET',
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })
  })

  describe('Successful Fetch', () => {
    it('should return team members and pending invitations', async () => {
      const mockMembers = [
        {
          id: 'user-1',
          email: 'member1@example.com',
          role: 'editor',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'user-2',
          email: 'member2@example.com',
          role: 'viewer',
          created_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockInvitations = [
        {
          id: 'invitation-1',
          email: 'pending@example.com',
          role: 'editor',
          expires_at: '2024-01-10T00:00:00Z',
          created_at: '2024-01-03T00:00:00Z',
          created_by: 'owner-123',
        },
      ]

      // Mock members query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMembers,
          error: null,
        }),
      })

      // Mock invitations query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInvitations,
          error: null,
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.members).toHaveLength(2)
      expect(data.members[0]).toEqual({
        id: 'user-1',
        email: 'member1@example.com',
        role: 'editor',
        createdAt: '2024-01-01T00:00:00Z',
      })
      expect(data.pendingInvitations).toHaveLength(1)
      expect(data.pendingInvitations[0]).toEqual({
        id: 'invitation-1',
        email: 'pending@example.com',
        role: 'editor',
        expiresAt: '2024-01-10T00:00:00Z',
        createdAt: '2024-01-03T00:00:00Z',
      })
    })

    it('should handle empty members and invitations', async () => {
      // Mock members query - empty
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      // Mock invitations query - empty
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.members).toEqual([])
      expect(data.pendingInvitations).toEqual([])
    })

    it('should handle members query error', async () => {
      // Mock members query - error
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch team members')
    })

    it('should handle invitations query error gracefully', async () => {
      const mockMembers = [
        {
          id: 'user-1',
          email: 'member1@example.com',
          role: 'editor',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock members query - success
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockMembers,
          error: null,
        }),
      })

      // Mock invitations query - error (should not fail the request)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      const response = await GET()
      const data = await response.json()

      // Should still succeed, just return empty invitations
      expect(response.status).toBe(200)
      expect(data.members).toHaveLength(1)
      expect(data.pendingInvitations).toEqual([])
    })
  })
})

