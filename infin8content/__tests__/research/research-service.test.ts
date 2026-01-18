// Research Service Tests
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ResearchService } from '@/lib/research/research-service';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  gt: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase)
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('ResearchService', () => {
  let researchService: ResearchService;

  beforeEach(() => {
    researchService = new ResearchService('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createResearchProject', () => {
    it('should create a research project successfully', async () => {
      const mockProject = {
        id: 'test-project-id',
        organization_id: 'test-org-id',
        user_id: 'test-user-id',
        title: 'Test Project',
        description: 'Test Description',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockProject, error: null });

      const result = await researchService.createResearchProject(
        'test-org-id',
        'test-user-id',
        'Test Project',
        'Test Description'
      );

      expect(result).toEqual(mockProject);
      expect(mockSupabase.from).toHaveBeenCalledWith('research_projects');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        organization_id: 'test-org-id',
        user_id: 'test-user-id',
        title: 'Test Project',
        description: 'Test Description',
        status: 'active'
      });
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(
        researchService.createResearchProject('test-org-id', 'test-user-id', 'Test Project')
      ).rejects.toThrow('Failed to create research project: Database error');
    });
  });

  describe('getResearchProjects', () => {
    it('should get research projects successfully', async () => {
      const mockProjects = [
        {
          id: 'test-project-id',
          organization_id: 'test-org-id',
          user_id: 'test-user-id',
          title: 'Test Project',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.mockResolvedValue({ data: mockProjects, error: null });

      const result = await researchService.getResearchProjects('test-org-id', 'test-user-id');

      expect(result).toEqual(mockProjects);
      expect(mockSupabase.from).toHaveBeenCalledWith('research_projects');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'test-org-id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should return empty array when no projects found', async () => {
      mockSupabase.mockResolvedValue({ data: null, error: null });

      const result = await researchService.getResearchProjects('test-org-id', 'test-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('createKeywordResearchResult', () => {
    it('should create keyword research result successfully', async () => {
      const mockResult = {
        id: 'test-result-id',
        organization_id: 'test-org-id',
        user_id: 'test-user-id',
        keyword: 'test keyword',
        search_volume: 1000,
        keyword_difficulty: 50,
        cpc: 1.5,
        competition_level: 'medium',
        trend_data: {},
        research_date: '2024-01-01T00:00:00Z',
        api_source: 'dataforseo',
        api_cost: 0.01,
        cached_until: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockResult, error: null });

      const result = await researchService.createKeywordResearchResult(
        'test-org-id',
        'test-user-id',
        'test keyword',
        {
          search_volume: 1000,
          keyword_difficulty: 50,
          cpc: 1.5,
          competition_level: 'medium',
          trend_data: {},
          api_source: 'dataforseo',
          api_cost: 0.01,
          cached_until: '2024-01-02T00:00:00Z'
        }
      );

      expect(result).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('keyword_research_results');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        organization_id: 'test-org-id',
        user_id: 'test-user-id',
        keyword: 'test keyword',
        search_volume: 1000,
        keyword_difficulty: 50,
        cpc: 1.5,
        competition_level: 'medium',
        trend_data: {},
        api_source: 'dataforseo',
        api_cost: 0.01,
        cached_until: '2024-01-02T00:00:00Z'
      });
    });
  });

  describe('getCachedKeywordResearchResult', () => {
    it('should get cached keyword research result successfully', async () => {
      const mockResult = {
        id: 'test-result-id',
        keyword: 'test keyword',
        api_source: 'dataforseo',
        cached_until: '2024-01-02T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({ data: mockResult, error: null });

      const result = await researchService.getCachedKeywordResearchResult(
        'test-org-id',
        'test keyword',
        'dataforseo'
      );

      expect(result).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('keyword_research_results');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 'test-org-id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('keyword', 'test keyword');
      expect(mockSupabase.eq).toHaveBeenCalledWith('api_source', 'dataforseo');
      expect(mockSupabase.gt).toHaveBeenCalledWith('cached_until', expect.any(String));
    });

    it('should return null when no cached result found', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      const result = await researchService.getCachedKeywordResearchResult(
        'test-org-id',
        'test keyword',
        'dataforseo'
      );

      expect(result).toBeNull();
    });
  });

  describe('trackApiUsage', () => {
    it('should track API usage successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await expect(
        researchService.trackApiUsage('test-org-id', 'test-user-id', 'dataforseo', 'research', 0.01)
      ).resolves.not.toThrow();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_api_usage', {
        p_organization_id: 'test-org-id',
        p_user_id: 'test-user-id',
        p_api_source: 'dataforseo',
        p_endpoint: 'research',
        p_cost: 0.01,
        p_usage_date: expect.any(String)
      });
    });

    it('should throw error when tracking fails', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'RPC error' } 
      });

      await expect(
        researchService.trackApiUsage('test-org-id', 'test-user-id', 'dataforseo', 'research', 0.01)
      ).rejects.toThrow('Failed to track API usage: RPC error');
    });
  });

  describe('setCache', () => {
    it('should set cache successfully', async () => {
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null });

      await expect(
        researchService.setCache('test-key', { data: 'test' }, 'test-type', 3600)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('research_cache');
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        cache_key: 'test-key',
        cache_data: { data: 'test' },
        cache_type: 'test-type',
        expires_at: expect.any(String)
      });
    });
  });

  describe('getCache', () => {
    it('should get cache successfully', async () => {
      const mockCacheData = { data: 'test' };
      mockSupabase.single.mockResolvedValue({ 
        data: { cache_data: mockCacheData }, 
        error: null 
      });

      const result = await researchService.getCache('test-key');

      expect(result).toEqual(mockCacheData);
      expect(mockSupabase.from).toHaveBeenCalledWith('research_cache');
      expect(mockSupabase.select).toHaveBeenCalledWith('cache_data');
      expect(mockSupabase.eq).toHaveBeenCalledWith('cache_key', 'test-key');
      expect(mockSupabase.gt).toHaveBeenCalledWith('expires_at', expect.any(String));
    });

    it('should return null when cache not found', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      const result = await researchService.getCache('test-key');

      expect(result).toBeNull();
    });
  });

  describe('clearExpiredCache', () => {
    it('should clear expired cache successfully', async () => {
      mockSupabase.delete.mockResolvedValue({ data: null, error: null });

      await expect(researchService.clearExpiredCache()).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('research_cache');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.lt).toHaveBeenCalledWith('expires_at', expect.any(String));
    });
  });
});
