// Tests for DataForSEO client specialized for subtopic generation
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataForSEOSubtopicClient } from '../../../lib/services/keyword-engine/dataforseo-client'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('DataForSEOSubtopicClient', () => {
  let client: DataForSEOSubtopicClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new DataForSEOSubtopicClient('test-login', 'test-password')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateSubtopics', () => {
    it('should successfully generate subtopics from DataForSEO API', async () => {
      const mockResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 20000,
          status_message: 'OK',
          result: [{
            title: 'Understanding AI Basics',
            type: 'subtopic',
            keywords: ['artificial intelligence', 'machine learning']
          }, {
            title: 'AI Applications in Business',
            type: 'subtopic',
            keywords: ['business automation', 'AI solutions']
          }, {
            title: 'Future of AI Technology',
            type: 'subtopic',
            keywords: ['AI trends', 'future technology']
          }]
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers()
      })

      const result = await client.generateSubtopics('artificial intelligence', 'en', 2840)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        title: 'Understanding AI Basics',
        keywords: ['artificial intelligence', 'machine learning']
      })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dataforseo.com/v3/content_generation/generate_sub_topics/live',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"topic":"artificial intelligence"')
        })
      )
    })

    it('should handle API errors without retry', async () => {
      const errorResponse = {
        status_code: 50000,
        status_message: 'Internal Server Error'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => errorResponse,
        headers: new Headers()
      })

      await expect(client.generateSubtopics('test', 'en', 2840))
        .rejects.toThrow('DataForSEO API error: Internal Server Error')

      // API errors should not retry - only called once
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle network errors with exponential backoff', async () => {
      vi.useFakeTimers()
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const promise = client.generateSubtopics('test', 'en', 2840)
      
      // Advance timers for each retry
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)
      await vi.advanceTimersByTimeAsync(8000)
      
      await expect(promise).rejects.toThrow('Network error')
      expect(mockFetch).toHaveBeenCalledTimes(3)
      
      vi.useRealTimers()
    })

    it('should validate required parameters', async () => {
      await expect(client.generateSubtopics('', 'en', 2840))
        .rejects.toThrow('Topic is required')

      await expect(client.generateSubtopics('test', '', 2840))
        .rejects.toThrow('Language is required')

      await expect(client.generateSubtopics('test', 'en', 0))
        .rejects.toThrow('Location code is required')
    })

    it('should handle malformed API responses gracefully', async () => {
      vi.useFakeTimers()
      
      const malformedResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [] // Missing task data
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => malformedResponse,
        headers: new Headers()
      })

      const promise = client.generateSubtopics('test', 'en', 2840)
      
      // The client will retry, but each retry will fail with the same error
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)
      await vi.advanceTimersByTimeAsync(8000)
      
      await expect(promise).rejects.toThrow('Invalid DataForSEO response format')
      
      vi.useRealTimers()
    }, 10000)

    it('should handle rate limiting with Retry-After header', async () => {
      vi.useFakeTimers()
      
      const rateLimitResponse = {
        status_code: 42900,
        status_message: 'Rate Limited'
      }

      const successResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 20000,
          status_message: 'OK',
          result: [{
            title: 'Test Subtopic',
            type: 'subtopic',
            keywords: ['test']
          }]
        }]
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => rateLimitResponse,
          headers: new Headers({ 'Retry-After': '2' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => successResponse,
          headers: new Headers()
        })

      const promise = client.generateSubtopics('test', 'en', 2840)
      
      // Advance timers for the retry delay (2 seconds)
      await vi.advanceTimersByTimeAsync(2000)
      
      const result = await promise

      expect(result).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      vi.useRealTimers()
    }, 10000) // 10 second timeout
  })
})
