import { describe, it, expect, vi, beforeEach } from 'vitest'
import { publishArticleToWordPress, WordPressPublishInput, WordPressPublishOutput } from '../../../lib/services/publishing/wordpress-publisher'
import { getExistingPublishReference, getArticleForPublishing, createPublishReference } from '../../../lib/services/publishing/wordpress-publisher'

// Mock the database helpers directly with proper setup
vi.mock('../../../lib/services/publishing/wordpress-publisher', async () => {
  const actual = await vi.importActual('../../../lib/services/publishing/wordpress-publisher')
  return {
    ...actual,
    getExistingPublishReference: vi.fn(),
    getArticleForPublishing: vi.fn(),
    createPublishReference: vi.fn()
  }
})

// Mock WordPressAdapter
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

describe('WordPress Publisher Service', () => {
  let mockWordPressAdapter: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock WordPressAdapter
    const { WordPressAdapter } = await import('../../../lib/services/wordpress-adapter')
    mockWordPressAdapter = {
      publishPost: vi.fn()
    }
    vi.mocked(WordPressAdapter).mockImplementation(() => mockWordPressAdapter)
  })

  describe('publishArticleToWordPress', () => {
    const validInput: WordPressPublishInput = {
      articleId: 'article-123',
      organizationId: 'org-123',
      credentials: {
        site_url: 'https://example.com',
        username: 'testuser',
        application_password: 'testpass'
      }
    }

    it('should return existing publish reference if already published', async () => {
      // Mock existing publish reference
      vi.mocked(getExistingPublishReference).mockResolvedValue({
        data: {
          platform_url: 'https://example.com/existing-post',
          platform_post_id: '456'
        },
        error: null
      })

      const result = await publishArticleToWordPress(validInput)

      expect(result).toEqual({
        url: 'https://example.com/existing-post',
        postId: '456',
        alreadyPublished: true
      })

      expect(mockWordPressAdapter.publishPost).not.toHaveBeenCalled()
      expect(vi.mocked(createPublishReference)).not.toHaveBeenCalled()
    })

    it('should publish new article if not already published', async () => {
      // Mock no existing reference
      vi.mocked(getExistingPublishReference).mockResolvedValue({
        data: null,
        error: null
      })

      // Mock article data
      const mockArticle = {
        title: 'Test Article',
        content_html: '<p>Test content</p>',
        status: 'completed'
      }

      vi.mocked(getArticleForPublishing).mockResolvedValue({
        data: mockArticle,
        error: null
      })

      // Mock WordPress publish result
      const mockPublishResult = {
        postId: 789,
        url: 'https://example.com/new-post',
        status: 'publish'
      }

      mockWordPressAdapter.publishPost.mockResolvedValue(mockPublishResult)

      // Mock publish reference insert
      vi.mocked(createPublishReference).mockResolvedValue({
        error: null
      })

      const result = await publishArticleToWordPress(validInput)

      expect(result).toEqual({
        url: 'https://example.com/new-post',
        postId: '789',
        alreadyPublished: false
      })

      expect(mockWordPressAdapter.publishPost).toHaveBeenCalledWith({
        title: 'Test Article',
        content: '<p>Test content</p>',
        status: 'publish'
      })

      expect(vi.mocked(createPublishReference)).toHaveBeenCalledWith(
        expect.any(Object), // supabase client
        'article-123',
        '789',
        'https://example.com/new-post'
      )
    })

    it('should throw error if article not found', async () => {
      // Mock no existing reference
      vi.mocked(getExistingPublishReference).mockResolvedValue({
        data: null,
        error: null
      })

      // Mock article not found
      vi.mocked(getArticleForPublishing).mockResolvedValue({
        data: null,
        error: { message: 'Article not found' }
      })

      await expect(publishArticleToWordPress(validInput)).rejects.toThrow('Article not found')
    })

    it('should handle WordPress API errors gracefully', async () => {
      // Mock no existing reference
      vi.mocked(getExistingPublishReference).mockResolvedValue({
        data: null,
        error: null
      })

      // Mock article data
      const mockArticle = {
        title: 'Test Article',
        content_html: '<p>Test content</p>',
        status: 'completed'
      }

      vi.mocked(getArticleForPublishing).mockResolvedValue({
        data: mockArticle,
        error: null
      })

      // Mock WordPress API error
      mockWordPressAdapter.publishPost.mockRejectedValue(new Error('WordPress API Error'))

      await expect(publishArticleToWordPress(validInput)).rejects.toThrow('WordPress API Error')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error on publish reference check
      vi.mocked(getExistingPublishReference).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(publishArticleToWordPress(validInput)).rejects.toThrow('Database error')
    })
  })
})
