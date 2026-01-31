// Simple competitor API test to verify basic functionality
// Story 33.3: Configure Competitor URLs for Analysis

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/organizations/[orgId]/competitors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Basic functionality', () => {
    it('should be able to import the route handlers', async () => {
      // Test that we can import the route module
      const { POST, GET } = await import('@/app/api/organizations/[orgId]/competitors/route');
      
      expect(typeof POST).toBe('function');
      expect(typeof GET).toBe('function');
    });

    it('should handle POST request with authentication error', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/competitors/route');
      
      // Mock getCurrentUser returning null - use vi.mocked instead of require
      const { getCurrentUser } = vi.mocked(await import('@/lib/supabase/get-current-user'));
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com', name: 'Test Competitor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock params
      const params = Promise.resolve({ orgId: 'org-123' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });

    it('should handle GET request with authentication error', async () => {
      const { GET } = await import('@/app/api/organizations/[orgId]/competitors/route');
      
      // Mock getCurrentUser returning null - use vi.mocked instead of require
      const { getCurrentUser } = vi.mocked(await import('@/lib/supabase/get-current-user'));
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors');
      
      // Mock params
      const params = Promise.resolve({ orgId: 'org-123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });
  });
});
