// Publish API Integration Tests
// Story 5-1: Publish Article to WordPress (Minimal One-Click Export)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/articles/publish/route';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/wordpress-adapter', () => ({
  WordPressAdapter: vi.fn(),
}));

vi.mock('@/lib/supabase/publish-references', () => ({
  getPublishReference: vi.fn(),
  createPublishReference: vi.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/articles/publish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      WORDPRESS_PUBLISH_ENABLED: 'true',
      WORDPRESS_DEFAULT_USERNAME: 'testuser',
      WORDPRESS_DEFAULT_APPLICATION_PASSWORD: 'testpass',
      WORDPRESS_DEFAULT_SITE_URL: 'https://testsite.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/articles/publish', () => {
    it('should publish article successfully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          app_metadata: { org_id: 'org-123' },
        },
      };

      const mockArticle = {
        id: 'article-123',
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'completed',
        org_id: 'org-123',
      };

      const mockWordPressAdapter = {
        publishPost: vi.fn().mockResolvedValue({
          success: true,
          url: 'https://testsite.com/test-article',
          postId: 123,
        }),
      };

      // Mock Supabase responses
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseClient = {
        auth: { getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }) },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
              }),
            }),
          }),
        }),
      };
      createClient.mockReturnValue(mockSupabaseClient);

      // Mock publish references
      const { getPublishReference, createPublishReference } = require('@/lib/supabase/publish-references');
      getPublishReference.mockResolvedValue(null); // No existing reference
      createPublishReference.mockResolvedValue({
        id: 'ref-123',
        article_id: 'article-123',
        cms_type: 'wordpress',
        published_url: 'https://testsite.com/test-article',
      });

      // Mock WordPress adapter
      const { WordPressAdapter } = require('@/lib/services/wordpress-adapter');
      WordPressAdapter.mockImplementation(() => mockWordPressAdapter);

      const request = new NextRequest('http://localhost/api/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ articleId: 'article-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://testsite.com/test-article');
      expect(data.postId).toBe(123);

      expect(getPublishReference).toHaveBeenCalledWith('article-123', 'wordpress');
      expect(createPublishReference).toHaveBeenCalledWith({
        article_id: 'article-123',
        cms_type: 'wordpress',
        published_url: 'https://testsite.com/test-article',
        external_id: '123',
      });
    });

    it('should return existing URL if already published (idempotency)', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          app_metadata: { org_id: 'org-123' },
        },
      };

      const mockArticle = {
        id: 'article-123',
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'completed',
        org_id: 'org-123',
      };

      const existingReference = {
        id: 'ref-123',
        article_id: 'article-123',
        cms_type: 'wordpress',
        published_url: 'https://testsite.com/existing-article',
      };

      // Mock Supabase responses
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseClient = {
        auth: { getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }) },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
              }),
            }),
          }),
        }),
      };
      createClient.mockReturnValue(mockSupabaseClient);

      // Mock publish references
      const { getPublishReference } = require('@/lib/supabase/publish-references');
      getPublishReference.mockResolvedValue(existingReference); // Existing reference found

      const request = new NextRequest('http://localhost/api/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ articleId: 'article-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://testsite.com/existing-article');
      expect(data.alreadyPublished).toBe(true);

      // Should not call WordPress adapter if already published
      const { WordPressAdapter } = require('@/lib/services/wordpress-adapter');
      expect(WordPressAdapter).not.toHaveBeenCalled();
    });

    it('should reject when article is not completed', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          app_metadata: { org_id: 'org-123' },
        },
      };

      const mockArticle = {
        id: 'article-123',
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'generating', // Not completed
        org_id: 'org-123',
      };

      // Mock Supabase responses
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseClient = {
        auth: { getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }) },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
              }),
            }),
          }),
        }),
      };
      createClient.mockReturnValue(mockSupabaseClient);

      const request = new NextRequest('http://localhost/api/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ articleId: 'article-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must be completed before publishing');
    });

    it('should reject when feature flag is disabled', async () => {
      process.env.WORDPRESS_PUBLISH_ENABLED = 'false';

      const request = new NextRequest('http://localhost/api/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ articleId: 'article-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('currently disabled');
    });

    it('should handle authentication errors', async () => {
      // Mock Supabase auth error
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseClient = {
        auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: 'Auth error' }) },
      };
      createClient.mockReturnValue(mockSupabaseClient);

      const request = new NextRequest('http://localhost/api/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ articleId: 'article-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should handle WordPress publishing errors', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          app_metadata: { org_id: 'org-123' },
        },
      };

      const mockArticle = {
        id: 'article-123',
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'completed',
        org_id: 'org-123',
      };

      const mockWordPressAdapter = {
        publishPost: vi.fn().mockResolvedValue({
          success: false,
          error: 'WordPress authentication failed',
        }),
      };

      // Mock Supabase responses
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabaseClient = {
        auth: { getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }) },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
              }),
            }),
          }),
        }),
      };
      createClient.mockReturnValue(mockSupabaseClient);

      // Mock publish references
      const { getPublishReference } = require('@/lib/supabase/publish-references');
      getPublishReference.mockResolvedValue(null);

      // Mock WordPress adapter
      const { WordPressAdapter } = require('@/lib/services/wordpress-adapter');
      WordPressAdapter.mockImplementation(() => mockWordPressAdapter);

      const request = new NextRequest('http://localhost/api/articles/publish', {
        method: 'POST',
        body: JSON.stringify({ articleId: 'article-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('WordPress authentication failed');
    });
  });

  describe('GET /api/articles/publish', () => {
    it('should return feature flag status', async () => {
      const request = new NextRequest('http://localhost/api/articles/publish');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enabled).toBe(true);
      expect(data.configured).toBe(true);
    });

    it('should return false when credentials not configured', async () => {
      process.env.WORDPRESS_DEFAULT_USERNAME = '';
      process.env.WORDPRESS_DEFAULT_APPLICATION_PASSWORD = '';
      process.env.WORDPRESS_DEFAULT_SITE_URL = '';

      const request = new NextRequest('http://localhost/api/articles/publish');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enabled).toBe(true);
      expect(data.configured).toBe(false);
    });

    it('should return false when feature flag is disabled', async () => {
      process.env.WORDPRESS_PUBLISH_ENABLED = 'false';

      const request = new NextRequest('http://localhost/api/articles/publish');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enabled).toBe(false);
    });
  });
});
