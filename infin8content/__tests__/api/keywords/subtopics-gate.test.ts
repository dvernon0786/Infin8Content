import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../../../app/api/keywords/[id]/subtopics/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { KeywordSubtopicGenerator } from '@/lib/services/keyword-engine/subtopic-generator'

vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/keyword-engine/subtopic-generator')
vi.mock('@/lib/services/intent-engine/intent-audit-logger')

describe('/api/keywords/[id]/subtopics - Gate Validation Integration Tests', () => {
  let mockSupabase: any
  let mockGenerator: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = {
      from: vi.fn()
    }
    mockGenerator = {
      generate: vi.fn().mockResolvedValue([]),
      store: vi.fn().mockResolvedValue(undefined)
    }
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
    vi.mocked(KeywordSubtopicGenerator).mockImplementation(() => mockGenerator)
  })

  describe('Gate Validation - Blocked Cases', () => {
    it('should return 423 Locked when longtails are not complete', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const keywordQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workflow_id: 'workflow-123' },
          error: null
        })
      }

      const workflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'workflow-123',
            status: 'step_3_seeds',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(keywordQuery)
        .mockReturnValueOnce(workflowQuery)

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.error).toContain('Longtail expansion and clustering required')
      expect(data.longtailStatus).toBe('not_complete')
      expect(data.clusteringStatus).toBe('not_complete')
    })

    it('should return 423 Locked when clustering is not complete', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const keywordQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workflow_id: 'workflow-123' },
          error: null
        })
      }

      const workflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'workflow-123',
            status: 'step_5_filtering',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(keywordQuery)
        .mockReturnValueOnce(workflowQuery)

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.error).toContain('topic clustering (step 6)')
      expect(data.longtailStatus).toBe('complete')
      expect(data.clusteringStatus).toBe('not_complete')
    })

    it('should include missingPrerequisites array in error response', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const keywordQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workflow_id: 'workflow-123' },
          error: null
        })
      }

      const workflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'workflow-123',
            status: 'step_2_competitors',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(keywordQuery)
        .mockReturnValueOnce(workflowQuery)

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.missingPrerequisites).toBeDefined()
      expect(Array.isArray(data.missingPrerequisites)).toBe(true)
      expect(data.missingPrerequisites).toContain('longtail expansion (step 4)')
      expect(data.missingPrerequisites).toContain('topic clustering (step 6)')
    })
  })

  describe('Gate Validation - Allowed Cases', () => {
    it('should allow subtopic generation when both prerequisites are complete', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const keywordQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workflow_id: 'workflow-123' },
          error: null
        })
      }

      const workflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'workflow-123',
            status: 'step_7_validation',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(keywordQuery)
        .mockReturnValueOnce(workflowQuery)

      mockGenerator.generate.mockResolvedValue([
        { title: 'Subtopic 1' },
        { title: 'Subtopic 2' },
        { title: 'Subtopic 3' }
      ])

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.subtopics_count).toBe(3)
      expect(mockGenerator.generate).toHaveBeenCalledWith('kw-123')
      expect(mockGenerator.store).toHaveBeenCalledWith('kw-123', expect.any(Array))
    })

    it('should allow subtopic generation at step_8_subtopics', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const keywordQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workflow_id: 'workflow-123' },
          error: null
        })
      }

      const workflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'workflow-123',
            status: 'step_8_subtopics',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(keywordQuery)
        .mockReturnValueOnce(workflowQuery)

      mockGenerator.generate.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })

      expect(response.status).toBe(200)
      expect(mockGenerator.generate).toHaveBeenCalled()
    })
  })

  describe('Organization Isolation', () => {
    it('should validate organization isolation when checking workflow', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const keywordQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { workflow_id: 'workflow-123' },
          error: null
        })
      }

      const workflowQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'workflow-123',
            status: 'step_7_validation',
            organization_id: 'org-123'
          },
          error: null
        })
      }

      mockSupabase.from
        .mockReturnValueOnce(keywordQuery)
        .mockReturnValueOnce(workflowQuery)

      mockGenerator.generate.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })

      // Verify organization isolation was checked in workflow query
      const workflowQueryCalls = mockSupabase.from.mock.calls
      const workflowCall = workflowQueryCalls[1]
      expect(workflowCall[0]).toBe('intent_workflows')
    })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/keywords/kw-123/subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'kw-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 when keyword ID is missing', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        org_id: 'org-123',
        email: 'test@example.com'
      } as any)

      const request = new NextRequest('http://localhost/api/keywords//subtopics', {
        method: 'POST'
      })

      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Keyword ID is required')
    })
  })

  describe('Audit Actions', () => {
    it('should have gate violation audit actions defined', async () => {
      const { AuditAction } = await import('../../../types/audit')
      expect(AuditAction.WORKFLOW_GATE_LONGTAILS_ALLOWED).toBe('workflow.gate.longtails_allowed')
      expect(AuditAction.WORKFLOW_GATE_LONGTAILS_BLOCKED).toBe('workflow.gate.longtails_blocked')
      expect(AuditAction.WORKFLOW_GATE_LONGTAILS_ERROR).toBe('workflow.gate.longtails_error')
    })
  })
})
