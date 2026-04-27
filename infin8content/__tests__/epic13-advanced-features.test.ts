/**
 * Epic 13: Phase 2 Advanced Features — Unit Tests
 * Stories: 13-1 (news), 13-2 (listicle+comparison), 13-3 (youtube), 13-5 (multi-language)
 */

import {
  generateComparisonTable,
  type ListicleItem,
} from '@/lib/services/article-generation/comparison-table-generator'

import {
  extractVideoId,
  formatTimestamp,
} from '@/lib/services/youtube/youtube-transcript-client'

// ---------------------------------------------------------------------------
// 13-2: Comparison Table Generator
// ---------------------------------------------------------------------------

describe('generateComparisonTable', () => {
  const items: ListicleItem[] = [
    {
      name: 'Notion',
      description: 'All-in-one workspace',
      features: ['Databases', 'Docs', 'Tasks'],
      pros: ['Flexible', 'Beautiful UI'],
      cons: ['Learning curve'],
      pricing: '$8/month',
      best_for: 'Teams needing flexibility',
      rating: 8.5,
      editors_choice: true,
    },
    {
      name: 'Trello',
      description: 'Visual kanban boards',
      features: ['Boards', 'Cards', 'Power-Ups'],
      pros: ['Simple', 'Free tier'],
      cons: ['Limited reporting'],
      pricing: 'Free / $5/month',
      best_for: 'Simple project tracking',
      rating: 7.5,
    },
  ]

  it('returns empty string for empty items', () => {
    expect(generateComparisonTable([], ['features', 'ratings'])).toBe('')
  })

  it('renders a table containing item names', () => {
    const html = generateComparisonTable(items, ['features', 'pros_cons', 'pricing', 'ratings', 'best_for'])
    expect(html).toContain('Notion')
    expect(html).toContain('Trello')
  })

  it('renders <table> tag', () => {
    const html = generateComparisonTable(items, ['features'])
    expect(html).toContain('<table')
    expect(html).toContain('</table>')
  })

  it('marks editors choice item with badge', () => {
    const html = generateComparisonTable(items, ['features'])
    expect(html).toContain("Editor's Choice")
  })

  it('renders pros column when pros_cons in criteria', () => {
    const html = generateComparisonTable(items, ['pros_cons'])
    expect(html).toContain('Flexible')
    expect(html).toContain('Learning curve')
  })

  it('does NOT render pricing column when not in criteria', () => {
    const html = generateComparisonTable(items, ['features'])
    expect(html).not.toContain('$8/month')
  })

  it('escapes HTML in item names to prevent XSS', () => {
    const xssItems: ListicleItem[] = [
      { name: '<script>alert(1)</script>', pros: ['ok'], cons: [] },
    ]
    const html = generateComparisonTable(xssItems, ['pros_cons'])
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

// ---------------------------------------------------------------------------
// 13-3: YouTube Transcript Service helpers
// ---------------------------------------------------------------------------

describe('extractVideoId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtu.be short URL with query params', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from shorts URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for invalid URL', () => {
    expect(extractVideoId('https://vimeo.com/12345')).toBeNull()
    expect(extractVideoId('not-a-url')).toBeNull()
    expect(extractVideoId('')).toBeNull()
  })
})

describe('formatTimestamp', () => {
  it('formats seconds under 1 hour as MM:SS', () => {
    expect(formatTimestamp(75)).toBe('1:15')
    expect(formatTimestamp(0)).toBe('0:00')
    expect(formatTimestamp(59)).toBe('0:59')
  })

  it('formats seconds over 1 hour as H:MM:SS', () => {
    expect(formatTimestamp(3661)).toBe('1:01:01')
    expect(formatTimestamp(7200)).toBe('2:00:00')
  })
})

// ---------------------------------------------------------------------------
// 13-1 & 13-5: Planner schema accepts new content_style values
// ---------------------------------------------------------------------------

describe('PlannerSchema content_style', () => {
  it('accepts new article type values', async () => {
    const { PlannerSchema } = await import('@/lib/services/article-generation/content-planner-agent')

    const base = {
      article_title: 'Test',
      target_keyword: 'test keyword',
      semantic_keywords: ['a', 'b', 'c', 'd', 'e'],
      article_structure: [],
      total_estimated_words: 1000,
    }

    expect(() => PlannerSchema.parse({ ...base, content_style: 'news' })).not.toThrow()
    expect(() => PlannerSchema.parse({ ...base, content_style: 'video_conversion' })).not.toThrow()
    expect(() => PlannerSchema.parse({ ...base, content_style: 'informative' })).not.toThrow()
    expect(() => PlannerSchema.parse({ ...base, content_style: 'listicle' })).not.toThrow()
    expect(() => PlannerSchema.parse({ ...base, content_style: 'invalid_type' })).toThrow()
  })
})
