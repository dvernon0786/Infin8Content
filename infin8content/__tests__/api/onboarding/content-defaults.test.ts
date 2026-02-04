import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/onboarding/content-defaults/route'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

// Mock the dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/supabase/get-current-user')

const mockCreateClient = vi.mocked(createClient)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('/api/onboarding/content-defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
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

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
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
    it('should return 400 for invalid tone', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify({ 
          language: 'en',
          tone: 'invalid',
          style: 'informative',
          target_word_count: 1500,
          auto_publish: false
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('tone')
      expect(data.details.message).toContain('Tone must be one of: professional, casual, formal, friendly')
    })

    it('should return 400 for invalid style', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify({ 
          language: 'en',
          tone: 'professional',
          style: 'invalid',
          target_word_count: 1500,
          auto_publish: false
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('style')
      expect(data.details.message).toContain('Style must be one of: informative, persuasive, educational')
    })

    it('should return 400 for word count below minimum', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify({ 
          language: 'en',
          tone: 'professional',
          style: 'informative',
          target_word_count: 400,
          auto_publish: false
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('target_word_count')
      expect(data.details.message).toContain('Word count must be at least 500')
    })

    it('should return 400 for word count above maximum', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify({ 
          language: 'en',
          tone: 'professional',
          style: 'informative',
          target_word_count: 15000,
          auto_publish: false
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details.field).toBe('target_word_count')
      expect(data.details.message).toContain('Word count must be less than 10,000')
    })

    it('should return 400 for invalid JSON', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
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
    it('should save content defaults successfully', async () => {
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
            content_defaults: {
              language: 'en',
              tone: 'professional',
              style: 'informative',
              target_word_count: 1500,
              auto_publish: false
            }
          },
          error: null
        })
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        language: 'en',
        tone: 'professional',
        style: 'informative',
        target_word_count: 1500,
        auto_publish: false
      }

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.content_defaults).toEqual(requestBody)

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('organizations')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        content_defaults: requestBody,
        updated_at: expect.any(String)
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'org-id')
    })

    it('should merge content defaults with existing data', async () => {
      // Mock authentication
      mockGetCurrentUser.mockResolvedValue({ id: 'user-id', org_id: 'org-id' })

      // Mock Supabase client with existing content_defaults
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: { 
              content_defaults: {
                existing_setting: 'value'
              }
            },
            error: null
          })
          .mockResolvedValueOnce({
            data: {
              id: 'org-id',
              content_defaults: {
                existing_setting: 'value',
                language: 'es',
                tone: 'casual',
                style: 'persuasive',
                target_word_count: 2000,
                auto_publish: true
              }
            },
            error: null
          }),
        update: vi.fn().mockReturnThis(),
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const requestBody = {
        language: 'es',
        tone: 'casual',
        style: 'persuasive',
        target_word_count: 2000,
        auto_publish: true
      }

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.organization.content_defaults.existing_setting).toBe('value')
      expect(data.organization.content_defaults.language).toBe('es')
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

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify({
          language: 'en',
          tone: 'professional',
          style: 'informative',
          target_word_count: 1500,
          auto_publish: false
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save content defaults')
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

      const request = new Request('http://localhost:3000/api/onboarding/content-defaults', {
        method: 'POST',
        body: JSON.stringify({
          language: 'en',
          tone: 'professional',
          style: 'informative',
          target_word_count: 1500,
          auto_publish: false
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
