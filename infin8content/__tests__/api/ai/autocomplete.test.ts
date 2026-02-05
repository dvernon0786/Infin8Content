/**
 * Tests for AI Autocomplete API Endpoint
 * Story A-5: Onboarding Agent AI Autocomplete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST, GET } from '@/app/api/ai/autocomplete/route'

// Mock the AI autocomplete service
vi.mock('@/lib/services/ai-autocomplete', () => ({
  generateAutocompleteSuggestions: vi.fn()
}))

import { generateAutocompleteSuggestions } from '@/lib/services/ai-autocomplete'

describe('AI Autocomplete API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/ai/autocomplete', () => {
    it('should return suggestions for valid request', async () => {
      const mockSuggestions = {
        suggestions: [
          { id: '1', text: 'Test suggestion', category: 'template', source: 'ai' }
        ],
        cached: false,
        processingTime: 100
      }

      vi.mocked(generateAutocompleteSuggestions).mockResolvedValue(mockSuggestions)

      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'competitors',
          limit: 5
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockSuggestions)
      expect(generateAutocompleteSuggestions).toHaveBeenCalledWith({
        query: 'test',
        context: 'competitors',
        limit: 5
      })
    })

    it('should reject requests without query', async () => {
      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'competitors'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query is required and must be a string')
    })

    it('should reject requests with invalid query type', async () => {
      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 123,
          context: 'competitors'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query is required and must be a string')
    })

    it('should reject requests without context', async () => {
      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Context is required and must be: competitors, business, or blog')
    })

    it('should reject requests with invalid context', async () => {
      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'invalid'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Context is required and must be: competitors, business, or blog')
    })

    it('should reject requests with invalid limit', async () => {
      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'competitors',
          limit: 15
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Limit must be a number between 1 and 10')
    })

    it('should handle authentication errors', async () => {
      vi.mocked(generateAutocompleteSuggestions).mockRejectedValue(
        new Error('Authentication required')
      )

      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'competitors'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle rate limit errors', async () => {
      vi.mocked(generateAutocompleteSuggestions).mockRejectedValue(
        new Error('Rate limit exceeded. Maximum 10 requests per 60 seconds.')
      )

      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'competitors'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded. Please try again later.')
    })

    it('should handle validation errors from service', async () => {
      vi.mocked(generateAutocompleteSuggestions).mockRejectedValue(
        new Error('Query must be at least 2 characters')
      )

      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 't',
          context: 'competitors'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters')
    })

    it('should handle generic service errors', async () => {
      vi.mocked(generateAutocompleteSuggestions).mockRejectedValue(
        new Error('AI service unavailable')
      )

      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'competitors'
        })
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should use default limit when not provided', async () => {
      const mockSuggestions = {
        suggestions: [
          { id: '1', text: 'Test suggestion', category: 'template', source: 'ai' }
        ],
        cached: false,
        processingTime: 100
      }

      vi.mocked(generateAutocompleteSuggestions).mockResolvedValue(mockSuggestions)

      const request = new Request('http://localhost:3000/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          context: 'competitors'
        })
      })

      const response = await POST(request as any)

      expect(response.status).toBe(200)
      expect(generateAutocompleteSuggestions).toHaveBeenCalledWith({
        query: 'test',
        context: 'competitors'
      })
    })
  })

  describe('GET /api/ai/autocomplete', () => {
    it('should reject GET requests', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
})
