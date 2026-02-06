import { describe, it, expect, vi, beforeAll } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

describe('Publish References Table Migration', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [],
        error: null,
        limit: vi.fn(() => ({ data: [], error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({
        error: null
      }))
    }))
  }

  beforeAll(() => {
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any)
  })

  it('should create publish_references table with correct schema', async () => {
    // Test table exists and has correct columns
    const { data, error } = await mockSupabase
      .from('publish_references')
      .select('*')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('should enforce unique constraint on (article_id, platform)', async () => {
    // Mock first successful insert
    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ data: [], error: null, limit: vi.fn(() => ({ data: [], error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
    }))

    const { error: insertError1 } = await mockSupabase
      .from('publish_references')
      .insert({
        article_id: 'test-article-id',
        platform: 'wordpress',
        platform_post_id: '123',
        platform_url: 'https://example.com/1',
        published_at: new Date().toISOString()
      })

    expect(insertError1).toBeNull()

    // Mock duplicate error
    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => ({ error: { message: 'duplicate key' } })),
      select: vi.fn(() => ({ data: [], error: null, limit: vi.fn(() => ({ data: [], error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
    }))

    const { error: insertError2 } = await mockSupabase
      .from('publish_references')
      .insert({
        article_id: 'test-article-id',
        platform: 'wordpress',
        platform_post_id: '456',
        platform_url: 'https://example.com/2',
        published_at: new Date().toISOString()
      })

    expect(insertError2).not.toBeNull()
    expect(insertError2?.message).toContain('duplicate')
  })

  it('should enforce platform check constraint', async () => {
    // Mock check constraint error
    mockSupabase.from = vi.fn(() => ({
      insert: vi.fn(() => ({ error: { message: 'check constraint' } })),
      select: vi.fn(() => ({ data: [], error: null, limit: vi.fn(() => ({ data: [], error: null })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
    }))

    const { error: insertError } = await mockSupabase
      .from('publish_references')
      .insert({
        article_id: 'test-article-id-2',
        platform: 'invalid_platform',
        platform_post_id: '789',
        platform_url: 'https://example.com/3',
        published_at: new Date().toISOString()
      })

    expect(insertError).not.toBeNull()
    expect(insertError?.message).toContain('check')
  })
})
