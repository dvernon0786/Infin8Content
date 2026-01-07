/**
 * Tavily API Client Tests
 * Story 4a.3: Real-Time Research Per Section (Tavily Integration)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { researchQuery } from '@/lib/services/tavily/tavily-client'

// Mock fetch globally
global.fetch = vi.fn()

describe('Tavily Client', () => {
  const mockApiKey = 'test-tavily-api-key'
  
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TAVILY_API_KEY = mockApiKey
  })

  describe('researchQuery', () => {
    it('should call Tavily API with correct request format', async () => {
      const mockResponse = {
        query: 'test query',
        results: [
          {
            title: 'Test Source',
            url: 'https://example.com',
            content: 'Test excerpt',
            score: 0.95,
            published_date: '2024-01-01',
            author: 'Test Author'
          }
        ],
        response_time: 1.5
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      await researchQuery('test query')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.tavily.com/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          }),
          body: expect.stringContaining('"query":"test query"')
        })
      )
    })

    it('should parse API response and extract sources', async () => {
      const mockResponse = {
        query: 'running shoes',
        results: [
          {
            title: 'Best Running Shoes 2024',
            url: 'https://example.com/shoes',
            content: 'Running shoes are essential...',
            score: 0.95,
            published_date: '2024-01-01',
            author: 'John Doe'
          },
          {
            title: 'Running Shoe Guide',
            url: 'https://example.com/guide',
            content: 'A comprehensive guide...',
            score: 0.85,
            published_date: null,
            author: null
          }
        ],
        response_time: 1.5
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await researchQuery('running shoes')

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        title: 'Best Running Shoes 2024',
        url: 'https://example.com/shoes',
        excerpt: 'Running shoes are essential...',
        published_date: '2024-01-01',
        author: 'John Doe',
        relevance_score: 0.95
      })
    })

    it('should rank sources by relevance score (descending)', async () => {
      const mockResponse = {
        query: 'test',
        results: [
          { title: 'Low Score', url: 'https://example.com/low', content: '', score: 0.5, published_date: null, author: null },
          { title: 'High Score', url: 'https://example.com/high', content: '', score: 0.95, published_date: null, author: null },
          { title: 'Medium Score', url: 'https://example.com/medium', content: '', score: 0.75, published_date: null, author: null }
        ],
        response_time: 1.5
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await researchQuery('test')

      expect(result[0].relevance_score).toBe(0.95)
      expect(result[1].relevance_score).toBe(0.75)
      expect(result[2].relevance_score).toBe(0.5)
    })

    it('should select top 5-10 most relevant sources', async () => {
      const mockResponse = {
        query: 'test',
        results: Array.from({ length: 20 }, (_, i) => ({
          title: `Source ${i}`,
          url: `https://example.com/${i}`,
          content: `Content ${i}`,
          score: 1 - (i * 0.05), // Decreasing scores
          published_date: null,
          author: null
        })),
        response_time: 1.5
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await researchQuery('test')

      // Should return top 5-10 sources (we'll implement to return top 10)
      expect(result.length).toBeGreaterThanOrEqual(5)
      expect(result.length).toBeLessThanOrEqual(10)
      expect(result[0].relevance_score).toBeGreaterThan(result[result.length - 1].relevance_score)
    })

    it('should handle API errors with retry logic', async () => {
      let attemptCount = 0
      ;(global.fetch as any).mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            query: 'test',
            results: [],
            response_time: 1.5
          })
        })
      })

      const result = await researchQuery('test query', { maxRetries: 3 })

      expect(attemptCount).toBe(3)
      expect(result).toEqual([])
    })

    it('should throw error after max retries exceeded', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      await expect(researchQuery('test query', { maxRetries: 3 })).rejects.toThrow()
    })

    it('should use exponential backoff for retries', async () => {
      const startTime = Date.now()
      const delays: number[] = []
      
      let lastCallTime = startTime
      ;(global.fetch as any).mockImplementation(() => {
        const now = Date.now()
        if (lastCallTime !== startTime) {
          delays.push(now - lastCallTime)
        }
        lastCallTime = now
        
        return Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ error: 'Rate limit exceeded' })
        })
      })

      try {
        await researchQuery('test query', { maxRetries: 3 })
      } catch {
        // Expected to fail after retries
      }

      // Verify delays increase exponentially (approximately)
      if (delays.length >= 2) {
        expect(delays[1]).toBeGreaterThan(delays[0])
      }
    })

    it('should handle missing API key', async () => {
      delete process.env.TAVILY_API_KEY

      await expect(researchQuery('test query')).rejects.toThrow('TAVILY_API_KEY')
    })

    it('should include search_depth advanced in request', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          query: 'test',
          results: [],
          response_time: 1.5
        })
      })

      await researchQuery('test query')

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(callBody.search_depth).toBe('advanced')
    })

    it('should set max_results to 20', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          query: 'test',
          results: [],
          response_time: 1.5
        })
      })

      await researchQuery('test query')

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(callBody.max_results).toBe(20)
    })
  })
})

