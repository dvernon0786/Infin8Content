import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/blog/route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

// Mock the dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')

const mockCreateClient = vi.mocked(createClient)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('/api/onboarding/blog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
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

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
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
    it('should return 400 for missing blog name', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify({ 
          blog_description: 'A great blog',
          blog_category: 'Technology',
          post_frequency: 'weekly'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('blog_name')
      expect(data.details.message).toBe('Required')
    })

    it('should return 400 for short blog name', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify({ 
          blog_name: 'AB',
          blog_description: 'A great blog',
          blog_category: 'Technology',
          post_frequency: 'weekly'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('blog_name')
      expect(data.details.message).toContain('Blog name must be at least 3 characters')
    })

    it('should return 400 for invalid post frequency', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify({ 
          blog_name: 'Tech Blog',
          blog_description: 'A blog about technology',
          blog_category: 'Technology',
          post_frequency: 'invalid'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('post_frequency')
      expect(data.details.message).toContain('Post frequency must be one of: daily, weekly, monthly')
    })

    it('should return 400 for short blog description', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify({ 
          blog_name: 'Tech Blog',
          blog_description: 'Too short',
          blog_category: 'Technology',
          post_frequency: 'weekly'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('blog_description')
      expect(data.details.message).toContain('Blog description must be at least 10 characters')
    })

    it('should return 400 for invalid JSON', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
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
    it('should save blog information successfully', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const requestBody = {
        blog_name: 'Tech Blog',
        blog_description: 'A blog about technology and innovation',
        blog_category: 'Technology',
        post_frequency: 'weekly'
      }

      // Mock Supabase client
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { blog_config: {} },
            error: null
          })
          .mockResolvedValueOnce({
            data: {
              id: 'org-id',
              blog_config: requestBody
            },
            error: null
          }),
        update: vi.fn().mockReturnThis(),
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.blog_config).toEqual(requestBody)

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        blog_config: requestBody,
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org-id')
    })

    it('should merge blog config with existing data', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client with existing blog_config
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { 
              blog_config: {
                existing_setting: 'value'
              }
            },
            error: null
          })
          .mockResolvedValueOnce({
            data: {
              id: 'org-id',
              blog_config: {
                existing_setting: 'value',
                blog_name: 'Updated Blog',
                blog_description: 'Updated description',
                blog_category: 'Business',
                post_frequency: 'daily'
              }
            },
            error: null
          }),
        update: vi.fn().mockReturnThis(),
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        blog_name: 'Updated Blog',
        blog_description: 'Updated description',
        blog_category: 'Business',
        post_frequency: 'daily'
      }

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.blog_config.existing_setting).toBe('value')
      expect(data.organization.blog_config.blog_name).toBe('Updated Blog')
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

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify({
          blog_name: 'Tech Blog',
          blog_description: 'A blog about technology',
          blog_category: 'Technology',
          post_frequency: 'weekly'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save blog information')
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

      const request = new Request('http://localhost:3000/api/onboarding/blog', {
        method: 'POST',
        body: JSON.stringify({
          blog_name: 'Tech Blog',
          blog_description: 'A blog about technology',
          blog_category: 'Technology',
          post_frequency: 'weekly'
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })
  })
})
