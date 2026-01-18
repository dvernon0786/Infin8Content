// Keyword Research Service Tests
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { KeywordResearchService } from '@/lib/research/keyword-research';
import { DataForSEOClient } from '@/lib/research/dataforseo-client';
import { TavilyClient } from '@/lib/research/tavily-client';
import { researchService } from '@/lib/research/research-service';

// Mock the dependencies
jest.mock('@/lib/research/dataforseo-client');
jest.mock('@/lib/research/tavily-client');
jest.mock('@/lib/research/research-service');

const mockDataForSEOClient = DataForSEOClient as jest.MockedClass<typeof DataForSEOClient>;
const mockTavilyClient = TavilyClient as jest.MockedClass<typeof TavilyClient>;
const mockResearchService = researchService as jest.Mocked<typeof researchService>;

describe('KeywordResearchService', () => {
  let keywordResearchService: KeywordResearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    keywordResearchService = new KeywordResearchService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('researchKeyword', () => {
    it('should research keyword with DataForSEO API', async () => {
      const mockRequest = {
        keyword: 'test keyword',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        apiSource: 'dataforseo' as const
      };

      const mockData = {
        search_volume: 1000,
        keyword_difficulty: 50,
        cpc: 1.5,
        competition_level: 'medium' as const,
        trend_data: { '2024-01': 1000 }
      };

      const mockDataForSEOClientInstance = {
        researchKeyword: jest.fn().mockResolvedValue({ data: mockData, cost: 0.01 })
      };

      mockDataForSEOClient.mockImplementation(() => mockDataForSEOClientInstance);
      mockResearchService.getCache.mockResolvedValue(null);
      mockResearchService.setCache.mockResolvedValue();
      mockResearchService.createKeywordResearchResult.mockResolvedValue({
        id: 'result-id',
        keyword: 'test keyword'
      } as any);
      mockResearchService.createResearchSources.mockResolvedValue([]);
      mockResearchService.trackApiUsage.mockResolvedValue();

      const result = await keywordResearchService.researchKeyword(mockRequest);

      expect(result).toEqual(mockData);
      expect(mockDataForSEOClientInstance.researchKeyword).toHaveBeenCalledWith('test keyword');
      expect(mockResearchService.setCache).toHaveBeenCalledWith(
        'keyword_research_test_keyword_dataforseo',
        mockData,
        'keyword_research',
        24 * 60 * 60
      );
    });

    it('should research keyword with Tavily API', async () => {
      const mockRequest = {
        keyword: 'test keyword',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        apiSource: 'tavily' as const
      };

      const mockData = {
        sources: [
          {
            url: 'https://example.com',
            title: 'Test Source',
            description: 'Test Description',
            relevance_score: 0.9,
            publication_date: '2024-01-01',
            author: 'Test Author',
            domain: 'example.com'
          }
        ]
      };

      const mockTavilyClientInstance = {
        researchKeyword: jest.fn().mockResolvedValue({ data: mockData, cost: 0.005 })
      };

      mockTavilyClient.mockImplementation(() => mockTavilyClientInstance);
      mockResearchService.getCache.mockResolvedValue(null);
      mockResearchService.setCache.mockResolvedValue();
      mockResearchService.createKeywordResearchResult.mockResolvedValue({
        id: 'result-id',
        keyword: 'test keyword'
      } as any);
      mockResearchService.createResearchSources.mockResolvedValue([]);
      mockResearchService.trackApiUsage.mockResolvedValue();

      const result = await keywordResearchService.researchKeyword(mockRequest);

      expect(result).toEqual(mockData);
      expect(mockTavilyClientInstance.researchKeyword).toHaveBeenCalledWith('test keyword');
    });

    it('should return cached result when available', async () => {
      const mockRequest = {
        keyword: 'test keyword',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        apiSource: 'dataforseo' as const
      };

      const mockCachedData = {
        search_volume: 1000,
        keyword_difficulty: 50
      };

      mockResearchService.getCache.mockResolvedValue(mockCachedData);
      mockResearchService.trackApiUsage.mockResolvedValue();

      const result = await keywordResearchService.researchKeyword(mockRequest);

      expect(result).toEqual(mockCachedData);
      expect(mockResearchService.trackApiUsage).toHaveBeenCalledWith(
        'test-org-id',
        'test-user-id',
        'dataforseo',
        'cache',
        0
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockRequest = {
        keyword: 'test keyword',
        organizationId: 'test-org-id',
        userId: 'test-user-id',
        apiSource: 'dataforseo' as const
      };

      const mockDataForSEOClientInstance = {
        researchKeyword: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      mockDataForSEOClient.mockImplementation(() => mockDataForSEOClientInstance);
      mockResearchService.getCache.mockResolvedValue(null);
      mockResearchService.trackApiUsage.mockResolvedValue();

      await expect(keywordResearchService.researchKeyword(mockRequest)).rejects.toThrow('API Error');
      expect(mockResearchService.trackApiUsage).toHaveBeenCalledWith(
        'test-org-id',
        'test-user-id',
        'dataforseo',
        'research_failed',
        0
      );
    });
  });

  describe('researchMultipleKeywords', () => {
    it('should research multiple keywords in batches', async () => {
      const mockRequests = [
        {
          keyword: 'keyword1',
          organizationId: 'test-org-id',
          userId: 'test-user-id',
          apiSource: 'dataforseo' as const
        },
        {
          keyword: 'keyword2',
          organizationId: 'test-org-id',
          userId: 'test-user-id',
          apiSource: 'dataforseo' as const
        }
      ];

      const mockDataForSEOClientInstance = {
        researchKeyword: jest.fn().mockImplementation((keyword: string) => 
          Promise.resolve({ 
            data: { search_volume: 1000, keyword }, 
            cost: 0.01 
          })
        )
      };

      mockDataForSEOClient.mockImplementation(() => mockDataForSEOClientInstance);
      mockResearchService.getCache.mockResolvedValue(null);
      mockResearchService.setCache.mockResolvedValue();
      mockResearchService.createKeywordResearchResult.mockResolvedValue({
        id: 'result-id',
        keyword: 'test keyword'
      } as any);
      mockResearchService.createResearchSources.mockResolvedValue([]);
      mockResearchService.trackApiUsage.mockResolvedValue();

      const result = await keywordResearchService.researchMultipleKeywords(mockRequests);

      expect(result).toEqual({
        keyword1: { search_volume: 1000, keyword: 'keyword1' },
        keyword2: { search_volume: 1000, keyword: 'keyword2' }
      });
      expect(mockDataForSEOClientInstance.researchKeyword).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
      const mockRequests = [
        {
          keyword: 'keyword1',
          organizationId: 'test-org-id',
          userId: 'test-user-id',
          apiSource: 'dataforseo' as const
        },
        {
          keyword: 'keyword2',
          organizationId: 'test-org-id',
          userId: 'test-user-id',
          apiSource: 'dataforseo' as const
        }
      ];

      const mockDataForSEOClientInstance = {
        researchKeyword: jest.fn().mockImplementation((keyword: string) => {
          if (keyword === 'keyword1') {
            return Promise.resolve({ data: { search_volume: 1000, keyword }, cost: 0.01 });
          } else {
            return Promise.reject(new Error('API Error'));
          }
        })
      };

      mockDataForSEOClient.mockImplementation(() => mockDataForSEOClientInstance);
      mockResearchService.getCache.mockResolvedValue(null);
      mockResearchService.setCache.mockResolvedValue();
      mockResearchService.createKeywordResearchResult.mockResolvedValue({
        id: 'result-id',
        keyword: 'test keyword'
      } as any);
      mockResearchService.createResearchSources.mockResolvedValue([]);
      mockResearchService.trackApiUsage.mockResolvedValue();

      const result = await keywordResearchService.researchMultipleKeywords(mockRequests);

      expect(result).toEqual({
        keyword1: { search_volume: 1000, keyword: 'keyword1' }
      });
      expect(Object.keys(result)).not.toContain('keyword2');
    });
  });

  describe('getCachedResearchResults', () => {
    it('should get cached research results for multiple keywords', async () => {
      const keywords = ['keyword1', 'keyword2'];
      const apiSource = 'dataforseo';
      const organizationId = 'test-org-id';

      const mockCachedResults = [
        {
          id: 'result-id',
          keyword: 'keyword1',
          search_volume: 1000,
          keyword_difficulty: 50
        },
        {
          id: 'result-id',
          keyword: 'keyword2',
          search_volume: 2000,
          keyword_difficulty: 60
        }
      ];

      mockResearchService.getCachedKeywordResearchResult.mockImplementation((orgId, keyword, source) => {
        if (orgId === organizationId && source === apiSource) {
          return Promise.resolve(mockCachedResults.find(r => r.keyword === keyword) || null);
        }
        return Promise.resolve(null);
      });

      const result = await keywordResearchService.getCachedResearchResults(organizationId, keywords, apiSource);

      expect(result).toEqual({
        keyword1: {
          search_volume: 1000,
          keyword_difficulty: 50
        },
        keyword2: {
          search_volume: 2000,
          keyword_difficulty: 60
        }
      });
    });
  });

  describe('getResearchHistory', () => {
    it('should get research history with limit', async () => {
      const organizationId = 'test-org-id';
      const userId = 'test-user-id';
      const limit = 10;

      const mockResults = [
        {
          id: 'result-id',
          keyword: 'keyword1',
          search_volume: 1000,
          keyword_difficulty: 50,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'result-id',
          keyword: 'keyword2',
          search_volume: 2000,
          keyword_difficulty: 60,
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockResearchService.getKeywordResearchResults.mockResolvedValue(mockResults);

      const result = await keywordResearchService.getResearchHistory(organizationId, userId, limit);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        search_volume: 1000,
        keyword_difficulty: 50
      });
      expect(result[1]).toEqual({
        search_volume: 2000,
        keyword_difficulty: 60
      });
    });
  });

  describe('getResearchCosts', () => {
    it('should get research costs breakdown', async () => {
      const organizationId = 'test-org-id';
      const userId = 'test-user-id';

      const mockUsage = [
        {
          api_source: 'dataforseo',
          total_cost: 0.02
        },
        {
          api_source: 'tavily',
          total_cost: 0.01
        }
      ];

      mockResearchService.getApiUsage.mockResolvedValue(mockUsage);

      const result = await keywordResearchService.getResearchCosts(organizationId, userId);

      expect(result).toEqual({
        totalCost: 0.03,
        apiBreakdown: {
          dataforseo: 0.02,
          tavily: 0.01
        }
      });
    });
  });
});
