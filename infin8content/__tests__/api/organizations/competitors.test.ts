// Competitor API Integration Tests
// Story 33.3: Configure Competitor URLs for Analysis

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/organizations/[orgId]/competitors/route';

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

  describe('POST /api/organizations/[orgId]/competitors', () => {
    it('should create competitor successfully', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        org_id: 'org-123',
      };

      const mockCompetitorData = {
        id: 'competitor-123',
        organization_id: 'org-123',
        url: 'https://example.com',
        domain: 'example.com',
        name: 'Example Competitor',
        is_active: true,
        created_by: 'user-123',
        created_at: '2026-01-31T00:00:00Z',
        updated_at: '2026-01-31T00:00:00Z',
      };

      // Mock getCurrentUser
      const { getCurrentUser } = require('@/lib/supabase/get-current-user');
      getCurrentUser.mockResolvedValue(mockCurrentUser);

      // Mock Supabase responses
      const { supabaseAdmin } = require('@/lib/supabase/server');
      const mockFrom = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }), // No existing competitor
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCompetitorData, error: null }),
          }),
        }),
      };
      supabaseAdmin.from.mockReturnValue(mockFrom);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com', name: 'Example Competitor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock params
      const params = { orgId: 'org-123' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://example.com');
      expect(data.domain).toBe('example.com');
      expect(data.name).toBe('Example Competitor');
    });

    it('should reject invalid URL format', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        org_id: 'org-123',
      };

      // Mock getCurrentUser
      const { getCurrentUser } = require('@/lib/supabase/get-current-user');
      getCurrentUser.mockResolvedValue(mockCurrentUser);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'invalid-url', name: 'Invalid Competitor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock params
      const params = { orgId: 'org-123' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid URL format');
    });

    it('should reject duplicate competitor domain', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        org_id: 'org-123',
      };

      const existingCompetitor = {
        id: 'existing-123',
        organization_id: 'org-123',
        url: 'https://example.com',
        domain: 'example.com',
      };

      // Mock getCurrentUser
      const { getCurrentUser } = require('@/lib/supabase/get-current-user');
      getCurrentUser.mockResolvedValue(mockCurrentUser);

      // Mock Supabase responses - existing competitor found
      const { supabaseAdmin } = require('@/lib/supabase/server');
      const mockFrom = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingCompetitor, error: null }),
            }),
          }),
        }),
      };
      supabaseAdmin.from.mockReturnValue(mockFrom);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com', name: 'Duplicate Competitor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock params
      const params = { orgId: 'org-123' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('Competitor already exists');
    });

    it('should handle authentication errors', async () => {
      // Mock getCurrentUser returning null
      const { getCurrentUser } = require('@/lib/supabase/get-current-user');
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com', name: 'Test Competitor' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock params
      const params = { orgId: 'org-123' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });
  });

  describe('GET /api/organizations/[orgId]/competitors', () => {
    it('should list competitors successfully', async () => {
      const mockCurrentUser = {
        id: 'user-123',
        org_id: 'org-123',
      };

      const mockCompetitors = [
        {
          id: 'competitor-1',
          url: 'https://example1.com',
          domain: 'example1.com',
          name: 'Competitor 1',
          is_active: true,
        },
        {
          id: 'competitor-2',
          url: 'https://example2.com',
          domain: 'example2.com',
          name: 'Competitor 2',
          is_active: true,
        },
      ];

      // Mock getCurrentUser
      const { getCurrentUser } = require('@/lib/supabase/get-current-user');
      getCurrentUser.mockResolvedValue(mockCurrentUser);

      // Mock Supabase responses
      const { supabaseAdmin } = require('@/lib/supabase/server');
      const mockFrom = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCompetitors, error: null }),
          }),
        }),
        }),
      };
      supabaseAdmin.from.mockReturnValue(mockFrom);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors');
      
      // Mock params
      const params = { orgId: 'org-123' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].domain).toBe('example1.com');
      expect(data[1].domain).toBe('example2.com');
    });

    it('should handle authentication errors', async () => {
      // Mock getCurrentUser returning null
      const { getCurrentUser } = require('@/lib/supabase/get-current-user');
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/organizations/org-123/competitors');
      
      // Mock params
      const params = { orgId: 'org-123' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication required');
    });
  });
});
