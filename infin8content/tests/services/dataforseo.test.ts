/**
 * DataForSEO Service Tests
 * 
 * Unit tests for DataForSEO API client
 * Story 3.1: Keyword Research Interface and DataForSEO Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchKeywords, getDataForSEOClient } from '@/lib/services/dataforseo'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DataForSEO Service Client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATAFORSEO_LOGIN: 'test-login',
      DATAFORSEO_PASSWORD: 'test-password',
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('getDataForSEOClient', () => {
    it('should throw error when DATAFORSEO_LOGIN is missing', () => {
      delete process.env.DATAFORSEO_LOGIN
      
      expect(() => getDataForSEOClient()).toThrow('DATAFORSEO_LOGIN environment variable is not set')
    })

    it('should throw error when DATAFORSEO_PASSWORD is missing', () => {
      delete process.env.DATAFORSEO_PASSWORD
      
      expect(() => getDataForSEOClient()).toThrow('DATAFORSEO_PASSWORD environment variable is not set')
    })

    it('should return singleton instance when credentials are set', () => {
      const client1 = getDataForSEOClient()
      const client2 = getDataForSEOClient()
      
      expect(client1).toBe(client2)
    })
  })

  describe('searchKeywords', () => {
    it('should successfully search keywords and return results', async () => {
      const mockResponse = {
        version: '0.1.20240115',
        status_code: 20000,
        status_message: 'Ok.',
        time: '0.1234 sec.',
        cost: 0.001,
        result_count: 1,
        tasks: [{
          id: 'test-task-id',
          status_code: 20000,
          status_message: 'Ok.',
          time: '0.1234 sec.',
          cost: 0.001,
          result_count: 1,
          path: ['v3', 'keywords_data', 'google_ads', 'search_volume', 'live'],
          data: {
            api: 'keywords_data',
            function: 'google_ads',
            se: 'google',
            keywords: ['best running shoes'],
            location_code: 2840,
            language_code: 'en',
          },
          result: [{
            keyword: 'best running shoes',
            location_code: 2840,
            language_code: 'en',
            search_volume: 12000,
            competition: 0.75,
            competition_index: 75,
            cpc: 2.5,
            monthly_searches: [
              { year: 2024, month: 1, search_volume: 11000 },
              { year: 2024, month: 2, search_volume: 12000 },
            ],
            keyword_info: {
              se_type: 'google',
              last_updated_time: '2024-01-15 10:00:00 +00:00',
              competition: 'HIGH',
              cpc: 2.5,
              search_volume: 12000,
              categories: [1234, 5678],
              monthly_searches: [
                { year: 2024, month: 1, search_volume: 11000 },
                { year: 2024, month: 2, search_volume: 12000 },
              ],
            },
          }],
        }],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await searchKeywords({
        keywords: ['best running shoes'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify([{
            keywords: ['best running shoes'],
            location_code: 2840,
            language_code: 'en',
          }]),
        })
      )

      expect(result).toEqual({
        success: true,
        data: {
          keyword: 'best running shoes',
          searchVolume: 12000,
          keywordDifficulty: 75,
          trend: [11000, 12000],
          cpc: 2.5,
          competition: 'High',
        },
        cost: 0.001,
      })
    })

    it('should retry on network error with exponential backoff', async () => {
      // First two attempts fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status_code: 20000,
            tasks: [{
              status_code: 20000,
              result: [{
                keyword: 'test keyword',
                search_volume: 1000,
                competition_index: 50,
                cpc: 1.0,
                monthly_searches: [{ year: 2024, month: 1, search_volume: 1000 }],
                keyword_info: {
                  competition: 'MEDIUM',
                },
              }],
            }],
          }),
        })

      const result = await searchKeywords({
        keywords: ['test keyword'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result.success).toBe(true)
    })

    it('should handle API error response (40000 - Bad Request)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 40000,
          status_message: 'Bad request',
        }),
      })

      await expect(
        searchKeywords({
          keywords: [''],
          locationCode: 2840,
          languageCode: 'en',
        })
      ).rejects.toThrow('DataForSEO API error: Bad request')
    })

    it('should handle API error response (40100 - Unauthorized)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 40100,
          status_message: 'Unauthorized',
        }),
      })

      await expect(
        searchKeywords({
          keywords: ['test'],
          locationCode: 2840,
          languageCode: 'en',
        })
      ).rejects.toThrow('DataForSEO API error: Unauthorized')
    })

    it('should handle API error response (40200 - Payment Required)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 40200,
          status_message: 'Payment required',
        }),
      })

      await expect(
        searchKeywords({
          keywords: ['test'],
          locationCode: 2840,
          languageCode: 'en',
        })
      ).rejects.toThrow('DataForSEO API error: Payment required')
    })

    it('should handle API error response (42900 - Rate Limit)', async () => {
      // Mock rate limit response, then success on retry
      const mockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'Retry-After') return '1' // 1 second retry
          return null
        }),
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders,
          json: async () => ({
            status_code: 42900,
            status_message: 'Rate limit exceeded',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: mockHeaders,
          json: async () => ({
            status_code: 20000,
            tasks: [{
              status_code: 20000,
              result: [{
                keyword: 'test',
                search_volume: 1000,
                competition_index: 50,
                cpc: 1.0,
                monthly_searches: [{ year: 2024, month: 1, search_volume: 1000 }],
                keyword_info: {
                  competition: 'MEDIUM',
                },
              }],
            }],
          }),
        })

      const result = await searchKeywords({
        keywords: ['test'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(true)
    })

    it('should map competition level correctly (Low)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 20000,
          tasks: [{
            status_code: 20000,
            result: [{
              keyword: 'test',
              search_volume: 100,
              competition_index: 25,
              cpc: 0.5,
              monthly_searches: [{ year: 2024, month: 1, search_volume: 100 }],
              keyword_info: {
                competition: 'LOW',
              },
            }],
          }],
        }),
      })

      const result = await searchKeywords({
        keywords: ['test'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(result.data.competition).toBe('Low')
    })

    it('should map competition level correctly (Medium)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 20000,
          tasks: [{
            status_code: 20000,
            result: [{
              keyword: 'test',
              search_volume: 1000,
              competition_index: 50,
              cpc: 1.0,
              monthly_searches: [{ year: 2024, month: 1, search_volume: 1000 }],
              keyword_info: {
                competition: 'MEDIUM',
              },
            }],
          }],
        }),
      })

      const result = await searchKeywords({
        keywords: ['test'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(result.data.competition).toBe('Medium')
    })

    it('should handle missing optional fields gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 20000,
          tasks: [{
            status_code: 20000,
            result: [{
              keyword: 'test',
              search_volume: 1000,
              competition_index: 50,
              monthly_searches: [{ year: 2024, month: 1, search_volume: 1000 }],
              keyword_info: {
                competition: 'MEDIUM',
              },
            }],
          }],
        }),
      })

      const result = await searchKeywords({
        keywords: ['test'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(result.data.cpc).toBeUndefined()
      expect(result.data.competition).toBe('Medium')
    })

    it('should extract trend data from monthly_searches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status_code: 20000,
          tasks: [{
            status_code: 20000,
            result: [{
              keyword: 'test',
              search_volume: 1000,
              competition_index: 50,
              cpc: 1.0,
              monthly_searches: [
                { year: 2024, month: 1, search_volume: 800 },
                { year: 2024, month: 2, search_volume: 900 },
                { year: 2024, month: 3, search_volume: 1000 },
              ],
              keyword_info: {
                competition: 'MEDIUM',
              },
            }],
          }],
        }),
      })

      const result = await searchKeywords({
        keywords: ['test'],
        locationCode: 2840,
        languageCode: 'en',
      })

      expect(result.data.trend).toEqual([800, 900, 1000])
    })
  })

  describe('keywords_for_site endpoint (Story 34.2)', () => {
    it('should validate keywords_for_site endpoint response structure', async () => {
      const mockResponse = {
        status_code: 20000,
        status_message: 'Ok.',
        tasks: [{
          id: 'test-task-id',
          status_code: 20000,
          status_message: 'Ok.',
          result: [
            {
              keyword: 'example keyword 1',
              search_volume: 5000,
              competition_index: 45,
              keyword_difficulty: 42,
              cpc: 1.5
            },
            {
              keyword: 'example keyword 2',
              search_volume: 3000,
              competition_index: 35,
              keyword_difficulty: 38,
              cpc: 1.2
            },
            {
              keyword: 'example keyword 3',
              search_volume: 2000,
              competition_index: 30,
              keyword_difficulty: 35,
              cpc: 0.9
            }
          ]
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')
      const response = await fetch(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live',
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            target: 'example.com',
            location_code: 2840,
            language_code: 'en',
            limit: 3
          }]),
        }
      )

      expect(response.ok).toBe(true)
      const data = await response.json()

      expect(data.status_code).toBe(20000)
      expect(data.tasks).toBeDefined()
      expect(data.tasks[0].result.length).toBe(3)
      expect(data.tasks[0].result[0]).toHaveProperty('keyword')
      expect(data.tasks[0].result[0]).toHaveProperty('search_volume')
      expect(data.tasks[0].result[0]).toHaveProperty('competition_index')
    })

    it('should handle keywords_for_site rate limiting with Retry-After', async () => {
      const mockHeaders = {
        get: vi.fn((header: string) => {
          if (header === 'Retry-After') return '2'
          return null
        }),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        json: async () => ({
          status_code: 42900,
          status_message: 'Rate limit exceeded',
        }),
      })

      const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')
      const response = await fetch(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/keywords_for_site/live',
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{
            target: 'example.com',
            location_code: 2840,
            language_code: 'en',
          }]),
        }
      )

      const data = await response.json()
      expect(data.status_code).toBe(42900)
      expect(response.headers.get('Retry-After')).toBe('2')
    })
  })
})

