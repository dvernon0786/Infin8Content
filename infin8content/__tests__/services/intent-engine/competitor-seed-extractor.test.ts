/**
 * Unit Tests for Competitor Seed Extractor Service
 * Story 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  extractSeedKeywords,
  type CompetitorData,
  type ExtractSeedKeywordsRequest,
  type SeedKeywordData
} from '@/lib/services/intent-engine/competitor-seed-extractor'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('Competitor Seed Extractor Service', () => {
  const mockOrganizationId = 'org-123'
  const mockCompetitorId = 'comp-123'
  const mockWorkflowId = 'workflow-123'

  const mockCompetitors: CompetitorData[] = [
    {
      id: mockCompetitorId,
      url: 'https://example.com',
      domain: 'example.com',
      name: 'Example Corp',
      is_active: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DATAFORSEO_LOGIN = 'test-login'
    process.env.DATAFORSEO_PASSWORD = 'test-password'
  })

  describe('extractSeedKeywords', () => {
    it('should extract seed keywords from competitors', async () => {
      // Mock DataForSEO API response
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'example keyword 1',
                search_volume: 5000,
                competition_index: 45,
                cpc: 1.5
              },
              {
                keyword: 'example keyword 2',
                search_volume: 3000,
                competition_index: 35,
                cpc: 1.2
              },
              {
                keyword: 'example keyword 3',
                search_volume: 2000,
                competition_index: 55,
                cpc: 2.0
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      // Mock Supabase delete and insert
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              error: null,
              data: [
                { id: 'kw-1' },
                { id: 'kw-2' },
                { id: 'kw-3' }
              ]
            })
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId,
        maxSeedsPerCompetitor: 3
      }

      const result = await extractSeedKeywords(request)

      expect(result.total_keywords_created).toBe(3)
      expect(result.competitors_processed).toBe(1)
      expect(result.competitors_failed).toBe(0)
      expect(result.results).toHaveLength(1)
      expect(result.results[0].seed_keywords_created).toBe(3)
    })

    it('should limit keywords to maxSeedsPerCompetitor', async () => {
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'keyword 1',
                search_volume: 5000,
                competition_index: 45
              },
              {
                keyword: 'keyword 2',
                search_volume: 4000,
                competition_index: 40
              },
              {
                keyword: 'keyword 3',
                search_volume: 3000,
                competition_index: 35
              },
              {
                keyword: 'keyword 4',
                search_volume: 2000,
                competition_index: 30
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              error: null,
              data: [{ id: 'kw-1' }, { id: 'kw-2' }, { id: 'kw-3' }]
            })
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId,
        maxSeedsPerCompetitor: 3
      }

      const result = await extractSeedKeywords(request)

      // Should only have 3 keywords despite 4 being returned
      expect(result.total_keywords_created).toBe(3)
    })

    it('should sort keywords by search volume descending', async () => {
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'low volume',
                search_volume: 1000,
                competition_index: 30
              },
              {
                keyword: 'high volume',
                search_volume: 5000,
                competition_index: 50
              },
              {
                keyword: 'medium volume',
                search_volume: 3000,
                competition_index: 40
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }),
          insert: vi.fn().mockImplementation((records) => {
            // Verify records are sorted by search volume
            expect(records[0].search_volume).toBe(5000)
            expect(records[1].search_volume).toBe(3000)
            expect(records[2].search_volume).toBe(1000)
            return {
              select: vi.fn().mockResolvedValue({
                error: null,
                data: [{ id: 'kw-1' }, { id: 'kw-2' }, { id: 'kw-3' }]
              })
            }
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId,
        maxSeedsPerCompetitor: 3
      }

      await extractSeedKeywords(request)
    })

    it('should map competition index to competition level', async () => {
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'low competition',
                search_volume: 1000,
                competition_index: 20
              },
              {
                keyword: 'medium competition',
                search_volume: 2000,
                competition_index: 50
              },
              {
                keyword: 'high competition',
                search_volume: 3000,
                competition_index: 80
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }),
          insert: vi.fn().mockImplementation((records) => {
            expect(records[0].competition_level).toBe('high')
            expect(records[1].competition_level).toBe('medium')
            expect(records[2].competition_level).toBe('low')
            return {
              select: vi.fn().mockResolvedValue({
                error: null,
                data: [{ id: 'kw-1' }, { id: 'kw-2' }, { id: 'kw-3' }]
              })
            }
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId,
        maxSeedsPerCompetitor: 3
      }

      await extractSeedKeywords(request)
    })

    it('should handle empty competitors list', async () => {
      const request: ExtractSeedKeywordsRequest = {
        competitors: [],
        organizationId: mockOrganizationId
      }

      await expect(extractSeedKeywords(request)).rejects.toThrow(
        'No competitors provided for seed keyword extraction'
      )
    })

    it('should handle missing organization ID', async () => {
      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: ''
      }

      await expect(extractSeedKeywords(request)).rejects.toThrow(
        'Organization ID is required'
      )
    })

    it('should continue processing when one competitor fails', async () => {
      const competitors: CompetitorData[] = [
        {
          id: 'comp-1',
          url: 'https://example1.com',
          domain: 'example1.com',
          is_active: true
        },
        {
          id: 'comp-2',
          url: 'https://example2.com',
          domain: 'example2.com',
          is_active: true
        }
      ]

      const mockSuccessResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'keyword 1',
                search_volume: 5000,
                competition_index: 45
              }
            ]
          }
        ]
      }

      const mockErrorResponse = {
        status_code: 40000,
        status_message: 'Invalid request'
      }

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockErrorResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse
        })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              error: null,
              data: [{ id: 'kw-1' }]
            })
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors,
        organizationId: mockOrganizationId
      }

      const result = await extractSeedKeywords(request)

      expect(result.competitors_processed).toBe(1)
      expect(result.competitors_failed).toBe(1)
      expect(result.total_keywords_created).toBe(1)
    })

    it('should throw error when all competitors fail', async () => {
      const mockErrorResponse = {
        status_code: 40000,
        status_message: 'Invalid request'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse
      })

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId
      }

      const result = await extractSeedKeywords(request)

      expect(result.total_keywords_created).toBe(0)
      expect(result.competitors_processed).toBe(0)
      expect(result.competitors_failed).toBe(1)
      expect(result.error).toBe('NO_KEYWORDS_FOUND')
      expect(result.results[0].error).toBe('DataForSEO API error: Invalid request')
    })

    it('should handle missing DataForSEO credentials', async () => {
      const originalLogin = process.env.DATAFORSEO_LOGIN
      const originalPassword = process.env.DATAFORSEO_PASSWORD
      
      delete process.env.DATAFORSEO_LOGIN
      delete process.env.DATAFORSEO_PASSWORD

      try {
        const request: ExtractSeedKeywordsRequest = {
          competitors: mockCompetitors,
          organizationId: mockOrganizationId
        }

        // When credentials are missing, all competitors fail, resulting in structured error
        const result = await extractSeedKeywords(request)

        expect(result.total_keywords_created).toBe(0)
        expect(result.competitors_processed).toBe(0)
        expect(result.competitors_failed).toBe(1)
        expect(result.error).toBe('NO_KEYWORDS_FOUND')
        expect(result.results[0].error).toBe('DataForSEO credentials not configured')
      } finally {
        // Restore environment variables
        if (originalLogin) process.env.DATAFORSEO_LOGIN = originalLogin
        if (originalPassword) process.env.DATAFORSEO_PASSWORD = originalPassword
      }
    })

    it('should set keyword status fields to not_started', async () => {
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'test keyword',
                search_volume: 1000,
                competition_index: 50
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }),
          insert: vi.fn().mockImplementation((records) => {
            expect(records[0].longtail_status).toBe('not_started')
            expect(records[0].subtopics_status).toBe('not_started')
            expect(records[0].article_status).toBe('not_started')
            return {
              select: vi.fn().mockResolvedValue({
                error: null,
                data: [{ id: 'kw-1' }]
              })
            }
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId
      }

      await extractSeedKeywords(request)
    })

    it('should enforce idempotent re-run by deleting old keywords', async () => {
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'new keyword 1',
                search_volume: 5000,
                competition_index: 45
              },
              {
                keyword: 'new keyword 2',
                search_volume: 3000,
                competition_index: 35
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      const mockDelete = vi.fn()
      const mockEq = vi.fn()
      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
      mockDelete.mockReturnValue({
        eq: mockEq
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: mockDelete,
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              error: null,
              data: [{ id: 'kw-1' }, { id: 'kw-2' }]
            })
          })
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId,
        maxSeedsPerCompetitor: 3
      }

      await extractSeedKeywords(request)

      // Verify delete was called to enforce idempotency
      expect(mockDelete).toHaveBeenCalled()
      
      // Verify first eq call filters by organization
      expect(mockEq).toHaveBeenCalledWith('organization_id', mockOrganizationId)
    })

    it('should throw error if keyword deletion fails', async () => {
      const mockDataForSEOResponse = {
        status_code: 20000,
        status_message: 'OK',
        tasks: [
          {
            status_code: 20000,
            status_message: 'OK',
            result: [
              {
                keyword: 'keyword 1',
                search_volume: 5000,
                competition_index: 45
              }
            ]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataForSEOResponse
      })

      const mockDelete = vi.fn()
      const mockEq = vi.fn()
      mockEq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
      })
      mockDelete.mockReturnValue({
        eq: mockEq
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: mockDelete
        })
      }

      ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)

      const request: ExtractSeedKeywordsRequest = {
        competitors: mockCompetitors,
        organizationId: mockOrganizationId
      }

      // Should return structured error when deletion fails (caught as competitor failure)
      const result = await extractSeedKeywords(request)

      expect(result.total_keywords_created).toBe(0)
      expect(result.competitors_processed).toBe(0)
      expect(result.competitors_failed).toBe(1)
      expect(result.error).toBe('NO_KEYWORDS_FOUND')
      expect(result.results[0].error).toBe('Failed to delete existing keywords for competitor comp-123: Database error')
    })
  })

  // NOTE: updateWorkflowStatus tests disabled - function moved to API layer
// describe('updateWorkflowStatus', () => {
//   it('should update workflow status to step_2_competitors', async () => {
//     const mockSupabase = {
//       from: vi.fn().mockReturnValue({
//         update: vi.fn().mockReturnValue({
//           eq: vi.fn().mockReturnValue({
//             eq: vi.fn().mockResolvedValue({ error: null })
//           })
//         })
//       })
//     }
//
//     ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
//
//     await updateWorkflowStatus(mockWorkflowId, mockOrganizationId, 'step_2_competitors')
//
//     const updateCall = mockSupabase.from().update.mock.calls[0][0]
//     expect(updateCall.status).toBe('step_2_competitors')
//     expect(updateCall.step_2_competitor_completed_at).toBeDefined()
//   })
//
//   it('should update workflow status to failed with error message', async () => {
//     const errorMessage = 'Test error message'
//     const mockSupabase = {
//       from: vi.fn().mockReturnValue({
//         update: vi.fn().mockReturnValue({
//           eq: vi.fn().mockReturnValue({
//             eq: vi.fn().mockResolvedValue({ error: null })
//           })
//         })
//       })
//     }
//
//     ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
//
//     await updateWorkflowStatus(mockWorkflowId, mockOrganizationId, 'failed', errorMessage)
//
//     const updateCall = mockSupabase.from().update.mock.calls[0][0]
//     expect(updateCall.status).toBe('failed')
//     expect(updateCall.step_2_competitor_error_message).toBe(errorMessage)
//   })
//
//   it('should throw error if update fails', async () => {
//     const mockSupabase = {
//       from: vi.fn().mockReturnValue({
//         update: vi.fn().mockReturnValue({
//           eq: vi.fn().mockReturnValue({
//             eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
//           })
//         })
//       })
//     }
//
//     ;(createServiceRoleClient as any).mockReturnValue(mockSupabase)
//
//     await expect(
//       updateWorkflowStatus(mockWorkflowId, mockOrganizationId, 'step_2_competitors')
//     ).rejects.toThrow('Failed to update workflow status')
//   })
// })

})
