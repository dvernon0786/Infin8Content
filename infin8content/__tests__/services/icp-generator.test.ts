/**
 * ICP Generator Service Tests
 * Story 34.1: Generate ICP Document via Perplexity AI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateICPDocument,
  storeICPGenerationResult,
  handleICPGenerationFailure,
  type ICPGenerationRequest,
  type ICPData,
  type ICPGenerationResult
} from '@/lib/services/intent-engine/icp-generator'
import { generateContent } from '@/lib/services/openrouter/openrouter-client'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/services/openrouter/openrouter-client')
vi.mock('@/lib/supabase/server')

describe('ICP Generator Service', () => {
  const mockOrganizationId = 'test-org-id'
  const mockWorkflowId = 'test-workflow-id'

  const mockICPRequest: ICPGenerationRequest = {
    organizationName: 'TechCorp Inc',
    organizationUrl: 'https://techcorp.com',
    organizationLinkedInUrl: 'https://linkedin.com/company/techcorp'
  }

  const mockICPData: ICPData = {
    industries: ['SaaS', 'Enterprise Software', 'Cloud Computing'],
    buyerRoles: ['CTO', 'VP Engineering', 'Engineering Manager'],
    painPoints: [
      'Scaling infrastructure costs',
      'Team collaboration challenges',
      'DevOps complexity'
    ],
    valueProposition: 'Streamlined cloud infrastructure management for enterprise teams',
    generatedAt: new Date().toISOString(),
    apiVersion: '1.0'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateICPDocument', () => {
    it('should generate ICP document successfully', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)

      expect(result.icp_data).toEqual(mockICPData)
      expect(result.tokensUsed).toBe(1500)
      expect(result.modelUsed).toBe('perplexity/llama-3.1-sonar-small-128k-online')
      expect(mockGenerateContent).toHaveBeenCalledOnce()
    })

    it('should validate ICP data structure', async () => {
      const invalidICPData = {
        industries: [],
        buyerRoles: ['CTO'],
        painPoints: ['Challenge'],
        valueProposition: 'Value'
      }

      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(invalidICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('ICP data must include at least one industry')
    })

    it('should throw error for missing organization name', async () => {
      const invalidRequest: ICPGenerationRequest = {
        organizationName: '',
        organizationUrl: 'https://techcorp.com',
        organizationLinkedInUrl: 'https://linkedin.com/company/techcorp'
      }

      await expect(
        generateICPDocument(invalidRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Organization name, URL, and LinkedIn URL are required')
    })

    it('should throw error for missing organization URL', async () => {
      const invalidRequest: ICPGenerationRequest = {
        organizationName: 'TechCorp Inc',
        organizationUrl: '',
        organizationLinkedInUrl: 'https://linkedin.com/company/techcorp'
      }

      await expect(
        generateICPDocument(invalidRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Organization name, URL, and LinkedIn URL are required')
    })

    it('should throw error for missing LinkedIn URL', async () => {
      const invalidRequest: ICPGenerationRequest = {
        organizationName: 'TechCorp Inc',
        organizationUrl: 'https://techcorp.com',
        organizationLinkedInUrl: ''
      }

      await expect(
        generateICPDocument(invalidRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Organization name, URL, and LinkedIn URL are required')
    })

    it('should handle JSON parsing errors', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockResolvedValueOnce({
        content: 'Invalid JSON {',
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Failed to parse ICP response')
    })

    it('should handle API errors gracefully', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockRejectedValueOnce(
        new Error('OpenRouter API error: 429 Too Many Requests')
      )

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('OpenRouter API error: 429 Too Many Requests')
    })

    it('should use Perplexity model for ICP generation', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)

      const callArgs = mockGenerateContent.mock.calls[0]
      expect(callArgs[1]?.model).toBe('perplexity/llama-3.1-sonar-small-128k-online')
    })

    it('should validate all required ICP fields', async () => {
      const incompleteICPData = {
        industries: ['SaaS'],
        buyerRoles: [],
        painPoints: ['Challenge'],
        valueProposition: 'Value'
      }

      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(incompleteICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('ICP data must include at least one buyer role')
    })

    it('should enforce 5-minute timeout', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 400000)) // 400 seconds
      )

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 5000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`) // 5 second timeout for test
      ).rejects.toThrow('ICP generation timeout')
    })

    it('should validate URL formats', async () => {
      const invalidRequest: ICPGenerationRequest = {
        organizationName: 'TechCorp Inc',
        organizationUrl: 'not-a-valid-url',
        organizationLinkedInUrl: 'https://linkedin.com/company/techcorp'
      }

      await expect(
        generateICPDocument(invalidRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Invalid URL format')
    })
  })

  describe('storeICPGenerationResult (RPC-based)', () => {
    const mockWorkflowId = 'test-workflow-id'
    const mockOrganizationId = 'test-org-id'
    const mockIdempotencyKey = `${mockWorkflowId}:step_1_icp`

    const mockICPResult: ICPGenerationResult = {
      icp_data: mockICPData,
      tokensUsed: 1500,
      modelUsed: 'perplexity/sonar',
      generatedAt: new Date().toISOString(),
      promptTokens: 800,
      completionTokens: 700,
      cost: 0.0022
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call atomic RPC with correct parameters', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      await storeICPGenerationResult(
        mockWorkflowId,
        mockOrganizationId,
        mockICPResult,
        mockIdempotencyKey
      )

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'record_usage_increment_and_complete_step',
        {
          p_workflow_id: mockWorkflowId,
          p_organization_id: mockOrganizationId,
          p_model: mockICPResult.modelUsed,
          p_prompt_tokens: mockICPResult.promptTokens,
          p_completion_tokens: mockICPResult.completionTokens,
          p_cost: mockICPResult.cost,
          p_icp_data: mockICPResult.icp_data,
          p_tokens_used: mockICPResult.tokensUsed,
          p_generated_at: mockICPResult.generatedAt,
          p_idempotency_key: mockIdempotencyKey
        }
      )
    })

    it('should throw if RPC returns error', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          error: { message: 'Database failure' }
        })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      await expect(
        storeICPGenerationResult(
          mockWorkflowId,
          mockOrganizationId,
          mockICPResult,
          mockIdempotencyKey
        )
      ).rejects.toThrow(
        'Financial recording and workflow update failed'
      )

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
    })

    it('should pass idempotency key correctly', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      await storeICPGenerationResult(
        mockWorkflowId,
        mockOrganizationId,
        mockICPResult,
        mockIdempotencyKey
      )

      const rpcArgs = mockSupabase.rpc.mock.calls[0][1]
      expect(rpcArgs.p_idempotency_key).toBe(mockIdempotencyKey)
    })

    it('should NOT call .from() or .update() (prevents regression)', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: vi.fn(),
        update: vi.fn()
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      await storeICPGenerationResult(
        mockWorkflowId,
        mockOrganizationId,
        mockICPResult,
        mockIdempotencyKey
      )

      expect(mockSupabase.from).not.toHaveBeenCalled()
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })
  })

  describe('handleICPGenerationFailure', () => {
    it('should record error in workflow', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const error = new Error('ICP generation timeout')
      await handleICPGenerationFailure(mockWorkflowId, mockOrganizationId, error)

      expect(mockSupabase.from).toHaveBeenCalledWith('intent_workflows')
      expect(mockSupabase.update).toHaveBeenCalled()

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.status).toBe('failed')
      expect(updateCall.step_1_icp_error_message).toBe('ICP generation timeout')
    })

    it('should handle storage errors gracefully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          error: { message: 'Database error' }
        })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const error = new Error('ICP generation failed')
      // Should not throw - error handling is graceful
      await expect(
        handleICPGenerationFailure(mockWorkflowId, mockOrganizationId, error)
      ).resolves.not.toThrow()
    })
  })
})
