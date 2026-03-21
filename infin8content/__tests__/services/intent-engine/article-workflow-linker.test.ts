/**
 * Unit Tests for Article-Workflow Linker
 * Story 38.3: Link Generated Articles to Intent Workflow
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  linkArticlesToWorkflow,
  type LinkingResult
} from '@/lib/services/intent-engine/article-workflow-linker'

// Mock dependencies
const mockCreateServiceRoleClient = vi.fn()
const mockLogIntentAction = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient
}))

vi.mock('@/lib/services/intent-engine/intent-audit-logger', () => ({
  logIntentAction: mockLogIntentAction
}))

describe('Article-Workflow Linker', () => {
  let mockSupabase: any
  let mockLogIntentAction: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn()
            }))
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }

    mockLogIntentAction = vi.fn().mockResolvedValue(undefined)

    mockCreateServiceRoleClient.mockReturnValue(mockSupabase)
    mockLogIntentAction.mockReturnValue(mockLogIntentAction)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('linkArticlesToWorkflow', () => {
    it('should link articles to workflow successfully', async () => {
      const workflowId = 'workflow-123'
      const userId = 'user-123'

      // Mock workflow fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: workflowId,
                  state: 'step_9_articles',
                  organization_id: 'org-123'
                },
                error: null
              })
            })
          })
        })
      })

      // Mock articles fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'article-1', workflow_link_status: 'not_linked' },
                  { id: 'article-2', workflow_link_status: 'not_linked' }
                ],
                error: null
              })
            })
          })
        })
      })

      // Mock article update
      mockSupabase.update.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'article-1' },
              error: null
            })
          })
        })
      })

      const result = await linkArticlesToWorkflow(workflowId, userId)

      expect(result.workflow_id).toBe(workflowId)
      expect(result.linked_articles).toBe(2)
      expect(result.failed_articles).toBe(0)
      expect(result.linking_status).toBe('completed')
    })

    it('should handle workflow not found error', async () => {
      const workflowId = 'workflow-invalid'
      const userId = 'user-123'

      // Mock workflow fetch
      mockSupabase.from.mockReturnValueOnce({
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

      await expect(linkArticlesToWorkflow(workflowId, userId)).rejects.toThrow(
        'Workflow not found'
      )
    })

    it('should handle invalid workflow state', async () => {
      const workflowId = 'workflow-123'
      const userId = 'user-123'
      // Mock workflow fetch
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: workflowId,
                  state: 'step_8_subtopics',
                  organization_id: 'org-123'
                },
                error: null
              })
            })
          })
        })
      })

      await expect(linkArticlesToWorkflow(workflowId, userId)).rejects.toThrow(
        'Workflow must be at step_9_articles'
      )
    })
  })
})
