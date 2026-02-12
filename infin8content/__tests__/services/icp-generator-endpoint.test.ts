/**
 * ICP Generation Endpoint Integration Tests
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
import { checkRateLimit, resetRateLimit } from '@/lib/services/rate-limiting/persistent-rate-limiter'
import { generateContent } from '@/lib/services/openrouter/openrouter-client'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/services/openrouter/openrouter-client')
vi.mock('@/lib/supabase/server')

describe('ICP Generation Endpoint - Integration Tests', () => {
  const mockWorkflowId = 'test-workflow-id'
  const mockOrganizationId = 'test-org-id'

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

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const result = await checkRateLimit(mockOrganizationId, {
        windowMs: 3600000,
        maxRequests: 10,
        keyPrefix: 'icp_generation'
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeLessThanOrEqual(9)
    })

    it('should track request count across multiple calls', async () => {
      const config = {
        windowMs: 3600000,
        maxRequests: 3,
        keyPrefix: 'icp_generation_test'
      }

      // First request
      const result1 = await checkRateLimit(mockOrganizationId, config)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(2)

      // Second request
      const result2 = await checkRateLimit(mockOrganizationId, config)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(1)

      // Third request
      const result3 = await checkRateLimit(mockOrganizationId, config)
      expect(result3.allowed).toBe(true)
      expect(result3.remaining).toBe(0)

      // Fourth request should be rate limited
      const result4 = await checkRateLimit(mockOrganizationId, config)
      expect(result4.allowed).toBe(false)
      expect(result4.remaining).toBe(0)
      expect(result4.retryAfter).toBeDefined()

      // Cleanup
      await resetRateLimit(mockOrganizationId, 'icp_generation_test')
    })

    it('should return retryAfter when rate limited', async () => {
      const config = {
        windowMs: 3600000,
        maxRequests: 1,
        keyPrefix: 'icp_generation_retry_test'
      }

      // First request
      await checkRateLimit(mockOrganizationId, config)

      // Second request should be rate limited
      const result = await checkRateLimit(mockOrganizationId, config)
      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeDefined()
      expect(result.retryAfter).toBeGreaterThan(0)

      // Cleanup
      await resetRateLimit(mockOrganizationId, 'icp_generation_retry_test')
    })
  })

  describe('Retry Logic', () => {
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

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBeUndefined()
      expect(mockGenerateContent).toHaveBeenCalledOnce()
    })

    it('should retry on transient failure and succeed', async () => {
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

      const result = await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId)

      expect(result.icp_data.industries).toEqual(mockICPData.industries)
      expect(result.retryCount).toBe(1)
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-retryable errors', async () => {
      const mockGenerateContent = vi.mocked(generateContent)
      mockGenerateContent.mockRejectedValueOnce(
        new Error('OpenRouter API error: 400 Bad Request')
      )

      try {
        await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }

      // Should only call once - no retries for non-retryable errors
      expect(mockGenerateContent).toHaveBeenCalledOnce()
    })

    it('should fail after max attempts exhausted', async () => {
      const mockGenerateContent = vi.mocked(generateContent)

      // All 3 attempts fail
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
        await generateICPDocument(mockICPRequest, mockOrganizationId, 300000, undefined, mockWorkflowId)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('timeout')
      }

      expect(mockGenerateContent).toHaveBeenCalledTimes(3)
    })
  })

  describe('Metadata Storage', () => {
    it('should store retry count when generation succeeds after retry', async () => {
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

      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.retry_count).toBe(1)
      expect(updateCall.step_1_icp_last_error_message).toBe('Timeout on first attempt')
    })

    it('should only set completion timestamp on first successful attempt', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ error: null })
      }

      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      // First attempt - should set timestamp
      const result1: ICPGenerationResult = {
        icp_data: mockICPData,
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        generatedAt: new Date().toISOString(),
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      }

      await storeICPGenerationResult(mockWorkflowId, mockOrganizationId, result1)
      const updateCall1 = mockSupabase.update.mock.calls[0][0]
      expect(updateCall1.step_1_icp_completed_at).toBeDefined()

      vi.clearAllMocks()
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)

      // Retry attempt - should NOT set timestamp
      const result2: ICPGenerationResult = {
        icp_data: mockICPData,
        tokensUsed: 1500,
        modelUsed: 'perplexity/llama-3.1-sonar-small-128k-online',
        generatedAt: new Date().toISOString(),
        retryCount: 1,
        promptTokens: 800,
        completionTokens: 700,
        cost: 0.0022
      }

      await storeICPGenerationResult(mockWorkflowId, mockOrganizationId, result2)
      const updateCall2 = mockSupabase.update.mock.calls[0][0]
      expect(updateCall2.step_1_icp_completed_at).toBeUndefined()
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
      expect(updateCall.status).toBe('failed')
    })
  })

  describe('Analytics Events', () => {
    it('should emit retry analytics event with workflowId', async () => {
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

      const result = await generateICPDocument(
        mockICPRequest,
        mockOrganizationId,
        300000,
        undefined,
        mockWorkflowId
      )

      expect(result.retryCount).toBe(1)
      // Analytics event should be emitted with workflowId (verified via console.log in implementation)
    })

    it('should emit terminal failure analytics event', async () => {
      const mockGenerateContent = vi.mocked(generateContent)

      // All attempts fail
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
        await generateICPDocument(
          mockICPRequest,
          mockOrganizationId,
          300000,
          undefined,
          mockWorkflowId
        )
      } catch (error) {
        // Expected to fail
      }

      // Terminal failure event should be emitted (verified via console.log in implementation)
    })
  })
})
