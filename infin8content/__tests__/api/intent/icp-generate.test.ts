import { mockNextRequest } from "@/tests/factories/next-request"
/**
 * ICP Generation API Integration Tests
 * Story 34.1: Generate ICP Document via Perplexity AI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/intent/workflows/[workflow_id]/steps/icp-generate/route'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateICPDocument } from '@/lib/services/intent-engine/icp-generator'

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user')
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/intent-engine/icp-generator')

describe('ICP Generation API Endpoint', () => {
  const mockUserId = 'test-user-id'
  const mockOrgId = 'test-org-id'
  const mockWorkflowId = 'test-workflow-id'

  const mockUser = {
    id: mockUserId,
    org_id: mockOrgId,
    email: 'test@example.com'
  }

  const mockWorkflow = {
    id: mockWorkflowId,
    status: 'step_0_auth',
    organization_id: mockOrgId
  }

  const mockICPResult = {
    icp_data: {
      industries: ['SaaS', 'Enterprise Software'],
      buyerRoles: ['CTO', 'VP Engineering'],
      painPoints: ['Scaling challenges', 'Team collaboration'],
      valueProposition: 'Streamlined infrastructure management',
      generatedAt: new Date().toISOString(),
      apiVersion: '1.0'
    },
    tokensUsed: 1500,
    modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
    generatedAt: new Date().toISOString()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/intent/workflows/[workflow_id]/steps/icp-generate', () => {
    it('should return 429 if rate limit exceeded', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      // Make 11 requests to exceed limit of 10
      for (let i = 0; i < 10; i++) {
        await POST(request as any, { params: { workflow_id: mockWorkflowId } })
      }

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error).toBe('Rate limit exceeded')
    })

    it('should generate ICP successfully with valid request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockWorkflow,
          error: null
        }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
      vi.mocked(generateICPDocument).mockResolvedValue(mockICPResult)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.status).toBe('step_1_icp')
      expect(data.icp_data).toEqual(mockICPResult.icp_data)
    })

    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 400 if required fields are missing', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockWorkflow,
          error: null
        })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc'
          // Missing organization_url and organization_linkedin_url
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('should return 404 if workflow not found', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Workflow not found')
    })

    it('should return 400 if workflow is in invalid state', async () => {
      const invalidWorkflow = {
        id: mockWorkflowId,
        status: 'step_2_competitors',
        organization_id: mockOrgId
      }

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: invalidWorkflow,
          error: null
        })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid workflow state')
    })

    it('should return 500 if ICP generation fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockWorkflow,
          error: null
        }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
      vi.mocked(generateICPDocument).mockRejectedValue(
        new Error('OpenRouter API timeout')
      )

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('ICP generation failed')
      expect(data.message).toContain('OpenRouter API timeout')
    })

    it('should include metadata in successful response', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockWorkflow,
          error: null
        }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
      vi.mocked(generateICPDocument).mockResolvedValue(mockICPResult)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      const data = await response.json()
      expect(data.metadata).toBeDefined()
      expect(data.metadata.tokens_used).toBe(mockICPResult.tokensUsed)
      expect(data.metadata.model_used).toBe(mockICPResult.modelUsed)
      expect(data.metadata.generated_at).toBeDefined()
    })

    it('should return cached ICP if already generated (idempotency)', async () => {
      const existingICPData = {
        industries: ['SaaS'],
        buyerRoles: ['CTO'],
        painPoints: ['Scaling'],
        valueProposition: 'Infrastructure management',
        generatedAt: new Date().toISOString(),
        apiVersion: '1.0'
      }

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            data: mockWorkflow,
            error: null
          })
          .mockResolvedValueOnce({
            data: { icp_data: existingICPData, step_1_icp_completed_at: new Date().toISOString() },
            error: null
          }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const request = mockNextRequest({url: ''http://localhost:3000/api/intent/workflows/test-workflow-id/steps/icp-generate', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: 'TechCorp Inc',
          organization_url: 'https://techcorp.com',
          organization_linkedin_url: 'https://linkedin.com/company/techcorp'
        })
      })

      const response = await POST(request as any, {
        params: { workflow_id: mockWorkflowId }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.cached).toBe(true)
      expect(data.icp_data).toEqual(existingICPData)
    })
  })
})
