/**
 * OpenRouter Service Tests
 * 
 * Unit tests for OpenRouter API client
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateContent, FREE_MODELS, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('OpenRouter Service Client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'test-api-key',
      NEXT_PUBLIC_SITE_URL: 'https://test.example.com',
    }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('generateContent', () => {
    const mockMessages: OpenRouterMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Write a short paragraph about AI.' }
    ]

    const mockSuccessResponse = {
      id: 'test-id',
      model: FREE_MODELS[0],
      choices: [{
        message: {
          role: 'assistant',
          content: 'AI is transforming technology...'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150
      }
    }

    it('should throw error when OPENROUTER_API_KEY is missing', async () => {
      delete process.env.OPENROUTER_API_KEY

      await expect(
        generateContent(mockMessages)
      ).rejects.toThrow('OPENROUTER_API_KEY environment variable is required')
    })

    it('should successfully generate content with default model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      })

      const result = await generateContent(mockMessages)

      expect(result.content).toBe('AI is transforming technology...')
      expect(result.tokensUsed).toBe(150)
      expect(result.modelUsed).toBe(FREE_MODELS[0])
      expect(result.promptTokens).toBe(50)
      expect(result.completionTokens).toBe(100)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const call = mockFetch.mock.calls[0]
      expect(call[0]).toBe('https://openrouter.ai/api/v1/chat/completions')
      expect(call[1]?.method).toBe('POST')
      expect(call[1]?.headers?.['Authorization']).toBe('Bearer test-api-key')
      expect(call[1]?.headers?.['Content-Type']).toBe('application/json')
      expect(call[1]?.headers?.['HTTP-Referer']).toBe('https://test.example.com')
      expect(call[1]?.headers?.['X-Title']).toBe('Infin8Content')
    })

    it('should use specified model when provided', async () => {
      const customModel = 'custom/model'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSuccessResponse, model: customModel })
      })

      const result = await generateContent(mockMessages, { model: customModel })

      expect(result.modelUsed).toBe(customModel)
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      expect(requestBody.model).toBe(customModel)
    })

    it('should use custom maxTokens when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      })

      await generateContent(mockMessages, { maxTokens: 3000 })

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      expect(requestBody.max_tokens).toBe(3000)
    })

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      })

      await generateContent(mockMessages, { temperature: 0.9 })

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      expect(requestBody.temperature).toBe(0.9)
    })

    it('should retry on 429 rate limit error with exponential backoff', async () => {
      const delaySpy = vi.spyOn(global, 'setTimeout')
      
      // First two attempts fail with 429
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'Rate limit exceeded' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'Rate limit exceeded' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse
        })

      const result = await generateContent(mockMessages, { maxRetries: 3 })

      expect(result.content).toBe('AI is transforming technology...')
      expect(mockFetch).toHaveBeenCalledTimes(3)
      // Verify exponential backoff delays were set (1s, 2s)
      expect(delaySpy).toHaveBeenCalledTimes(2)
    })

    it('should retry on 500 server error with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse
        })

      const result = await generateContent(mockMessages, { maxRetries: 3 })

      expect(result.content).toBe('AI is transforming technology...')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry on 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' })
      })

      await expect(
        generateContent(mockMessages)
      ).rejects.toThrow('OpenRouter API error: 401 Unauthorized')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should fallback to next model if first model fails', async () => {
      // First model fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      })
      // Second model succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSuccessResponse, model: FREE_MODELS[1] })
      })

      const result = await generateContent(mockMessages)

      expect(result.modelUsed).toBe(FREE_MODELS[1])
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should throw error if all models fail', async () => {
      // All models fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      })

      await expect(
        generateContent(mockMessages, { maxRetries: 1 })
      ).rejects.toThrow('OpenRouter API error')

      // Should try all 2 models, each with maxRetries=1 attempt = 2 total calls
      // (no retries since maxRetries=1 means 1 attempt per model)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should throw error if response has no choices', async () => {
      // Mock responses for all models (will try fallback chain)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-id',
            model: FREE_MODELS[0],
            choices: [],
            usage: { prompt_tokens: 50, completion_tokens: 0, total_tokens: 50 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-id',
            model: FREE_MODELS[1],
            choices: [],
            usage: { prompt_tokens: 50, completion_tokens: 0, total_tokens: 50 }
          })
        })

      await expect(
        generateContent(mockMessages)
      ).rejects.toThrow('OpenRouter API returned no choices')
      
      expect(mockFetch).toHaveBeenCalledTimes(2) // All 2 models tried
    })

    it('should throw error if response has empty content', async () => {
      // Mock responses for all models (will try fallback chain)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-id',
            model: FREE_MODELS[0],
            choices: [{
              message: { role: 'assistant', content: '' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 50, completion_tokens: 0, total_tokens: 50 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-id',
            model: FREE_MODELS[1],
            choices: [{
              message: { role: 'assistant', content: '' },
              finish_reason: 'stop'
            }],
            usage: { prompt_tokens: 50, completion_tokens: 0, total_tokens: 50 }
          })
        })

      await expect(
        generateContent(mockMessages)
      ).rejects.toThrow('OpenRouter API returned empty content')
      
      expect(mockFetch).toHaveBeenCalledTimes(2) // All 2 models tried
    })

    it('should handle network errors with retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSuccessResponse
        })

      const result = await generateContent(mockMessages, { maxRetries: 3 })

      expect(result.content).toBe('AI is transforming technology...')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should use default values for optional parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse
      })

      await generateContent(mockMessages)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      expect(requestBody.max_tokens).toBe(2000) // Default
      expect(requestBody.temperature).toBe(0.7) // Default
      expect(requestBody.top_p).toBe(0.9)
      expect(requestBody.frequency_penalty).toBe(0.0)
      expect(requestBody.presence_penalty).toBe(0.0)
    })
  })

  describe('FREE_MODELS', () => {
    it('should export FREE_MODELS constant', () => {
      expect(FREE_MODELS).toBeDefined()
      expect(Array.isArray(FREE_MODELS)).toBe(true)
      expect(FREE_MODELS.length).toBeGreaterThan(0)
    })

    it('should include Llama 3.3 as first model', () => {
      expect(FREE_MODELS[0]).toBe('meta-llama/llama-3.3-70b-instruct:free')
    })
  })
})

