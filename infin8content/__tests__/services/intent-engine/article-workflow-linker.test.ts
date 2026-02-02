/**
 * Unit Tests for Article-Workflow Linker
 * Story 38.3: Link Generated Articles to Intent Workflow
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  validateWorkflowAccess,
  validateWorkflowForLinking,
  getCompletedArticlesForWorkflow,
  linkSingleArticle,
  updateWorkflowLinkCounts,
  linkArticlesToWorkflow,
  type LinkingResult,
  type ArticleLinkingData,
  type WorkflowLinkingCounts
} from '@/lib/services/intent-engine/article-workflow-linker'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('./intent-audit-logger', () => ({
  logIntentAction: vi.fn()
}))

const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  order: vi.fn()
}

const mockCreateServiceRoleClient = vi.fn(() => mockSupabase)
vi.doMock('@/lib/supabase/server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient
}))

// Mock the audit logger
const mockLogIntentAction = vi.fn()
vi.doMock('./intent-audit-logger', () => ({
  logIntentAction: mockLogIntentAction
}))

// Clean up mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

describe('Article-Workflow Linker', () => {
  const mockWorkflowId = 'workflow-123'
  const mockUserId = 'user-123'
  const mockOrgId = 'org-123'

  const mockArticles: ArticleLinkingData[] = [
    {
      id: 'article-1',
      intent_workflow_id: mockWorkflowId,
      subtopic_id: 'subtopic-1',
      status: 'completed',
      workflow_link_status: 'not_linked'
    },
    {
      id: 'article-2',
      intent_workflow_id: mockWorkflowId,
      subtopic_id: 'subtopic-2',
      status: 'published',
      workflow_link_status: 'not_linked'
    }
  ]

  const mockWorkflow = {
    id: mockWorkflowId,
    status: 'step_9_articles',
    organization_id: mockOrgId,
    article_link_count: 0
  }

  describe('validateWorkflowAccess', () => {
    it('should return true for valid user with access', async () => {
      // Mock workflow query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { organization_id: mockOrgId }, 
                error: null 
              })
            })
          })
        })
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { org_id: mockOrgId }, 
              error: null 
            })
          })
        })
      })

      const result = await validateWorkflowAccess(mockUserId, mockWorkflowId)
      expect(result).toBe(true)
    })

    it('should return false for user without access', async () => {
      // Mock workflow query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: { organization_id: 'different-org' }, 
                error: null 
              })
            })
          })
        })
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { org_id: mockOrgId }, 
              error: null 
            })
          })
        })
      })

      const result = await validateWorkflowAccess(mockUserId, mockWorkflowId)
      expect(result).toBe(false)
    })

    it('should return false for workflow not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Not found' } 
              })
            })
          })
        })
      })

      const result = await validateWorkflowAccess(mockUserId, mockWorkflowId)
      expect(result).toBe(false)
    })
  })

  describe('validateWorkflowForLinking', () => {
    it('should return valid for workflow in correct state', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: mockWorkflow, 
              error: null 
            })
          })
        })
      })

      const result = await validateWorkflowForLinking(mockWorkflowId)
      expect(result.valid).toBe(true)
      expect(result.workflow).toEqual(mockWorkflow)
    })

    it('should return invalid for workflow in wrong state', async () => {
      const wrongStateWorkflow = { ...mockWorkflow, status: 'step_8_approval' }
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: wrongStateWorkflow, 
              error: null 
            })
          })
        })
      })

      const result = await validateWorkflowForLinking(mockWorkflowId)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('step_9_articles state')
    })

    it('should return invalid for workflow not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Not found' } 
            })
          })
        })
      })

      const result = await validateWorkflowForLinking(mockWorkflowId)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Workflow not found')
    })
  })

  describe('getCompletedArticlesForWorkflow', () => {
    it('should return completed articles ready for linking', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ 
                  data: mockArticles, 
                  error: null 
                })
              })
            })
          })
        })
      })

      const result = await getCompletedArticlesForWorkflow(mockWorkflowId)
      expect(result).toEqual(mockArticles)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ 
                  data: null, 
                  error: { message: 'Database error' } 
                })
              })
            })
          })
        })
      })

      await expect(getCompletedArticlesForWorkflow(mockWorkflowId))
        .rejects.toThrow('Database error')
    })
  })

  describe('linkSingleArticle', () => {
    it('should successfully link an article', async () => {
      const articleId = 'article-1'

      // Mock update to 'linking' status
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      })

      // Mock update to 'linked' status
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
          })
        })
      })

      const result = await linkSingleArticle(articleId, mockWorkflowId, mockUserId, mockOrgId)
      expect(result.success).toBe(true)
    })

    it('should handle linking failures gracefully', async () => {
      const articleId = 'article-1'

      // Mock update failure
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
          })
        })
      })

      // Mock marking as failed
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      const result = await linkSingleArticle(articleId, mockWorkflowId, mockUserId, mockOrgId)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('updateWorkflowLinkCounts', () => {
    it('should update workflow counts and status', async () => {
      const counts: WorkflowLinkingCounts = {
        total: 5,
        linked: 3,
        already_linked: 2,
        failed: 0
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      await expect(updateWorkflowLinkCounts(mockWorkflowId, counts, mockUserId))
        .resolves.not.toThrow()
    })

    it('should update status to completed when all articles linked', async () => {
      const counts: WorkflowLinkingCounts = {
        total: 5,
        linked: 3,
        already_linked: 2,
        failed: 0
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      await updateWorkflowLinkCounts(mockWorkflowId, counts, mockUserId)

      // Verify the update call includes status change
      expect(mockSupabase.from).toHaveBeenCalledWith('intent_workflows')
      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.status).toBe('step_10_completed')
    })
  })

  describe('linkArticlesToWorkflow', () => {
    beforeEach(() => {
      // Mock all the sub-functions
      vi.mocked(validateWorkflowForLinking).mockResolvedValue({
        valid: true,
        workflow: mockWorkflow
      })
      
      vi.mocked(getCompletedArticlesForWorkflow).mockResolvedValue(mockArticles)
      
      vi.mocked(linkSingleArticle).mockImplementation(async (articleId: string) => {
        return { success: true }
      })
      
      vi.mocked(updateWorkflowLinkCounts).mockResolvedValue()
      
      // Mock Supabase calls
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { status: 'step_10_completed' }, 
              error: null 
            })
          })
        })
      })
    })

    it('should successfully link articles to workflow', async () => {
      // Mock already linked articles query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })
        })
      })

      // Mock final workflow status query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { status: 'step_10_completed' }, 
              error: null 
            })
          })
        })
      })

      const result = await linkArticlesToWorkflow(mockWorkflowId, mockUserId)

      expect(result.workflow_id).toBe(mockWorkflowId)
      expect(result.linking_status).toBe('completed')
      expect(result.linked_articles).toBe(2)
      expect(result.failed_articles).toBe(0)
    })

    it('should handle workflow validation failures', async () => {
      vi.mocked(validateWorkflowForLinking).mockResolvedValue({
        valid: false,
        error: 'Workflow not ready'
      })

      await expect(linkArticlesToWorkflow(mockWorkflowId, mockUserId))
        .rejects.toThrow('Workflow not ready')
    })

    it('should handle individual article linking failures', async () => {
      // Mock one successful and one failed link
      vi.mocked(linkSingleArticle)
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: 'Link failed' })

      // Mock already linked articles query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })
        })
      })

      // Mock final workflow status query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { status: 'step_9_articles' }, 
              error: null 
            })
          })
        })
      })

      const result = await linkArticlesToWorkflow(mockWorkflowId, mockUserId)

      expect(result.linked_articles).toBe(1)
      expect(result.failed_articles).toBe(1)
      expect(result.linking_status).toBe('completed')
    })

    it('should include already linked articles in count', async () => {
      // Mock already linked articles
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ 
              data: [{ id: 'already-linked' }], 
              error: null 
            })
          })
        })
      })

      // Mock final workflow status query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { status: 'step_10_completed' }, 
              error: null 
            })
          })
        })
      })

      const result = await linkArticlesToWorkflow(mockWorkflowId, mockUserId)

      expect(result.already_linked).toBe(1)
      expect(result.total_articles).toBe(3) // 2 new + 1 already linked
    })
  })
})
