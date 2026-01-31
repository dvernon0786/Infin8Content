// Intent Workflows Feature Flag Tests
// Story 33-4: Enable Intent Engine Feature Flag
// Task 3: Implement flag checking on workflow creation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server';

// Mock dependencies before imports
vi.mock('@/lib/supabase/get-current-user', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/utils/feature-flags', () => ({
  isFeatureFlagEnabled: vi.fn(),
}));

vi.mock('@/lib/services/audit-logger', () => ({
  logActionAsync: vi.fn(),
  extractIpAddress: vi.fn(),
  extractUserAgent: vi.fn(),
}));

// Import after mocking
const { getCurrentUser } = await import('@/lib/supabase/get-current-user');
const { isFeatureFlagEnabled } = await import('@/lib/utils/feature-flags');
const { POST } = await import('@/app/api/intent/workflows/route');

// Mock environment variables
const originalEnv = process.env;

describe('/api/intent/workflows - Feature Flag Checks', () => {
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

  describe('POST /api/intent/workflows', () => {
    it('should create workflow when feature flag is enabled', async () => {
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
      vi.mocked(isFeatureFlagEnabled).mockResolvedValue(true);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => ({
                  data: null,
                  error: { code: 'PGRST116' } // not found
                }))
              }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'workflow-123',
                  name: 'Test Workflow',
                  organization_id: 'org-123',
                  status: 'step_0_auth',
                  created_at: '2026-01-31T12:00:00Z',
                  updated_at: '2026-01-31T12:00:00Z'
                },
                error: null
              }))
            }))
          }))
        }))
      };

      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/intent/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow'
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
        id: 'workflow-123',
        name: 'Test Workflow',
        organization_id: 'org-123',
        status: 'step_0_auth',
        created_at: '2026-01-31T12:00:00Z'
      });

      // Verify feature flag was checked
      expect(isFeatureFlagEnabled).toHaveBeenCalledWith(
        'org-123',
        'ENABLE_INTENT_ENGINE'
      );
    });

    it('should return 403 when feature flag is disabled', async () => {
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
      vi.mocked(isFeatureFlagEnabled).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/intent/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow'
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
        error: 'Intent engine not enabled for this organization'
      });

      // Verify feature flag was checked
      expect(isFeatureFlagEnabled).toHaveBeenCalledWith(
        'org-123',
        'ENABLE_INTENT_ENGINE'
      );
    });

    it('should return 403 when feature flag check fails (database error)', async () => {
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
      vi.mocked(isFeatureFlagEnabled).mockResolvedValue(false); // Returns false on error

      const request = new NextRequest('http://localhost:3000/api/intent/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow'
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
        error: 'Intent engine not enabled for this organization'
      });

      // Verify feature flag was checked
      expect(isFeatureFlagEnabled).toHaveBeenCalledWith(
        'org-123',
        'ENABLE_INTENT_ENGINE'
      );
    });

    it('should check feature flag for user\'s organization when no organization_id specified', async () => {
      const mockSession = {
        user: {
          id: '12345678-1234-1234-1234-123456789012',
          email: 'test@example.com'
        },
        id: '12345678-1234-1234-1234-123456789012',
        email: 'test@example.com',
        first_name: 'Test',
        role: 'admin',
        org_id: '12345678-1234-1234-1234-123456789012' // User belongs to this org
      };

      vi.mocked(getCurrentUser).mockResolvedValue(mockSession);
      vi.mocked(isFeatureFlagEnabled).mockResolvedValue(true);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => ({
                  data: null,
                  error: { code: 'PGRST116' } // not found
                }))
              }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'workflow-123',
                  name: 'Test Workflow',
                  organization_id: '12345678-1234-1234-1234-123456789012',
                  status: 'step_0_auth',
                  created_at: '2026-01-31T12:00:00Z',
                  updated_at: '2026-01-31T12:00:00Z'
                },
                error: null
              }))
            }))
          }))
        }))
      };

      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const request = new NextRequest('http://localhost:3000/api/intent/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Workflow'
          // No organization_id specified - should use user's org
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organization_id).toBe('12345678-1234-1234-1234-123456789012');

      // Verify feature flag was checked for the user's organization
      expect(isFeatureFlagEnabled).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        'ENABLE_INTENT_ENGINE'
      );
    });
  });
});
