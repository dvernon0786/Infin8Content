import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/complete/route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

// Mock the dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')

const mockCreateClient = vi.mocked(createClient)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('/api/onboarding/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when user has no organization', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: null })

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Validation', () => {
    it('should accept empty object', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-id',
            onboarding_completed: true,
            onboarding_completed_at: expect.any(String)
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept object with additional properties (ignored)', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-id',
            onboarding_completed: true,
            onboarding_completed_at: expect.any(String)
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({ 
          extra: 'property',
          another: 'value'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for invalid JSON', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })
  })

  describe('Success scenarios', () => {
    it('should complete onboarding successfully', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-id',
            onboarding_completed: true,
            onboarding_completed_at: '2026-02-05T10:30:00.000Z'
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization).toEqual({
        id: 'org-id',
        onboarding_completed: true,
        onboarding_completed_at: '2026-02-05T10:30:00.000Z'
      })
      expect(data.redirectTo).toBe('/dashboard')

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        onboarding_completed: true,
        onboarding_completed_at: expect.any(String),
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org-id')
    })

    it('should handle completion with existing onboarding data', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client with existing data
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-id',
            onboarding_completed: true,
            onboarding_completed_at: '2026-02-05T10:30:00.000Z',
            website_url: 'https://example.com',
            blog_config: { blog_name: 'Tech Blog' }
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.onboarding_completed).toBe(true)
      expect(data.organization.onboarding_completed_at).toBeDefined()
      expect(data.redirectTo).toBe('/dashboard')
    })
  })

  describe('Error handling', () => {
    it('should return 500 when database update fails', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client with error
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to complete onboarding')
    })

    it('should return 404 when organization not found after update', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client with no data returned
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })
  })
})
