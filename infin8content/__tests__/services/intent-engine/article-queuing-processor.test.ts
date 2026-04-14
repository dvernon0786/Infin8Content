/**
 * Article Queuing Processor Service Tests
 * Story 38.1: Queue Approved Subtopics for Article Generation
 *
 * Uses a per-from() thenable chain factory so that:
 *  - chains that end with .limit() or .single() resolve via those terminal mocks
 *  - chains that are awaited directly (no terminal method) also resolve correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { queueArticlesForWorkflow } from '@/lib/services/intent-engine/article-queuing-processor'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/intent-engine/intent-audit-logger', () => ({
  logIntentAction: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a Supabase query-chain mock whose terminal calls resolve to `response`. */
function createChain(response: any) {
  const chain: any = {}
  ;['select', 'eq', 'insert', 'update', 'delete', 'order'].forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  chain.single = vi.fn().mockResolvedValue(response)
  chain.limit  = vi.fn().mockResolvedValue(response)
  // Make chain directly awaitable (for queries with no terminal method call)
  chain.then   = (res: any, rej?: any) => Promise.resolve(response).then(res, rej)
  chain.catch  = (rej: any)           => Promise.resolve(response).catch(rej)
  chain.finally = (cb: any)           => Promise.resolve(response).finally(cb)
  return chain
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Article Queuing Processor', () => {
  let mockSupabase: any
  let queryResults: any[]
  let queryIndex: number

  beforeEach(() => {
    vi.clearAllMocks()
    queryResults = []
    queryIndex   = 0

    mockSupabase = {
      from: vi.fn().mockImplementation(() => createChain(queryResults[queryIndex++])),
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Shorthand to push query responses in the order the service will call from()
  function push(...responses: any[]) {
    queryResults.push(...responses)
  }

  describe('queueArticlesForWorkflow', () => {
    it('should create articles for approved keywords', async () => {
      const workflowId    = 'workflow-123'
      const organizationId = 'org-123'

      // 1. workflow fetch (.limit(1)) → array
      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: organizationId }], error: null })
      // 2. keywords fetch (direct await)
      push({ data: [{
        id: 'keyword-1',
        keyword: 'best seo practices',
        subtopics: [
          { title: 'On-page SEO',    type: 'subtopic', keywords: ['meta tags'] },
          { title: 'Technical SEO',  type: 'subtopic', keywords: ['site speed'] },
          { title: 'Link Building',  type: 'subtopic', keywords: ['backlinks'] },
        ],
      }], error: null })
      // 3. article insert (.limit(1)) → array
      push({ data: [{ id: 'article-1', keyword: 'best seo practices', status: 'draft' }], error: null })
      // 4. article_sections insert (.select()) → direct await
      push({ data: [{ id: 'section-1' }, { id: 'section-2' }, { id: 'section-3' }], error: null })
      // 5. keyword update (direct await)
      push({ error: null })
      // 6. logIntentAction → intent_audit_logs insert (direct await)
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.workflow_id).toBe(workflowId)
      expect(result.articles_created).toBe(1)
      expect(result.articles).toHaveLength(1)
      expect(result.articles[0].keyword).toBe('best seo practices')
      expect(result.message).toBeDefined()
    })

    it('should handle workflow not found error', async () => {
      // .limit(1) returns empty array → "not found"
      push({ data: [], error: null })

      await expect(queueArticlesForWorkflow('workflow-invalid')).rejects.toThrow(
        'Workflow not found'
      )
    })

    it('should handle no approved keywords gracefully', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      // No ready keywords
      push({ data: [], error: null })
      // logIntentAction would NOT be called when no keywords (early return)

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.articles_created).toBe(0)
      expect(result.articles).toHaveLength(0)
      expect(result.message).toContain('No approved keywords')
    })

    it('should skip keyword with no subtopics and continue', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      // keyword with no subtopics
      push({ data: [{ id: 'kw-1', keyword: 'bare keyword', subtopics: [] }], error: null })
      // article insert (created before subtopic check)
      push({ data: [{ id: 'article-1', keyword: 'bare keyword', status: 'draft' }], error: null })
      // article delete (cleanup after empty subtopics)
      push({ error: null })
      // logIntentAction
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.articles_created).toBe(0)
    })

    it('should handle article insert failure gracefully', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      push({ data: [{ id: 'kw-1', keyword: 'test kw', subtopics: [{ title: 'S1', type: 'subtopic', keywords: [] }] }], error: null })
      // article insert error
      push({ data: null, error: { message: 'DB error' } })
      // logIntentAction
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.articles_created).toBe(0)
    })

    it('should handle section seeding failure and rollback article', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      push({ data: [{ id: 'kw-1', keyword: 'test kw', subtopics: [{ title: 'S1', type: 'subtopic', keywords: [] }] }], error: null })
      // article insert succeeds
      push({ data: [{ id: 'article-1', keyword: 'test kw', status: 'draft' }], error: null })
      // article_sections insert → empty result (failure)
      push({ data: [], error: { message: 'section error' } })
      // logIntentAction
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.articles_created).toBe(0)
    })

    it('should return workflow state from the fetched workflow', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      push({ data: [], error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.workflow_state).toBe('step_9_articles')
    })

    it('should set article status to draft', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      push({ data: [{ id: 'kw-1', keyword: 'test kw', subtopics: [{ title: 'S1', type: 'subtopic', keywords: [] }] }], error: null })
      push({ data: [{ id: 'article-1', keyword: 'test kw', status: 'draft' }], error: null })
      push({ data: [{ id: 'section-1' }], error: null })
      push({ error: null })
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.articles[0].status).toBe('draft')
    })

    it('should handle multiple keywords', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      push({ data: [
        { id: 'kw-1', keyword: 'keyword one', subtopics: [{ title: 'S1', type: 'subtopic', keywords: [] }] },
        { id: 'kw-2', keyword: 'keyword two', subtopics: [{ title: 'S2', type: 'subtopic', keywords: [] }] },
      ], error: null })
      // keyword one: article + sections + keyword update
      push({ data: [{ id: 'art-1', keyword: 'keyword one', status: 'draft' }], error: null })
      push({ data: [{ id: 'sec-1' }], error: null })
      push({ error: null })
      // keyword two: article + sections + keyword update
      push({ data: [{ id: 'art-2', keyword: 'keyword two', status: 'draft' }], error: null })
      push({ data: [{ id: 'sec-2' }], error: null })
      push({ error: null })
      // logIntentAction
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      expect(result.articles_created).toBe(2)
      expect(result.articles).toHaveLength(2)
    })

    it('should handle keyword status update failure by skipping article', async () => {
      const workflowId = 'workflow-123'

      push({ data: [{ id: workflowId, state: 'step_9_articles', organization_id: 'org-123' }], error: null })
      push({ data: [{ id: 'kw-1', keyword: 'test kw', subtopics: [{ title: 'S1', type: 'subtopic', keywords: [] }] }], error: null })
      push({ data: [{ id: 'art-1', keyword: 'test kw', status: 'draft' }], error: null })
      push({ data: [{ id: 'sec-1' }], error: null })
      // keyword update fails
      push({ error: { message: 'update error' } })
      // logIntentAction
      push({ error: null })

      const result = await queueArticlesForWorkflow(workflowId)

      // Article is cleaned up when keyword update fails
      expect(result.articles_created).toBe(0)
    })
  })
})
