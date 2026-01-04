/**
 * Organization Update API Route Tests
 * 
 * Unit tests for POST /api/organizations/update endpoint
 * Tests cover validation, authorization, organization update, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/env')

describe('POST /api/organizations/update', () => {
  let mockSupabase: any
  let mockRequest: Request

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(validateSupabaseEnv).mockReturnValue(undefined)
  })

  describe('Request Validation', () => {
    it('should validate organization name minimum length', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A', // Too short
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('at least 2 characters')
    })

    it('should validate organization name maximum length', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: 'org-id', role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A'.repeat(101), // Too long
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 100 characters')
    })
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Updated Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 404 if user has no organization', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id', org_id: null, role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Updated Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })
  })

  describe('Authorization', () => {
    it('should return 403 if user is not organization owner', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: 'org-id',
        role: 'editor', // Not owner
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Updated Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('permission')
    })
  })

  describe('Organization Update', () => {
    it('should update organization name successfully', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: 'org-id',
        role: 'owner',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Updated Organization',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      // Mock users table query
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      // Mock duplicate name check (no duplicate)
      const mockDuplicateCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockDuplicateCheck)

      // Mock organizations table update
      const mockOrgsUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsUpdate)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Updated Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.name).toBe('Updated Organization')

      // Verify organization was updated
      expect(mockOrgsUpdate.update).toHaveBeenCalledWith({ name: 'Updated Organization' })
    })

    it('should prevent duplicate organization names', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: 'org-id',
        role: 'owner',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      // Mock duplicate name check (duplicate found)
      const mockDuplicateCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'other-org-id' }, // Duplicate exists
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockDuplicateCheck)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Existing Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exists')
    })
  })

  describe('Error Handling', () => {
    it('should handle organization update failure', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: 'org-id',
        role: 'owner',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null,
      })

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUserRecord,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      const mockDuplicateCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockDuplicateCheck)

      const mockOrgsUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsUpdate)

      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Updated Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to update organization')
    })

    it('should handle JSON parse errors', async () => {
      mockRequest = new Request('http://localhost/api/organizations/update', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})

