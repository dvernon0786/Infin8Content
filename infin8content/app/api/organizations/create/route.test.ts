/**
 * Organization Creation API Route Tests
 * 
 * Unit tests for POST /api/organizations/create endpoint
 * Tests cover validation, organization creation, user linking, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/env')

describe('POST /api/organizations/create', () => {
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
          data: { id: 'user-id', org_id: null, role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/create', {
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
          data: { id: 'user-id', org_id: null, role: 'owner' },
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/create', {
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

    it('should validate organization name is required', async () => {
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

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 404 if user record not found', async () => {
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
          data: null,
          error: { message: 'User not found' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersQuery)

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User record not found')
    })
  })

  describe('Organization Creation', () => {
    it('should create organization and link user successfully', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: null,
        role: 'owner',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Organization',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
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
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockDuplicateCheck)

      // Mock organizations table insert
      const mockOrgsInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsInsert)

      // Mock users table update
      const mockUsersUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersUpdate)

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.name).toBe('Test Organization')
      expect(data.organization.plan).toBe('starter')
      expect(data.redirectTo).toBe('/dashboard')

      // Verify organization was created with correct data
      expect(mockOrgsInsert.insert).toHaveBeenCalledWith({
        name: 'Test Organization',
        plan: 'starter',
        payment_status: 'pending_payment',
        white_label_settings: {},
      })

      // Verify user was updated
      expect(mockUsersUpdate.update).toHaveBeenCalledWith({
        org_id: 'org-id',
        role: 'owner',
      })
    })

    it('should prevent creating organization if user already has one', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: 'existing-org-id',
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

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already have an organization')
      expect(data.error).toContain('Agency plan')
    })
  })

  describe('Error Handling', () => {
    it('should handle organization creation failure', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: null,
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

      // Mock duplicate name check (no duplicate)
      const mockDuplicateCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockDuplicateCheck)

      const mockOrgsInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: '23505' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsInsert)

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exists')
    })

    it('should rollback organization creation if user update fails', async () => {
      const mockAuthUser = {
        id: 'auth-user-id',
        email: 'test@example.com',
      }

      const mockUserRecord = {
        id: 'user-id',
        org_id: null,
        role: 'owner',
      }

      const mockOrganization = {
        id: 'org-id',
        name: 'Test Organization',
        plan: 'starter',
        white_label_settings: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
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

      // Mock duplicate name check (no duplicate)
      const mockDuplicateCheck = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockDuplicateCheck)

      const mockOrgsInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrganization,
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsInsert)

      const mockUsersUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockUsersUpdate)

      // Mock organization delete for rollback
      const mockOrgsDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }
      mockSupabase.from.mockReturnValueOnce(mockOrgsDelete)

      mockRequest = new Request('http://localhost/api/organizations/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Organization',
        }),
      })

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create organization')

      // Verify rollback: organization should be deleted
      expect(mockOrgsDelete.delete).toHaveBeenCalled()
      expect(mockOrgsDelete.eq).toHaveBeenCalledWith('id', 'org-id')
    })

    it('should handle JSON parse errors', async () => {
      mockRequest = new Request('http://localhost/api/organizations/create', {
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

