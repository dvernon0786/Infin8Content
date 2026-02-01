/**
 * Story 36.2: Keyword Clusterer Service Tests
 * 
 * Tests for hub-and-spoke keyword clustering functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KeywordClusterer } from '../../../lib/services/intent-engine/keyword-clusterer'
import { createServiceRoleClient } from '../../../lib/supabase/server'

// Mock dependencies
vi.mock('../../../lib/supabase/server')
vi.mock('../../lib/services/analytics/event-emitter')

describe('KeywordClusterer', () => {
  let clusterer: KeywordClusterer
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [
                {
                  id: 'kw1',
                  organization_id: 'test-org',
                  keyword: 'content marketing',
                  search_volume: 1000,
                  competition_level: 'medium' as const,
                  competition_index: 50,
                  keyword_difficulty: 40,
                  longtail_status: 'complete',
                  subtopics_status: 'not_started',
                  article_status: 'not_started',
                  created_at: '2026-02-01T00:00:00Z',
                  updated_at: '2026-02-01T00:00:00Z'
                },
                {
                  id: 'kw2',
                  organization_id: 'test-org',
                  keyword: 'blog content strategy',
                  search_volume: 500,
                  competition_level: 'low' as const,
                  competition_index: 30,
                  keyword_difficulty: 25,
                  longtail_status: 'complete',
                  subtopics_status: 'not_started',
                  article_status: 'not_started',
                  created_at: '2026-02-01T00:00:00Z',
                  updated_at: '2026-02-01T00:00:00Z'
                },
                {
                  id: 'kw3',
                  organization_id: 'test-org',
                  keyword: 'social media marketing',
                  search_volume: 800,
                  competition_level: 'high' as const,
                  competition_index: 70,
                  keyword_difficulty: 60,
                  longtail_status: 'complete',
                  subtopics_status: 'not_started',
                  article_status: 'not_started',
                  created_at: '2026-02-01T00:00:00Z',
                  updated_at: '2026-02-01T00:00:00Z'
                }
              ],
              error: null
            }))
          }))
        }))
      })),
      rpc: vi.fn()
    }
    
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    clusterer = new KeywordClusterer()
  })

  describe('Hub Identification', () => {
    it('should select hub keyword with highest search volume', async () => {
      const keywords = [
        { 
          id: 'kw1', 
          organization_id: 'test-org',
          keyword: 'content marketing', 
          search_volume: 1000,
          competition_level: 'medium' as const,
          competition_index: 50,
          keyword_difficulty: 40,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw2', 
          organization_id: 'test-org',
          keyword: 'blog strategy', 
          search_volume: 500,
          competition_level: 'low' as const,
          competition_index: 30,
          keyword_difficulty: 25,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw3', 
          organization_id: 'test-org',
          keyword: 'marketing tactics', 
          search_volume: 300,
          competition_level: 'low' as const,
          competition_index: 20,
          keyword_difficulty: 15,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        }
      ]

      const hub = clusterer.identifyHub(keywords)
      
      expect(hub).toEqual({
        id: 'kw1',
        organization_id: 'test-org',
        keyword: 'content marketing', 
        search_volume: 1000,
        competition_level: 'medium',
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'complete',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      })
    })

    it('should handle empty keyword list', () => {
      const keywords: any[] = []
      
      expect(() => clusterer.identifyHub(keywords)).toThrow('No keywords available for hub identification')
    })
  })

  describe('Spoke Assignment', () => {
    it('should assign spokes to hub based on semantic similarity', async () => {
      const hub = { 
        id: 'kw1', 
        organization_id: 'test-org',
        keyword: 'content marketing', 
        search_volume: 1000,
        competition_level: 'medium' as const,
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'complete',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      }
      const spokes = [
        { 
          id: 'kw2', 
          organization_id: 'test-org',
          keyword: 'blog content strategy', 
          search_volume: 500,
          competition_level: 'low' as const,
          competition_index: 30,
          keyword_difficulty: 25,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw3', 
          organization_id: 'test-org',
          keyword: 'social media marketing', 
          search_volume: 800,
          competition_level: 'high' as const,
          competition_index: 70,
          keyword_difficulty: 60,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw4', 
          organization_id: 'test-org',
          keyword: 'cooking recipes', 
          search_volume: 600,
          competition_level: 'medium' as const,
          competition_index: 55,
          keyword_difficulty: 45,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        }
      ]

      const assignments = await clusterer.assignSpokesToHub(hub, spokes, 0.2)

      expect(assignments.length).toBeGreaterThan(0)
      expect(assignments[0].spoke_keyword_id).toBe('kw2') // 'blog content strategy' - highest similarity
    })

    it('should respect maximum spokes per hub limit', async () => {
      const hub = { 
        id: 'kw1', 
        organization_id: 'test-org',
        keyword: 'content marketing', 
        search_volume: 1000,
        competition_level: 'medium' as const,
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'complete',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z'
      }
      const spokes = [
        { 
          id: 'kw2', 
          organization_id: 'test-org',
          keyword: 'blog strategy', 
          search_volume: 500,
          competition_level: 'low' as const,
          competition_index: 30,
          keyword_difficulty: 25,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw3', 
          organization_id: 'test-org',
          keyword: 'content creation', 
          search_volume: 400,
          competition_level: 'low' as const,
          competition_index: 25,
          keyword_difficulty: 20,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw4', 
          organization_id: 'test-org',
          keyword: 'marketing content', 
          search_volume: 300,
          competition_level: 'low' as const,
          competition_index: 20,
          keyword_difficulty: 15,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw5', 
          organization_id: 'test-org',
          keyword: 'content strategy', 
          search_volume: 200,
          competition_level: 'low' as const,
          competition_index: 15,
          keyword_difficulty: 10,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        },
        { 
          id: 'kw6', 
          organization_id: 'test-org',
          keyword: 'digital content', 
          search_volume: 100,
          competition_level: 'low' as const,
          competition_index: 10,
          keyword_difficulty: 5,
          longtail_status: 'complete',
          subtopics_status: 'not_started',
          article_status: 'not_started',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z'
        }
      ]

      const assignments = await clusterer.assignSpokesToHub(hub, spokes, 0.1, 3)

      expect(assignments).toHaveLength(3)
      const assignedIds = assignments.map((a: any) => a.spoke_keyword_id)
      expect(assignedIds).toContain('kw3')
      expect(assignedIds).toContain('kw4')
      expect(assignedIds).toContain('kw5')
    })
  })

  describe('Clustering Process', () => {
    it('should cluster keywords into hub-and-spoke structure', async () => {
      const workflowId = 'test-workflow-id'
      
      // Mock workflow query
      const mockWorkflowQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { organization_id: 'test-org' },
              error: null
            }))
          }))
        }))
      }
      
      // Mock keywords query
      const mockKeywordsQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [
                  { id: 'kw1', keyword: 'content marketing', search_volume: 1000 },
                  { id: 'kw2', keyword: 'content strategy', search_volume: 800 },
                  { id: 'kw3', keyword: 'content creation', search_volume: 600 },
                  { id: 'kw4', keyword: 'marketing content', search_volume: 400 },
                  { id: 'kw5', keyword: 'blog content', search_volume: 300 },
                  { id: 'kw6', keyword: 'digital marketing', search_volume: 500 }
                ],
                error: null
              }))
            }))
          }))
        }))
      }
      
      // Mock topic_clusters operations
      const mockClustersQuery = {
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null }))
        })),
        insert: vi.fn(() => ({ error: null }))
      }
      
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'intent_workflows') {
          return mockWorkflowQuery
        }
        if (table === 'keywords') {
          return mockKeywordsQuery
        }
        if (table === 'topic_clusters') {
          return mockClustersQuery
        }
        return {
          select: vi.fn(),
          eq: vi.fn(),
          order: vi.fn(),
          delete: vi.fn(),
          insert: vi.fn()
        }
      })

      const result = await clusterer.clusterKeywords(workflowId, {
        similarityThreshold: 0.1,
        maxSpokesPerHub: 8
      })

      expect(result.cluster_count).toBeGreaterThan(0)
      expect(result.keywords_clustered).toBe(6)
      expect(result.clusters).toBeDefined()
    }, 10000)
  })
})
