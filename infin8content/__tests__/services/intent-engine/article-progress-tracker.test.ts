/**
 * Unit Tests for Article Progress Tracker Service
 * Story 38.2: Track Article Generation Progress
 */

import { 
  getWorkflowArticleProgress,
  getArticleProgress,
  calculateEstimatedCompletion,
  formatProgressResponse,
  validateWorkflowAccess
} from '@/lib/services/intent-engine/article-progress-tracker'

import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Supabase client
const mockSupabaseAdmin = {
  from: vi.fn(),
}

// Mock getCurrentUser
const mockGetCurrentUser = vi.fn()

// Mock factory for creating fresh Supabase mocks
function createSupabaseMock(result: any, error: any = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: result, error }))
        }))
      }))
    }))
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => mockSupabaseAdmin
}))

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: () => mockGetCurrentUser()
}))

describe('Article Progress Tracker Service', () => {
  // No global beforeEach - each test creates its own mocks
  
  describe('validateWorkflowAccess', () => {
    it('should return true when user owns the workflow', async () => {
      // Mock workflow query result
      const workflowResult = { organization_id: 'org-123' }
      const userResult = { org_id: 'org-123' }
      
      // Create fresh mocks for this test
      const workflowSupabase = createSupabaseMock(workflowResult)
      const userSupabase = createSupabaseMock(userResult)
      
      // Mock the first call (workflow) and second call (user)
      let callCount = 0
      vi.mocked(mockSupabaseAdmin.from).mockImplementation(() => {
        callCount++
        return callCount === 1 ? workflowSupabase.from() : userSupabase.from()
      })

      const result = await validateWorkflowAccess('user-123', 'workflow-123')
      
      expect(result).toBe(true)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledTimes(2)
    })

    it('should return false when workflow does not exist', async () => {
      const mockUser = { id: 'user-123', org_id: 'org-123' }
      mockGetCurrentUser.mockResolvedValue(mockUser)

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found' }
        })
      }
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(mockQuery)

      const result = await validateWorkflowAccess('user-123', 'workflow-123')
      
      expect(result).toBe(false)
    })

    it('should return false when user does not own the workflow', async () => {
      const mockUser = { id: 'user-123', org_id: 'org-123' }
      mockGetCurrentUser.mockResolvedValue(mockUser)

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { organization_id: 'org-456' },
          error: null
        })
      }
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(mockQuery)

      const result = await validateWorkflowAccess('user-123', 'workflow-123')
      
      expect(result).toBe(false)
    })
  })

  describe('getArticleProgress', () => {
    it('should return article progress data', async () => {
      const mockProgressData = {
        id: 'progress-123',
        article_id: 'article-123',
        status: 'generating',
        progress_percentage: 45.5,
        current_section: 2,
        total_sections: 5,
        current_stage: 'writing',
        estimated_time_remaining: 180,
        actual_time_spent: 120,
        word_count: 250,
        error_message: null,
        created_at: '2026-02-03T12:00:00Z',
        updated_at: '2026-02-03T12:02:00Z'
      }

      // Create fresh mock for this test
      const supabaseMock = createSupabaseMock(mockProgressData)
      vi.mocked(mockSupabaseAdmin.from).mockReturnValue(supabaseMock.from())

      const result = await getArticleProgress('article-123')
      
      expect(result).toEqual(mockProgressData)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('article_progress')
    })

    it('should return null when article progress not found', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found' }
        })
      }
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(mockQuery)

      const result = await getArticleProgress('article-123')
      
      expect(result).toBeNull()
    })
  })

  describe('calculateEstimatedCompletion', () => {
    it('should calculate estimated completion time for in-progress article', () => {
      const article = {
        status: 'generating',
        progress_percentage: 40,
        current_section: 2,
        total_sections: 5,
        actual_time_spent: 120, // 2 minutes
        created_at: '2026-02-03T12:00:00Z',
        updated_at: '2026-02-03T12:02:00Z'
      }

      const result = calculateEstimatedCompletion(article)
      
      // 60% remaining * (120s / 40%) = 180s remaining from now
      expect(result).toBeInstanceOf(Date)
      const expectedTime = Date.now() + 180000 // 180 seconds from now
      expect(Math.abs(result.getTime() - expectedTime)).toBeLessThan(1000) // Within 1 second
    })

    it('should return null for completed articles', () => {
      const article = {
        status: 'completed',
        progress_percentage: 100,
        current_section: 5,
        total_sections: 5,
        actual_time_spent: 300,
        created_at: '2026-02-03T12:00:00Z',
        updated_at: '2026-02-03T12:05:00Z'
      }

      const result = calculateEstimatedCompletion(article)
      
      expect(result).toBeNull()
    })

    it('should return null for failed articles', () => {
      const article = {
        status: 'failed',
        progress_percentage: 30,
        current_section: 2,
        total_sections: 5,
        actual_time_spent: 90,
        created_at: '2026-02-03T12:00:00Z',
        updated_at: '2026-02-03T12:01:30Z'
      }

      const result = calculateEstimatedCompletion(article)
      
      expect(result).toBeNull()
    })

    it('should handle zero progress', () => {
      const article = {
        status: 'generating',
        progress_percentage: 0,
        current_section: 1,
        total_sections: 5,
        actual_time_spent: 30,
        created_at: '2026-02-03T12:00:00Z',
        updated_at: '2026-02-03T12:00:30Z'
      }

      const result = calculateEstimatedCompletion(article)
      
      // Should use average time per section (60s per section * 5 remaining sections)
      expect(result).toBeInstanceOf(Date)
      const expectedTime = Date.now() + 300000 // 5 minutes from now
      expect(Math.abs(result.getTime() - expectedTime)).toBeLessThan(1000)
    })
  })

  describe('formatProgressResponse', () => {
    it('should format response with summary statistics', () => {
      const articles = [
        {
          article_id: 'article-1',
          subtopic_id: 'subtopic-1',
          status: 'completed',
          progress_percent: 100,
          sections_completed: 5,
          sections_total: 5,
          current_section: 'completed',
          estimated_completion_time: null,
          created_at: '2026-02-03T11:00:00Z',
          started_at: '2026-02-03T11:00:00Z',
          completed_at: '2026-02-03T11:05:00Z',
          error: null,
          word_count: 1000,
          quality_score: 0.85
        },
        {
          article_id: 'article-2',
          subtopic_id: 'subtopic-2',
          status: 'generating',
          progress_percent: 60,
          sections_completed: 3,
          sections_total: 5,
          current_section: 'writing',
          estimated_completion_time: '2026-02-03T13:00:00Z',
          created_at: '2026-02-03T12:00:00Z',
          started_at: '2026-02-03T12:00:00Z',
          completed_at: null,
          error: null,
          word_count: 600,
          quality_score: null
        }
      ]

      const result = formatProgressResponse(articles, 'workflow-123')

      expect(result).toEqual({
        workflow_id: 'workflow-123',
        total_articles: 2,
        articles: expect.any(Array),
        summary: {
          queued_count: 0,
          generating_count: 1,
          completed_count: 1,
          failed_count: 0,
          average_generation_time_seconds: expect.any(Number),
          estimated_total_completion_time: expect.any(String)
        }
      })

      // Verify summary counts
      expect(result.summary.queued_count).toBe(0)
      expect(result.summary.generating_count).toBe(1)
      expect(result.summary.completed_count).toBe(1)
      expect(result.summary.failed_count).toBe(0)
    })

    it('should handle empty articles array', () => {
      const result = formatProgressResponse([], 'workflow-123')

      expect(result).toEqual({
        workflow_id: 'workflow-123',
        total_articles: 0,
        articles: [],
        summary: {
          queued_count: 0,
          generating_count: 0,
          completed_count: 0,
          failed_count: 0,
          average_generation_time_seconds: 0,
          estimated_total_completion_time: null
        }
      })
    })
  })

  describe('getWorkflowArticleProgress', () => {
    it('should fetch workflow article progress with filters', async () => {
      const mockArticlesData = [
        {
          id: 'article-1',
          intent_workflow_id: 'workflow-123',
          subtopic_id: 'subtopic-1',
          status: 'completed',
          created_at: '2026-02-03T12:00:00Z',
          updated_at: '2026-02-03T12:05:00Z',
          article_progress: {
            id: 'progress-1',
            article_id: 'article-1',
            status: 'completed',
            progress_percentage: 100,
            current_section: 5,
            total_sections: 5,
            current_stage: 'completed',
            estimated_time_remaining: 0,
            actual_time_spent: 300,
            word_count: 1000,
            error_message: null,
            metadata: {},
            created_at: '2026-02-03T12:00:00Z',
            updated_at: '2026-02-03T12:05:00Z'
          }
        },
        {
          id: 'article-2',
          intent_workflow_id: 'workflow-123',
          subtopic_id: 'subtopic-2',
          status: 'generating',
          created_at: '2026-02-03T12:00:00Z',
          updated_at: '2026-02-03T12:02:00Z',
          article_progress: {
            id: 'progress-2',
            article_id: 'article-2',
            status: 'generating',
            progress_percentage: 60,
            current_section: 3,
            total_sections: 5,
            current_stage: 'writing',
            estimated_time_remaining: 180,
            actual_time_spent: 120,
            word_count: 600,
            error_message: null,
            metadata: {},
            created_at: '2026-02-03T12:00:00Z',
            updated_at: '2026-02-03T12:02:00Z'
          }
        }
      ]

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockArticlesData,
          error: null
        })
      }
      const mockSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockArticlesData,
          error: null
        })
      } as any
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(mockSelectQuery)
      mockSelectQuery.select = vi.fn().mockReturnValue(mockQuery)

      const filters = {
        status: 'generating',
        date_from: '2026-02-01',
        date_to: '2026-02-03',
        limit: 50,
        offset: 0
      }

      const result = await getWorkflowArticleProgress('workflow-123', filters)

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('articles')
      expect(mockQuery.eq).toHaveBeenCalledWith('intent_workflow_id', 'workflow-123')
      expect(mockQuery.in).toHaveBeenCalledWith('article_progress.status', ['generating'])
      expect(mockQuery.gte).toHaveBeenCalledWith('articles.created_at', '2026-02-01')
      expect(mockQuery.lte).toHaveBeenCalledWith('articles.created_at', '2026-02-03')
      expect(mockQuery.range).toHaveBeenCalledWith(0, 49)
    })

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      } as any
      mockSupabaseAdmin.from = vi.fn().mockReturnValue(mockQuery)
      mockQuery.select = vi.fn().mockReturnValue(mockQuery)

      await expect(getWorkflowArticleProgress('workflow-123', {}))
        .rejects.toThrow('Database error')
    })
  })
})
