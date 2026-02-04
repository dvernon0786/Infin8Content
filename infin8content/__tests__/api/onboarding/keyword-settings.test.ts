import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/keyword-settings/route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

// Mock the dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')

const mockCreateClient = vi.mocked(createClient)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('/api/onboarding/keyword-settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
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

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
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
    it('should return 400 for keyword limit below minimum', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify({ 
          target_region: 'United States',
          language_code: 'en',
          auto_generate_keywords: true,
          monthly_keyword_limit: 0
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('monthly_keyword_limit')
      expect(data.details.message).toContain('Monthly keyword limit must be at least 1')
    })

    it('should return 400 for keyword limit above maximum', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify({ 
          target_region: 'United States',
          language_code: 'en',
          auto_generate_keywords: true,
          monthly_keyword_limit: 2000
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('monthly_keyword_limit')
      expect(data.details.message).toContain('Monthly keyword limit must be less than 1000')
    })

    it('should return 400 for non-integer keyword limit', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify({ 
          target_region: 'United States',
          language_code: 'en',
          auto_generate_keywords: true,
          monthly_keyword_limit: 100.5
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('monthly_keyword_limit')
      expect(data.details.message).toContain('Monthly keyword limit must be an integer')
    })

    it('should return 400 for short target region', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify({ 
          target_region: 'US',
          language_code: 'en',
          auto_generate_keywords: true,
          monthly_keyword_limit: 100
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('target_region')
      expect(data.details.message).toContain('Target region must be at least 2 characters')
    })

    it('should return 400 for invalid JSON', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
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
    it('should save keyword settings successfully', async () => {
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
            keyword_settings: {
              target_region: 'United States',
              language_code: 'en',
              auto_generate_keywords: true,
              monthly_keyword_limit: 100
            }
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      }

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.keyword_settings).toEqual(requestBody)

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        keyword_settings: requestBody,
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org-id')
    })

    it('should merge keyword settings with existing data', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client with existing keyword_settings
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { 
              keyword_settings: {
                existing_setting: 'value'
              }
            },
            error: null
          })
          .mockResolvedValueOnce({
            data: {
              id: 'org-id',
              keyword_settings: {
                existing_setting: 'value',
                target_region: 'United Kingdom',
                language_code: 'en',
                auto_generate_keywords: false,
                monthly_keyword_limit: 200
              }
            },
            error: null
          }),
        update: vi.fn().mockReturnThis(),
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        target_region: 'United Kingdom',
        language_code: 'en',
        auto_generate_keywords: false,
        monthly_keyword_limit: 200
      }

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.keyword_settings.existing_setting).toBe('value')
      expect(data.organization.keyword_settings.target_region).toBe('United Kingdom')
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

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify({
          target_region: 'United States',
          language_code: 'en',
          auto_generate_keywords: true,
          monthly_keyword_limit: 100
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save keyword settings')
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

      const request = new Request('http://localhost:3000/api/onboarding/keyword-settings', {
        method: 'POST',
        body: JSON.stringify({
          target_region: 'United States',
          language_code: 'en',
          auto_generate_keywords: true,
          monthly_keyword_limit: 100
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
