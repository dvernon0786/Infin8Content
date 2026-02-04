import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/competitors/route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

// Mock the dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')

const mockCreateClient = vi.mocked(createClient)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('/api/onboarding/competitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
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

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
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
    it('should return 400 for empty competitors array', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify({ competitors: [] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('competitors')
      expect(data.details.message).toContain('At least one competitor is required')
    })

    it('should return 400 for invalid competitor URL', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify({ 
          competitors: [
            { name: 'Competitor One', url: 'not-a-url' }
          ]
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('competitors')
      expect(data.details.message).toContain('Invalid competitor URL format')
    })

    it('should return 400 for too many competitors', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const competitors = Array(11).fill(null).map((_, i) => ({
        name: `Competitor ${i}`,
        url: `https://competitor${i}.com`
      }))

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify({ competitors }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('competitors')
      expect(data.details.message).toContain('Maximum 10 competitors allowed')
    })

    it('should return 400 for invalid JSON', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
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
    it('should save competitor information successfully', async () => {
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
            blog_config: {
              competitors: [
                { name: 'Competitor One', url: 'https://competitor1.com', description: 'A major competitor' },
                { name: 'Competitor Two', url: 'https://competitor2.com' }
              ]
            }
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        competitors: [
          { name: 'Competitor One', url: 'https://competitor1.com', description: 'A major competitor' },
          { name: 'Competitor Two', url: 'https://competitor2.com' }
        ]
      }

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.blog_config.competitors).toEqual(requestBody.competitors)

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        blog_config: {
          competitors: requestBody.competitors
        },
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org-id')
    })

    it('should merge competitors with existing blog_config', async () => {
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
                competitors: [
                  { name: 'Competitor Two', url: 'https://competitor2.com' }
                ]
              }
            },
            error: null
          }),
        update: vi.fn().mockReturnThis(),
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        competitors: [
          { name: 'Competitor Two', url: 'https://competitor2.com' }
        ]
      }

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.blog_config.existing_setting).toBe('value')
      expect(data.organization.blog_config.competitors).toEqual(requestBody.competitors)
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

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify({ competitors: [{ name: 'Test', url: 'https://test.com' }] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save competitor information')
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

      const request = new Request('http://localhost:3000/api/onboarding/competitors', {
        method: 'POST',
        body: JSON.stringify({ competitors: [{ name: 'Test', url: 'https://test.com' }] }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Organization not found')
    })
  })
})
