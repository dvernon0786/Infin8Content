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
import { generateContent, MODEL_PRICING } from '@/lib/services/openrouter/openrouter-client'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/services/openrouter/openrouter-client', () => ({
  generateContent: vi.fn(),
  MODEL_PRICING: {
    'perplexity/sonar': { inputPer1k: 0.001, outputPer1k: 0.002 },
    'openai/gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 }
  }
}))
vi.mock('@/lib/services/intent-engine/retry-utils', async () => {
  const actual = await vi.importActual('@/lib/services/intent-engine/retry-utils')
  return {
    ...actual,
    sleep: vi.fn().mockResolvedValue(undefined)
  }
})
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null })
  }))
}))

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

  const successPayload = {
    content: JSON.stringify(mockICPData),
    tokensUsed: 1500,
    modelUsed: 'perplexity/sonar',
    promptTokens: 800,
    completionTokens: 700,
    cost: 0.0022
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(generateContent).mockResolvedValue(successPayload)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateICPDocument', () => {
    it('should generate ICP document successfully', async () => {
      const result = await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)

      expect(result.icp_data).toEqual(expect.objectContaining({
        industries: mockICPData.industries,
        buyerRoles: mockICPData.buyerRoles,
        painPoints: mockICPData.painPoints,
        valueProposition: mockICPData.valueProposition
      }))
      expect(result.tokensUsed).toBe(1500)
      expect(result.modelUsed).toBe('perplexity/sonar')
      expect(generateContent).toHaveBeenCalledOnce()
    })

    it('should validate ICP data structure', async () => {
      const invalidICPData = {
        industries: [],
        buyerRoles: ['CTO'],
        painPoints: ['Challenge'],
        valueProposition: 'Value'
      }

      vi.mocked(generateContent).mockResolvedValueOnce({
        ...successPayload,
        content: JSON.stringify(invalidICPData)
      })

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Validation error: ICP data must include at least one industry')
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

    it('should handle JSON parsing errors', async () => {
      vi.mocked(generateContent).mockResolvedValueOnce({
        ...successPayload,
        content: 'Invalid JSON {'
      })

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Validation error: Failed to parse ICP response')
    })

    it('should handle API errors gracefully (exhausted)', async () => {
      vi.mocked(generateContent).mockRejectedValue(
        new Error('OpenRouter API error: 429 Too Many Requests')
      )

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('OpenRouter API error: 429 Too Many Requests')

      expect(generateContent).toHaveBeenCalledTimes(3)
    })

    it('should validate all required ICP fields', async () => {
      const incompleteICPData = {
        industries: ['SaaS'],
        buyerRoles: [],
        painPoints: ['Challenge'],
        valueProposition: 'Value'
      }

      vi.mocked(generateContent).mockResolvedValueOnce({
        ...successPayload,
        content: JSON.stringify(incompleteICPData)
      })

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`)
      ).rejects.toThrow('Validation error: ICP data must include at least one buyer role')
    })

    it('should enforce 5-minute timeout', async () => {
      vi.mocked(generateContent).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 400000)) // 400 seconds
      )

      await expect(
        generateICPDocument(mockICPRequest, mockOrganizationId, 100, undefined, mockWorkflowId, `${mockWorkflowId}:step_1_icp`) // 100ms timeout for test
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
  })
})
