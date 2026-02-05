import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/articles/[article_id]/sections/[section_id]/write/route';
import { getCurrentUser } from '@/lib/supabase/get-current-user';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent';

// Mock dependencies
vi.mock('@/lib/supabase/get-current-user');
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/article-generation/content-writing-agent');

describe('POST /api/articles/[article_id]/sections/[section_id]/write', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-123',
      org_id: 'org-123'
    });
  });

  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/articles/article-123/sections/section-123/write', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request, { params: { article_id: 'article-123', section_id: 'section-123' } });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });

  it('validates section exists and belongs to organization', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const request = new Request('http://localhost:3000/api/articles/article-123/sections/section-123/write', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request, { params: { article_id: 'article-123', section_id: 'section-123' } });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Section not found');
  });

  it('validates section status is researched', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'section-123',
        status: 'pending', // Not researched
        section_header: 'Test Section',
        section_type: 'h2',
        research_payload: { findings: [] }
      },
      error: null
    });

    const request = new Request('http://localhost:3000/api/articles/article-123/sections/section-123/write', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request, { params: { article_id: 'article-123', section_id: 'section-123' } });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Section must be researched before writing');
  });

  it('successfully writes content for researched section', async () => {
    // Mock section lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'section-123',
        status: 'researched',
        section_header: 'Test Section',
        section_type: 'h2',
        research_payload: { findings: ['Test finding'] },
        section_order: 1
      },
      error: null
    });

    // Mock prior sections
    mockSupabase.order.mockResolvedValueOnce({
      data: [],
      error: null
    });

    // Mock organization defaults
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        content_defaults: {
          tone: 'professional',
          language: 'en',
          internal_links: true,
          global_instructions: 'Be informative'
        }
      },
      error: null
    });

    // Mock content writing agent
    vi.mocked(runContentWritingAgent).mockResolvedValue({
      markdown: '# Test Section\nThis is test content.',
      html: '<h1>Test Section</h1><p>This is test content.</p>',
      wordCount: 5
    });

    // Mock status update
    mockSupabase.update.mockResolvedValueOnce({ error: null });

    const request = new Request('http://localhost:3000/api/articles/article-123/sections/section-123/write', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request, { params: { article_id: 'article-123', section_id: 'section-123' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('completed');
    expect(data.data.markdown).toBe('# Test Section\nThis is test content.');
    expect(data.data.word_count).toBe(5);
  });

  it('handles content writing failures with retry logic', async () => {
    // Mock section lookup
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'section-123',
        status: 'researched',
        section_header: 'Test Section',
        section_type: 'h2',
        research_payload: { findings: [] },
        section_order: 1
      },
      error: null
    });

    // Mock prior sections
    mockSupabase.order.mockResolvedValueOnce({
      data: [],
      error: null
    });

    // Mock organization defaults
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        content_defaults: {
          tone: 'professional',
          language: 'en',
          internal_links: true,
          global_instructions: 'Be informative'
        }
      },
      error: null
    });

    // Mock content writing failure
    vi.mocked(runContentWritingAgent).mockRejectedValue(new Error('Content generation failed'));

    // Mock status update to failed
    mockSupabase.update.mockResolvedValueOnce({ error: null });

    const request = new Request('http://localhost:3000/api/articles/article-123/sections/section-123/write', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request, { params: { article_id: 'article-123', section_id: 'section-123' } });
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Content writing failed');
  });
});
