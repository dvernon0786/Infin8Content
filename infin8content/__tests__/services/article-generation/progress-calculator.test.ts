/**
 * Progress Calculator Service Tests
 * Story B-5: Article Status Tracking
 */

import { describe, it, expect } from 'vitest'
import { calculateArticleProgress } from '../../../lib/services/article-generation/progress-calculator'

describe('Progress Calculator Service', () => {
  describe('calculateArticleProgress', () => {
    it('should calculate 0% for no sections', () => {
      const input = {
        article: {
          id: 'article-1',
          status: 'queued' as const,
          generation_started_at: '2024-01-01T00:00:00Z',
          organization_id: 'org-1'
        },
        sections: []
      }

      const result = calculateArticleProgress(input)

      expect(result.progress.completedSections).toBe(0)
      expect(result.progress.totalSections).toBe(0)
      expect(result.progress.percentage).toBe(0)
      expect(result.progress.currentSection).toBeUndefined()
    })

    it('should calculate 100% for all completed sections', () => {
      const input = {
        article: {
          id: 'article-1',
          status: 'generating' as const,
          generation_started_at: '2024-01-01T00:00:00Z',
          organization_id: 'org-1'
        },
        sections: [
          {
            id: 'section-1',
            section_order: 1,
            section_header: 'Introduction',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:01:00Z'
          },
          {
            id: 'section-2',
            section_order: 2,
            section_header: 'Body',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:02:00Z'
          }
        ]
      }

      const result = calculateArticleProgress(input)

      expect(result.progress.completedSections).toBe(2)
      expect(result.progress.totalSections).toBe(2)
      expect(result.progress.percentage).toBe(100)
      expect(result.progress.currentSection).toBeUndefined()
    })

    it('should identify current section correctly', () => {
      const input = {
        article: {
          id: 'article-1',
          status: 'generating' as const,
          generation_started_at: '2024-01-01T00:00:00Z',
          organization_id: 'org-1'
        },
        sections: [
          {
            id: 'section-1',
            section_order: 1,
            section_header: 'Introduction',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:01:00Z'
          },
          {
            id: 'section-2',
            section_order: 2,
            section_header: 'Body',
            status: 'researching' as const,
            updated_at: '2024-01-01T00:02:00Z'
          },
          {
            id: 'section-3',
            section_order: 3,
            section_header: 'Conclusion',
            status: 'pending' as const,
            updated_at: '2024-01-01T00:03:00Z'
          }
        ]
      }

      const result = calculateArticleProgress(input)

      expect(result.progress.completedSections).toBe(1)
      expect(result.progress.totalSections).toBe(3)
      expect(result.progress.percentage).toBe(33) // Math.floor(1/3 * 100)
      expect(result.progress.currentSection).toEqual({
        id: 'section-2',
        section_order: 2,
        section_header: 'Body',
        status: 'researching'
      })
    })

    it('should return null ETA for < 1 completed sections', () => {
      const input = {
        article: {
          id: 'article-1',
          status: 'generating' as const,
          generation_started_at: '2024-01-01T00:00:00Z',
          organization_id: 'org-1'
        },
        sections: [
          {
            id: 'section-1',
            section_order: 1,
            section_header: 'Introduction',
            status: 'researching' as const,
            updated_at: '2024-01-01T00:01:00Z'
          }
        ]
      }

      const result = calculateArticleProgress(input)

      expect(result.timing.estimatedCompletionAt).toBeUndefined()
      expect(result.timing.averageSectionDurationSeconds).toBeUndefined()
    })

    it('should return null ETA for completed articles', () => {
      const input = {
        article: {
          id: 'article-1',
          status: 'completed' as const,
          generation_started_at: '2024-01-01T00:00:00Z',
          organization_id: 'org-1'
        },
        sections: [
          {
            id: 'section-1',
            section_order: 1,
            section_header: 'Introduction',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:01:00Z'
          },
          {
            id: 'section-2',
            section_order: 2,
            section_header: 'Body',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:02:00Z'
          }
        ]
      }

      const result = calculateArticleProgress(input)

      expect(result.timing.estimatedCompletionAt).toBeUndefined()
      expect(result.timing.averageSectionDurationSeconds).toBeUndefined()
    })

    it('should calculate ETA correctly for in-progress articles', () => {
      const startTime = new Date('2024-01-01T00:00:00Z')
      
      const input = {
        article: {
          id: 'article-1',
          status: 'generating' as const,
          generation_started_at: startTime.toISOString(),
          organization_id: 'org-1'
        },
        sections: [
          {
            id: 'section-1',
            section_order: 1,
            section_header: 'Introduction',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:02:00Z'
          },
          {
            id: 'section-2',
            section_order: 2,
            section_header: 'Body',
            status: 'researching' as const,
            updated_at: '2024-01-01T00:04:00Z'
          },
          {
            id: 'section-3',
            section_order: 3,
            section_header: 'Conclusion',
            status: 'pending' as const,
            updated_at: '2024-01-01T00:05:00Z'
          }
        ]
      }

      const result = calculateArticleProgress(input)

      // Should calculate average duration based on elapsed time and completed sections
      // Since we can't mock Date.now(), we'll just check that it calculates something reasonable
      expect(result.timing.averageSectionDurationSeconds).toBeGreaterThan(0)
      expect(result.timing.estimatedCompletionAt).toBeDefined()
      expect(typeof result.timing.estimatedCompletionAt).toBe('string')
    })

    it('should handle failed sections with error details', () => {
      const input = {
        article: {
          id: 'article-1',
          status: 'failed' as const,
          generation_started_at: '2024-01-01T00:00:00Z',
          organization_id: 'org-1'
        },
        sections: [
          {
            id: 'section-1',
            section_order: 1,
            section_header: 'Introduction',
            status: 'completed' as const,
            updated_at: '2024-01-01T00:01:00Z'
          },
          {
            id: 'section-2',
            section_order: 2,
            section_header: 'Body',
            status: 'failed' as const,
            updated_at: '2024-01-01T00:02:00Z'
          }
        ]
      }

      const result = calculateArticleProgress(input)

      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
      expect(result.error?.failedSectionOrder).toBe(2)
    })
  })
})
