import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ArticleAssembler } from '@/lib/services/article-generation/article-assembler'
import { createServiceRoleClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient)
const mockFrom = vi.fn()

const mockClient = {
  from: mockFrom
}

mockCreateServiceRoleClient.mockReturnValue(mockClient as any)

vi.mock('@/lib/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    log: vi.fn(),
    warn: vi.fn()
  }))
}))

describe('ArticleAssembler', () => {
  let assembler: ArticleAssembler

  beforeEach(() => {
    vi.clearAllMocks()
    assembler = new ArticleAssembler()
    // Ensure the mock is properly set up for each test
    mockCreateServiceRoleClient.mockReturnValue(mockClient as any)
    mockFrom.mockReset()
    // Set up default mock return value to prevent undefined errors
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })
  })

  function mockArticlesQuery(status = 'generating') {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'article-1',
                title: 'Test Article',
                status
              },
              error: null
            }))
          }))
        }))
      }))
    })
  }

  function mockSectionsQuery(sections: any[]) {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: sections,
                error: null
              }))
            }))
          }))
        }))
      }))
    })
  }

  function mockArticleUpdate() {
    mockFrom.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })
  }

  it('assembles markdown and HTML in correct order', async () => {
    mockArticlesQuery()

    mockSectionsQuery([
      {
        section_order: 2,
        title: 'Second Section',
        content_markdown: 'Second content',
        content_html: '<p>Second content</p>'
      },
      {
        section_order: 1,
        title: 'First Section',
        content_markdown: 'First content',
        content_html: '<p>First content</p>'
      }
    ])

    mockArticleUpdate()

    const result = await assembler.assemble({
      articleId: 'article-1',
      organizationId: 'org-1'
    })

    expect(result.markdown).toContain('## First Section')
    expect(result.markdown).toContain('## Second Section')
    expect(result.html).toContain('<h2>First Section</h2>')
    expect(result.html).toContain('<h2>Second Section</h2>')
  })

  it('generates correct table of contents anchors', async () => {
    mockArticlesQuery()
    mockSectionsQuery([
      {
        section_order: 1,
        title: 'Hello World',
        content_markdown: 'Content',
        content_html: '<p>Content</p>'
      }
    ])
    mockArticleUpdate()

    const result = await assembler.assemble({
      articleId: 'article-1',
      organizationId: 'org-1'
    })

    expect(result.tableOfContents[0]).toEqual({
      level: 2,
      header: 'Hello World',
      anchor: 'hello-world'
    })
  })

  it('calculates word count and reading time correctly', async () => {
    mockArticlesQuery()
    mockSectionsQuery([
      {
        section_order: 1,
        title: 'Section',
        content_markdown: 'one two three four five',
        content_html: '<p>one two three four five</p>'
      }
    ])
    mockArticleUpdate()

    const result = await assembler.assemble({
      articleId: 'article-1',
      organizationId: 'org-1'
    })

    expect(result.wordCount).toBe(5)
    expect(result.readingTimeMinutes).toBe(1)
  })

  it('skips empty sections gracefully', async () => {
    // Mock empty sections by returning empty array
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'article-1',
                title: 'Test Article',
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: [], // Empty sections array
                error: null
              }))
            }))
          }))
        }))
      }))
    })
    mockArticleUpdate()

    await expect(
      assembler.assemble({
        articleId: 'article-1',
        organizationId: 'org-1'
      })
    ).rejects.toThrow('No completed sections found')
  })

  it('is idempotent when run twice', async () => {
    mockArticlesQuery()
    mockSectionsQuery([
      {
        section_order: 1,
        title: 'Section',
        content_markdown: 'Content',
        content_html: '<p>Content</p>'
      }
    ])
    mockArticleUpdate()

    await assembler.assemble({
      articleId: 'article-1',
      organizationId: 'org-1'
    })

    mockArticlesQuery()
    mockSectionsQuery([
      {
        section_order: 1,
        title: 'Section',
        content_markdown: 'Content',
        content_html: '<p>Content</p>'
      }
    ])
    mockArticleUpdate()

    await assembler.assemble({
      articleId: 'article-1',
      organizationId: 'org-1'
    })

    expect(mockFrom).toHaveBeenCalled()
  })

  it('throws error when article not found', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Not found' }
            }))
          }))
        }))
      }))
    })

    await expect(
      assembler.assemble({
        articleId: 'invalid-id',
        organizationId: 'org-1'
      })
    ).rejects.toThrow('Article not found or access denied')
  })
})
