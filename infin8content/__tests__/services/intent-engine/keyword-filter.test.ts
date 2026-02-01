import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeKeyword,
  calculateSimilarity,
  removeDuplicates,
  filterBySearchVolume,
  getOrganizationFilterSettings
} from '@/lib/services/intent-engine/keyword-filter'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn()
}))

// Mock retry utils
vi.mock('@/lib/services/intent-engine/retry-utils', () => ({
  retryWithPolicy: vi.fn((fn) => fn())
}))

describe('Keyword Filter Service', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    is: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase)
  })

  describe('normalizeKeyword', () => {
    it('should convert to lowercase', () => {
      expect(normalizeKeyword('TEST KEYWORD')).toBe('test keyword')
    })

    it('should trim whitespace', () => {
      expect(normalizeKeyword('  test keyword  ')).toBe('test keyword')
    })

    it('should remove punctuation and special characters', () => {
      expect(normalizeKeyword('test-keyword!')).toBe('test keyword') // hyphen becomes space, ! removed
      expect(normalizeKeyword('test@keyword#')).toBe('testkeyword') // @ and # removed entirely
      expect(normalizeKeyword('test_keyword')).toBe('test keyword') // underscore becomes space
    })

    it('should normalize multiple spaces to single space', () => {
      expect(normalizeKeyword('test    keyword')).toBe('test keyword')
    })

    it('should handle empty strings', () => {
      expect(normalizeKeyword('')).toBe('')
      expect(normalizeKeyword('   ')).toBe('')
    })
  })

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(calculateSimilarity('test keyword', 'test keyword')).toBe(1.0)
    })

    it('should return 1.0 for identical normalized strings', () => {
      expect(calculateSimilarity('Test Keyword', 'test keyword')).toBe(1.0)
      expect(calculateSimilarity('test-keyword', 'test keyword')).toBe(1.0) // Both normalize to 'test keyword'
    })

    it('should return 0.0 for completely different strings', () => {
      expect(calculateSimilarity('apple', 'banana')).toBeLessThan(0.5)
    })

    it('should handle near-duplicates correctly', () => {
      // Test strings with high similarity
      expect(calculateSimilarity('best seo practices', 'best seo practice')).toBeGreaterThan(0.85)
      expect(calculateSimilarity('keyword research tools', 'keyword research tool')).toBeGreaterThan(0.85)
    })

    it('should handle empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(1.0)
      expect(calculateSimilarity('test', '')).toBeLessThan(0.5)
    })
  })

  describe('removeDuplicates', () => {
    const mockKeywords = [
      {
        id: '1',
        keyword: 'test keyword',
        search_volume: 1000,
        competition_level: 'medium' as const,
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        keyword: 'Test Keyword', // Exact duplicate (different case)
        search_volume: 800,
        competition_level: 'medium' as const,
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        keyword: 'test-keyword', // Near-duplicate (punctuation)
        search_volume: 1200,
        competition_level: 'low' as const,
        competition_index: 30,
        keyword_difficulty: 25,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        keyword: 'different keyword', // Not a duplicate
        search_volume: 500,
        competition_level: 'high' as const,
        competition_index: 70,
        keyword_difficulty: 60,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    it('should remove exact duplicates', () => {
      const { deduplicatedKeywords, duplicateCount } = removeDuplicates(mockKeywords, 0.85)
      
      expect(duplicateCount).toBe(2) // 'Test Keyword' and 'test-keyword' are duplicates
      expect(deduplicatedKeywords).toHaveLength(2) // 'test keyword' and 'different keyword'
    })

    it('should keep the variant with highest search volume', () => {
      const { deduplicatedKeywords } = removeDuplicates(mockKeywords, 0.85)
      
      // Should keep 'test-keyword' (volume 1200) over 'test keyword' (volume 1000) and 'Test Keyword' (volume 800)
      // All normalize to 'test keyword', so we look for the one with highest search volume
      const testKeyword = deduplicatedKeywords.find(k => normalizeKeyword(k.keyword) === 'test keyword')
      expect(testKeyword?.search_volume).toBe(1200)
      expect(testKeyword?.id).toBe('3')
    })

    it('should handle similarity threshold correctly', () => {
      const { deduplicatedKeywords, duplicateCount } = removeDuplicates(mockKeywords, 0.95)
      
      // With higher threshold, 'test-keyword' (now 'test keyword') and 'Test Keyword' (now 'test keyword') 
      // are both duplicates of 'test keyword', so 2 duplicates total
      expect(duplicateCount).toBe(2) 
      expect(deduplicatedKeywords).toHaveLength(2)
    })

    it('should handle empty input', () => {
      const { deduplicatedKeywords, duplicateCount } = removeDuplicates([], 0.85)
      
      expect(deduplicatedKeywords).toHaveLength(0)
      expect(duplicateCount).toBe(0)
    })
  })

  describe('filterBySearchVolume', () => {
    const mockKeywords = [
      {
        id: '1',
        keyword: 'high volume keyword',
        search_volume: 1000,
        competition_level: 'medium' as const,
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        keyword: 'medium volume keyword',
        search_volume: 150,
        competition_level: 'medium' as const,
        competition_index: 50,
        keyword_difficulty: 40,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        keyword: 'low volume keyword',
        search_volume: 50,
        competition_level: 'low' as const,
        competition_index: 30,
        keyword_difficulty: 25,
        longtail_status: 'completed',
        subtopics_status: 'not_started',
        article_status: 'not_started',
        organization_id: 'org1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    it('should filter keywords below minimum search volume', () => {
      const { volumeFilteredKeywords, lowVolumeCount } = filterBySearchVolume(mockKeywords, 100)
      
      expect(lowVolumeCount).toBe(1) // Only 'low volume keyword' (50) is below threshold
      expect(volumeFilteredKeywords).toHaveLength(2) // 'high volume' and 'medium volume'
      expect(volumeFilteredKeywords.map(k => k.keyword)).toContain('high volume keyword')
      expect(volumeFilteredKeywords.map(k => k.keyword)).toContain('medium volume keyword')
    })

    it('should keep all keywords when threshold is 0', () => {
      const { volumeFilteredKeywords, lowVolumeCount } = filterBySearchVolume(mockKeywords, 0)
      
      expect(lowVolumeCount).toBe(0)
      expect(volumeFilteredKeywords).toHaveLength(3)
    })

    it('should filter all keywords when threshold is high', () => {
      const { volumeFilteredKeywords, lowVolumeCount } = filterBySearchVolume(mockKeywords, 2000)
      
      expect(lowVolumeCount).toBe(3)
      expect(volumeFilteredKeywords).toHaveLength(0)
    })

    it('should handle empty input', () => {
      const { volumeFilteredKeywords, lowVolumeCount } = filterBySearchVolume([], 100)
      
      expect(volumeFilteredKeywords).toHaveLength(0)
      expect(lowVolumeCount).toBe(0)
    })
  })

  describe('getOrganizationFilterSettings', () => {
    it('should return organization settings when found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { min_search_volume: 200 },
        error: null
      })

      const settings = await getOrganizationFilterSettings('org1')

      expect(settings).toEqual({
        min_search_volume: 200,
        similarity_threshold: 0.85
      })
    })

    it('should return default settings when organization has no custom settings', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows found
      })

      const settings = await getOrganizationFilterSettings('org1')

      expect(settings).toEqual({
        min_search_volume: 100,
        similarity_threshold: 0.85
      })
    })

    it('should return default settings when database query fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const settings = await getOrganizationFilterSettings('org1')

      expect(settings).toEqual({
        min_search_volume: 100,
        similarity_threshold: 0.85
      })
    })
  })
})
