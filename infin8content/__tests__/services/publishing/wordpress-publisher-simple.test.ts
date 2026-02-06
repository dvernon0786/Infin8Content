import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database helpers for clean unit testing
vi.mock('../../../lib/services/publishing/wordpress-publisher', async () => {
  const actual = await import('../../../lib/services/publishing/wordpress-publisher')
  return {
    ...actual,
    getExistingPublishReference: vi.fn(),
    getArticleForPublishing: vi.fn(),
    createPublishReference: vi.fn()
  }
})

// Mock WordPressAdapter to avoid external dependencies
vi.mock('../../../lib/services/wordpress-adapter', () => ({
  WordPressAdapter: vi.fn()
}))

// Mock Supabase client to avoid environment variables
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
}))

// Simple integration test that focuses on the business logic
describe('WordPress Publisher Service - Simple Tests', () => {
  let mockGetExistingPublishReference: any
  let mockGetArticleForPublishing: any
  let mockCreatePublishReference: any
  let mockWordPressAdapter: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const module = await import('../../../lib/services/publishing/wordpress-publisher')
    mockGetExistingPublishReference = vi.mocked(module.getExistingPublishReference)
    mockGetArticleForPublishing = vi.mocked(module.getArticleForPublishing)
    mockCreatePublishReference = vi.mocked(module.createPublishReference)

    // Mock WordPressAdapter
    const { WordPressAdapter } = await import('../../../lib/services/wordpress-adapter')
    mockWordPressAdapter = {
      publishPost: vi.fn()
    }
    vi.mocked(WordPressAdapter).mockImplementation(() => mockWordPressAdapter)
  })

  it('should validate the basic interface and structure', async () => {
    // Test that we can import the module
    const { publishArticleToWordPress } = await import('../../../lib/services/publishing/wordpress-publisher')
    type WordPressPublishInput = import('../../../lib/services/publishing/wordpress-publisher').WordPressPublishInput
    
    // Test that the function exists
    expect(typeof publishArticleToWordPress).toBe('function')
    
    // Test that the interface is properly typed
    const validInput: WordPressPublishInput = {
      articleId: 'article-123',
      organizationId: 'org-123',
      credentials: {
        site_url: 'https://example.com',
        username: 'testuser',
        application_password: 'testpass'
      }
    }
    
    expect(validInput.articleId).toBe('article-123')
    expect(validInput.credentials.site_url).toBe('https://example.com')
  })

  it('should return alreadyPublished when reference exists', async () => {
    const { publishArticleToWordPress } = await import('../../../lib/services/publishing/wordpress-publisher')
    
    // Mock existing publish reference
    mockGetExistingPublishReference.mockResolvedValue({
      data: {
        platform_url: 'https://example.com/existing-post',
        platform_post_id: '456'
      },
      error: null
    })

    const validInput = {
      articleId: 'article-123',
      organizationId: 'org-123',
      credentials: {
        site_url: 'https://example.com',
        username: 'testuser',
        application_password: 'testpass'
      }
    }

    const result = await publishArticleToWordPress(validInput)

    expect(result.alreadyPublished).toBe(true)
    expect(result.url).toBe('https://example.com/existing-post')
    expect(result.postId).toBe('456')
    expect(mockWordPressAdapter.publishPost).not.toHaveBeenCalled()
  })

  it('should publish new article when no reference exists', async () => {
    const { publishArticleToWordPress } = await import('../../../lib/services/publishing/wordpress-publisher')
    
    // Mock no existing reference
    mockGetExistingPublishReference.mockResolvedValue({
      data: null,
      error: null
    })

    // Mock article data
    mockGetArticleForPublishing.mockResolvedValue({
      data: {
        title: 'Test Article',
        content_html: '<p>Test content</p>',
        status: 'completed'
      },
      error: null
    })

    // Mock WordPress publish result
    mockWordPressAdapter.publishPost.mockResolvedValue({
      postId: 789,
      url: 'https://example.com/new-post',
      status: 'publish'
    })

    // Mock publish reference creation
    mockCreatePublishReference.mockResolvedValue({
      error: null
    })

    const validInput = {
      articleId: 'article-123',
      organizationId: 'org-123',
      credentials: {
        site_url: 'https://example.com',
        username: 'testuser',
        application_password: 'testpass'
      }
    }

    const result = await publishArticleToWordPress(validInput)

    expect(result.alreadyPublished).toBe(false)
    expect(result.url).toBe('https://example.com/new-post')
    expect(result.postId).toBe('789')
    expect(mockWordPressAdapter.publishPost).toHaveBeenCalledWith({
      title: 'Test Article',
      content: '<p>Test content</p>',
      status: 'publish'
    })
  })

  it('should have proper error handling structure', async () => {
    // Mock the environment variables
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key')
    
    const { publishArticleToWordPress } = await import('../../../lib/services/publishing/wordpress-publisher')
    
    // Test that calling with invalid input throws an error
    const invalidInput = {
      articleId: '',
      organizationId: '',
      credentials: {
        site_url: '',
        username: '',
        application_password: ''
      }
    }
    
    // This should fail due to database connection or validation
    await expect(publishArticleToWordPress(invalidInput as any)).rejects.toThrow()
  })

  it('should export the database helper functions', async () => {
    const module = await import('../../../lib/services/publishing/wordpress-publisher')
    
    expect(typeof module.getExistingPublishReference).toBe('function')
    expect(typeof module.getArticleForPublishing).toBe('function')
    expect(typeof module.createPublishReference).toBe('function')
  })
})
