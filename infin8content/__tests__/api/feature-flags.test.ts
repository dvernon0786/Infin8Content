// Feature Flags API Integration Tests
// Story 33-4: Enable Intent Engine Feature Flag

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server';

// Mock dependencies before imports
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Import after mocking
const { getCurrentUser } = await import('@/lib/supabase/get-current-user');
const { POST } = await import('@/app/api/feature-flags/route');

// Mock environment variables
const originalEnv = process.env;

describe('/api/feature-flags', () => {
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

  describe('POST /api/feature-flags', () => {
    it('should create feature flag successfully for admin user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'admin',
        org_id: 'org-123'
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockSession);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: 'org-123', name: 'Test Org' },
                error: null
              }))
            }))
          })),
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'flag-123',
                  organization_id: 'org-123',
                  flag_key: 'ENABLE_INTENT_ENGINE',
                  enabled: true,
                  created_at: '2026-01-31T12:00:00Z',
                  updated_at: '2026-01-31T12:00:00Z',
                  updated_by: 'user-123'
                },
                error: null
              }))
            }))
          }))
        }))
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: 'org-123',
          flag_key: 'ENABLE_INTENT_ENGINE',
          enabled: true
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: 'flag-123',
        organization_id: 'org-123',
        flag_key: 'ENABLE_INTENT_ENGINE',
        enabled: true,
        updated_at: '2026-01-31T12:00:00Z'
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getCurrentUser } = await import('@/lib/supabase/get-current-user');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: 'org-123',
          flag_key: 'ENABLE_INTENT_ENGINE',
          enabled: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required'
      });
    });

    it('should return 403 for non-admin user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'member',
        org_id: 'org-123'
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: 'org-123',
          flag_key: 'ENABLE_INTENT_ENGINE',
          enabled: true
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: 'Insufficient permissions. Admin role required.'
      });
    });

    it('should return 400 for invalid request body', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'admin',
        org_id: 'org-123'
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 404 for non-existent organization', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'admin',
        org_id: 'org-123'
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockSession);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Organization not found' }
              }))
            }))
          }))
        }))
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: 'org-123', // Same org but org doesn't exist
          flag_key: 'ENABLE_INTENT_ENGINE',
          enabled: true
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Organization not found'
      });
    });
  });
});
