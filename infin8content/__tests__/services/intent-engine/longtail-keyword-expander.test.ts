/**
 * Unit Tests for Long-Tail Keyword Expander Service (Production-Grade)
 * Tests the public API contract: expandSeedKeywordsToLongtails(workflowId)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock supabase server
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

// Mock retry utils
vi.mock('@/lib/services/intent-engine/retry-utils', () => ({
  retryWithPolicy: vi.fn()
}))

// Mock analytics
vi.mock('@/lib/services/analytics/event-emitter', () => ({
  emitAnalyticsEvent: vi.fn()
}))

// Mock geo config
vi.mock('@/lib/config/dataforseo-geo', () => ({
  resolveLocationCode: vi.fn((region?: string) => region === 'Germany' ? 2276 : 2840),
  resolveLanguageCode: vi.fn((lang?: string) => lang || 'en')
}))

// Mock fetch for DataForSEO API calls
const mockFetch = vi.fn()
;(global as any).fetch = mockFetch

// Import after mocking
import { expandSeedKeywordsToLongtails } from '@/lib/services/intent-engine/longtail-keyword-expander'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { retryWithPolicy } from '@/lib/services/intent-engine/retry-utils'
import { emitAnalyticsEvent } from '@/lib/services/analytics/event-emitter'

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient)
const mockRetryWithPolicy = vi.mocked(retryWithPolicy)
const mockEmitAnalyticsEvent = vi.mocked(emitAnalyticsEvent)

describe('expandSeedKeywordsToLongtails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default Supabase mock setup
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn()
    }
    
    mockCreateServiceRoleClient.mockReturnValue(mockSupabase as any)
    
    // Default retry policy success
    mockRetryWithPolicy.mockImplementation(async (fn) => await fn())
  })

  it('expands seeds successfully with all sources', async () => {
    // Mock workflow query
    const mockSupabase = mockCreateServiceRoleClient() as any
    mockSupabase.single.mockResolvedValueOnce({ organization_id: 'org-123' })
    
    // Mock seeds query
    mockSupabase.single.mockResolvedValueOnce([
      {
        id: 'seed-1',
        keyword: 'seo tools',
        organization_id: 'org-123',
        competitor_url_id: 'comp-1'
      }
    ])
    
    // Mock organization query
    mockSupabase.single.mockResolvedValueOnce({
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en'
      }
    })
    
    // Mock bulk insert
    mockSupabase.insert.mockResolvedValueOnce({ error: null })
    
    // Mock DataForSEO API responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('related_keywords')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status_code: 20000,
            status_message: 'OK',
            tasks: [{
              status_code: 20000,
              status_message: 'OK',
              result: [{
                items: [
                  {
                    keyword_data: {
                      keyword: 'best seo tools',
                      keyword_info: {
                        search_volume: 1200,
                        competition: 45,
                        cpc: 2.50
                      },
                      keyword_properties: {
                        keyword_difficulty: 50
                      }
                    }
                  }
                ]
              }]
            }]
          })
        })
      }
      if (url.includes('keyword_suggestions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status_code: 20000,
            status_message: 'OK',
            tasks: [{
              status_code: 20000,
              status_message: 'OK',
              result: [{
                items: [
                  {
                    keyword_data: {
                      keyword: 'seo software',
                      keyword_info: {
                        search_volume: 800,
                        competition: 30,
                        cpc: 1.80
                      },
                      keyword_properties: {
                        keyword_difficulty: 40
                      }
                    }
                  }
                ]
              }]
            }]
          })
        })
      }
      if (url.includes('keyword_ideas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status_code: 20000,
            status_message: 'OK',
            tasks: [{
              status_code: 20000,
              status_message: 'OK',
              result: [{
                items: [
                  {
                    keyword_data: {
                      keyword: 'free seo tools',
                      keyword_info: {
                        search_volume: 1500,
                        competition: 60,
                        cpc: 2.20
                      },
                      keyword_properties: {
                        keyword_difficulty: 55
                      }
                    }
                  }
                ]
              }]
            }]
          })
        })
      }
      if (url.includes('autocomplete')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status_code: 20000,
            status_message: 'OK',
            tasks: [{
              status_code: 20000,
              status_message: 'OK',
              result: [{
                items: [
                  { keyword: 'seo tools free' },
                  { keyword: 'seo tools list' },
                  { keyword: 'top seo tools' }
                ]
              }]
            }]
          })
        })
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status_code: 20000, status_message: 'OK', tasks: [] })
      })
    })

    const result = await expandSeedKeywordsToLongtails('workflow-123')

    expect(result.seeds_processed).toBe(1)
    expect(result.total_longtails_created).toBeGreaterThan(0)
    expect(result.results).toHaveLength(1)
    expect(result.workflow_id).toBe('workflow-123')
    
    // Verify analytics event was emitted
    expect(mockEmitAnalyticsEvent).toHaveBeenCalledWith({
      event_type: 'longtail_keywords_expanded',
      timestamp: expect.any(String),
      organization_id: 'org-123',
      workflow_id: 'workflow-123',
      seed_keyword: 'seo tools',
      longtails_created: expect.any(Number)
    })
  })

  it('handles no seeds found gracefully', async () => {
    // Mock workflow query
    const mockSupabase = mockCreateServiceRoleClient()
    mockSupabase.single.mockResolvedValueOnce({ organization_id: 'org-123' })
    
    // Mock empty seeds query
    mockSupabase.single.mockResolvedValueOnce([])

    const result = await expandSeedKeywordsToLongtails('workflow-123')

    expect(result.seeds_processed).toBe(0)
    expect(result.total_longtails_created).toBe(0)
    expect(result.results).toHaveLength(0)
    
    // Should not call analytics for no seeds
    expect(mockEmitAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('handles partial source failures gracefully', async () => {
    // Mock workflow query
    const mockSupabase = mockCreateServiceRoleClient()
    mockSupabase.single.mockResolvedValueOnce({ organization_id: 'org-123' })
    
    // Mock seeds query
    mockSupabase.single.mockResolvedValueOnce([
      {
        id: 'seed-1',
        keyword: 'seo tools',
        organization_id: 'org-123',
        competitor_url_id: 'comp-1'
      }
    ])
    
    // Mock organization query
    mockSupabase.single.mockResolvedValueOnce({
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en'
      }
    })
    
    // Mock bulk insert
    mockSupabase.insert.mockResolvedValueOnce({ error: null })
    
    // Mock DataForSEO with some failures
    mockFetch.mockImplementation((url) => {
      if (url.includes('related_keywords')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status_code: 20000,
            status_message: 'OK',
            tasks: [{
              status_code: 20000,
              status_message: 'OK',
              result: [{
                items: [
                  {
                    keyword_data: {
                      keyword: 'best seo tools',
                      keyword_info: {
                        search_volume: 1200,
                        competition: 45,
                        cpc: 2.50
                      },
                      keyword_properties: {
                        keyword_difficulty: 50
                      }
                    }
                  }
                ]
              }]
            }]
          })
        })
      }
      // Other sources fail
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
    })

    const result = await expandSeedKeywordsToLongtails('workflow-123')

    expect(result.seeds_processed).toBe(1)
    expect(result.total_longtails_created).toBe(1) // Only from related keywords
    expect(result.results[0].errors).toHaveLength(3) // 3 failed sources
  })

  it('handles workflow not found error', async () => {
    // Mock workflow query failure
    const mockSupabase = mockCreateServiceRoleClient()
    mockSupabase.single.mockResolvedValueOnce(null)

    await expect(expandSeedKeywordsToLongtails('invalid-workflow')).rejects.toThrow('Workflow not found')
  })

  it('handles duplicate key errors in bulk insert', async () => {
    // Mock workflow query
    const mockSupabase = mockCreateServiceRoleClient()
    mockSupabase.single.mockResolvedValueOnce({ organization_id: 'org-123' })
    
    // Mock seeds query
    mockSupabase.single.mockResolvedValueOnce([
      {
        id: 'seed-1',
        keyword: 'seo tools',
        organization_id: 'org-123',
        competitor_url_id: 'comp-1'
      }
    ])
    
    // Mock organization query
    mockSupabase.single.mockResolvedValueOnce({
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en'
      }
    })
    
    // Mock bulk insert with duplicate error
    mockSupabase.insert.mockResolvedValueOnce({ 
      error: { code: '23505', message: 'duplicate key' }
    })

    // Mock successful DataForSEO response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 20000,
          status_message: 'OK',
          result: [{
            items: [
              {
                keyword_data: {
                  keyword: 'best seo tools',
                  keyword_info: {
                    search_volume: 1200,
                    competition: 45,
                    cpc: 2.50
                  },
                  keyword_properties: {
                    keyword_difficulty: 50
                  }
                }
              }
            ]
          }]
        }]
      })
    })

    // Should not throw on duplicate key errors
    const result = await expandSeedKeywordsToLongtails('workflow-123')

    expect(result.seeds_processed).toBe(1)
    expect(result.total_longtails_created).toBe(1)
  })

  it('uses correct geo settings from organization', async () => {
    // Mock workflow query
    const mockSupabase = mockCreateServiceRoleClient()
    mockSupabase.single.mockResolvedValueOnce({ organization_id: 'org-123' })
    
    // Mock seeds query
    mockSupabase.single.mockResolvedValueOnce([
      {
        id: 'seed-1',
        keyword: 'seo tools',
        organization_id: 'org-123',
        competitor_url_id: 'comp-1'
      }
    ])
    
    // Mock organization query with German settings
    mockSupabase.single.mockResolvedValueOnce({
      keyword_settings: {
        target_region: 'Germany',
        language_code: 'de'
      }
    })
    
    // Mock bulk insert
    mockSupabase.insert.mockResolvedValueOnce({ error: null })
    
    // Mock DataForSEO response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status_code: 20000,
        status_message: 'OK',
        tasks: [{
          status_code: 20000,
          status_message: 'OK',
          result: [{
            items: [
              {
                keyword_data: {
                  keyword: 'seo tools deutsch',
                  keyword_info: {
                    search_volume: 800,
                    competition: 40,
                    cpc: 1.50
                  },
                  keyword_properties: {
                    keyword_difficulty: 45
                  }
                }
              }
            ]
          }]
        }]
      })
    })

    await expandSeedKeywordsToLongtails('workflow-123')

    // Verify DataForSEO was called with German location code (2276)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('location_code=2276'),
      expect.any(Object)
    )
  })
})
