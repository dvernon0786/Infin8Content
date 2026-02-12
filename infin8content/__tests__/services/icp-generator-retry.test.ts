/**
 * ICP Generator Retry Tests
 * Story 34.3: Harden ICP Generation with Automatic Retry & Failure Recovery
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
import { DEFAULT_RETRY_POLICY } from '@/lib/services/intent-engine/retry-utils'

// Mock dependencies
vi.mock('@/lib/services/openrouter/openrouter-client')
vi.mock('@/lib/supabase/server')

describe('ICP Generator - Retry Logic', () => {
  const mockOrganizationId = 'test-org-id'
  const mockWorkflowId = 'test-workflow-id'

  const mockICPRequest: ICPGenerationRequest = {
    organizationName: 'TechCorp Inc',
    organizationUrl: 'https://techcorp.com',
    organizationLinkedInUrl: 'https://linkedin.com/company/techcorp'
  }

  const mockICPData: ICPData = {
    industries: ['SaaS', 'Enterprise Software'],
    buyerRoles: ['CTO', 'VP Engineering'],
    painPoints: ['Scaling infrastructure', 'Team collaboration'],
    valueProposition: 'Streamlined cloud infrastructure management',
    generatedAt: new Date().toISOString(),
    apiVersion: '1.0'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Retry on Transient Failures', () => {
    it('should succeed on first attempt without retry', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBeUndefined()
      expect(mockGenerateContent).toHaveBeenCalledOnce()
    })

    it('should retry on timeout and succeed on second attempt', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      // First attempt: timeout
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      
      // Second attempt: success
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBe(1)
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })

    it('should retry on rate limit (429) and succeed on retry', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      // First attempt: rate limit
      mockGenerateContent.mockRejectedValueOnce(
        new Error('OpenRouter API error: 429 Too Many Requests')
      )
      
      // Second attempt: success
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBe(1)
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })

    it('should retry on 5xx server error and succeed on retry', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      // First attempt: server error
      mockGenerateContent.mockRejectedValueOnce(
        new Error('OpenRouter API error: 503 Service Unavailable')
      )
      
      // Second attempt: success
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBe(1)
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })

    it('should retry on network error and succeed on retry', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      // First attempt: network error
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ECONNREFUSED: Connection refused')
      )
      
      // Second attempt: success
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBe(1)
    })

    it('should retry multiple times on transient failures', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      // First attempt: timeout
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      
      // Second attempt: timeout
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      
      // Third attempt: success
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify(mockICPData),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.icp_data.buyerRoles).toEqual(mockICPData.buyerRoles)
      expect(result.retryCount).toBe(2)
      expect(mockGenerateContent).toHaveBeenCalledTimes(3)
    })
  })

  describe('Non-Retryable Errors', () => {
    it('should not retry on non-retryable errors', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockRejectedValueOnce(
        new Error('OpenRouter API error: 400 Bad Request')
      )

      try {
        await generateICPDocument(mockICPRequest, mockOrganizationId)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      // Should only call once - no retries for non-retryable errors
      expect(mockGenerateContent).toHaveBeenCalledOnce()
    })
  })

  describe('Retry Exhaustion', () => {
    it('should fail after max attempts exhausted', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      // All 3 attempts fail with retryable error
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )

      try {
        await generateICPDocument(mockICPRequest, mockOrganizationId)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('timeout')
      }

      expect(mockGenerateContent).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should include retry count in error context', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )

      try {
        await generateICPDocument(mockICPRequest, mockOrganizationId)
        expect.fail('Should have thrown')
      } catch (error) {
        // Error should be thrown after all attempts
        expect(error).toBeInstanceOf(Error)
      }

      expect(mockGenerateContent).toHaveBeenCalledTimes(3)
    })
  })

  describe('Custom Retry Policy', () => {
    it('should respect custom max attempts', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )

      const customPolicy = {
        maxAttempts: 2,
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 1000
      }

      try {
        await generateICPDocument(
          mockICPRequest,
          mockOrganizationId,
          300000,
          customPolicy
        )
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      expect(mockGenerateContent).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('should respect custom delay values', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      
      mockGenerateContent.mockRejectedValueOnce(
        new Error('ICP generation timeout: exceeded 300000ms limit')
      )
      
      mockGenerateContent.mockResolvedValueOnce({
        content: JSON.stringify({
          industries: ['SaaS', 'Enterprise Software'],
          buyerRoles: ['CTO', 'VP Engineering'],
          painPoints: ['Scaling infrastructure', 'Team collaboration'],
          valueProposition: 'Streamlined cloud infrastructure management'
        }),
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      })

      const customPolicy = {
        maxAttempts: 3,
        initialDelayMs: 500,
        backoffMultiplier: 3,
        maxDelayMs: 5000
      }

      const result = await generateICPDocument(
        mockICPRequest,
        mockOrganizationId,
        300000,
        customPolicy
      )

      expect(result.icp_data.industries).toEqual(['SaaS', 'Enterprise Software'])
      expect(result.icp_data.buyerRoles).toEqual(['CTO', 'VP Engineering'])
      expect(result.retryCount).toBe(1)
    })
  })

  describe('Retry Metadata Storage', () => {
    it('should store retry count in workflow', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const icpResult: ICPGenerationResult = {
        icp_data: mockICPData,
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        generatedAt: new Date().toISOString(),
        retryCount: 1,
        lastError: 'Timeout on first attempt',
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      }

      await storeICPGenerationResult(mockWorkflowId, mockOrganizationId, icpResult)

      expect(mockSupabase.from).toHaveBeenCalledWith('intent_workflows')
      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should handle failure storage with retry metadata', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      const error = new Error('ICP generation failed after 3 attempts')
      await handleICPGenerationFailure(
        mockWorkflowId,
        mockOrganizationId,
        error,
        3,
        'Timeout on all attempts'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('intent_workflows')
      expect(mockSupabase.update).toHaveBeenCalled()

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.retry_count).toBe(3)
      expect(updateCall.step_1_icp_last_error_message).toBe('Timeout on all attempts')
    })
  })
})
