// WordPress Adapter Unit Tests
// Story 5-1: Publish Article to WordPress (Minimal One-Click Export)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WordPressAdapter, WordPressPostRequest } from '@/lib/services/wordpress-adapter';

// Mock fetch for testing
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('WordPressAdapter', () => {
  let adapter: WordPressAdapter;
  const mockCredentials = {
    username: 'testuser',
    application_password: 'testpass123',
    site_url: 'https://testsite.com',
  };

  beforeEach(() => {
    adapter = new WordPressAdapter(mockCredentials);
    mockFetch.mockClear();
  });

  describe('validateRequestContract', () => {
    it('should accept valid request with only allowed fields', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, link: 'https://testsite.com/test-article', status: 'publish' }),
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://testsite.com/test-article');
    });

    it('should reject request with forbidden fields', async () => {
      const invalidRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
        categories: [1, 2], // Forbidden field
        tags: ['test'], // Forbidden field
      };

      const result = await adapter.publishPost(invalidRequest as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden fields');
      expect(result.error).toContain('categories, tags');
    });

    it('should reject request with invalid status', async () => {
      const invalidRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'draft', // Only 'publish' is allowed
      };

      const result = await adapter.publishPost(invalidRequest as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status: draft');
    });

    it('should reject request without required fields', async () => {
      const invalidRequest = {
        title: 'Test Article',
        // Missing content
        status: 'publish',
      };

      const result = await adapter.publishPost(invalidRequest as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title and content are required');
    });
  });

  describe('API Error Handling', () => {
    it('should handle 401 authentication error', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Authentication failed',
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('authentication failed');
    });

    it('should handle 403 forbidden error', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Access forbidden',
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('forbidden');
    });

    it('should handle 404 not found error', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Endpoint not found',
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API endpoint not found');
    });

    it('should handle 429 rate limit error', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit exceeded');
    });

    it('should handle 500 server error', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });
  });

  describe('Timeout Handling', () => {
    it('should handle request timeout', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      // Mock fetch that rejects with AbortError when signal is aborted
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          // Simulate immediate abort signal
          setTimeout(() => {
            const error = new Error('Request timeout');
            error.name = 'AbortError';
            reject(error);
          }, 100); // Short delay to trigger abort
        })
      );

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Successful Publishing', () => {
    it('should publish successfully and return required fields', async () => {
      const validRequest: WordPressPostRequest = {
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish',
      };

      const mockResponse = {
        id: 123,
        link: 'https://testsite.com/test-article',
        status: 'publish',
        title: 'Test Article',
        content: '<p>Test content</p>',
        // Extra fields that should be ignored
        author: 1,
        categories: [1, 2],
        tags: ['test'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await adapter.publishPost(validRequest);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://testsite.com/test-article');
      expect(result.postId).toBe(123);
      expect(result.error).toBeUndefined();

      // Verify correct API endpoint and method were used
      expect(mockFetch).toHaveBeenCalledWith(
        'https://testsite.com/wp-json/wp/v2/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringMatching(/^Basic /),
          }),
          body: JSON.stringify(validRequest),
        })
      );
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Test Post' }],
      });

      const result = await adapter.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify correct endpoint and method
      expect(mockFetch).toHaveBeenCalledWith(
        'https://testsite.com/wp-json/wp/v2/posts?per_page=1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
          }),
        })
      );
    });

    it('should handle connection test failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await adapter.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });
  });
});
