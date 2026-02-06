// Publish References Unit Tests
// Story C-2: Publish References Table

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getPublishReference, 
  createPublishReference, 
  getPublishReferencesForArticle, 
  deletePublishReference 
} from '@/lib/supabase/publish-references';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(),
  auth: vi.fn(),
};

describe('Publish References Service', () => {
  beforeEach(() => {
    (createClient as any).mockReturnValue(mockSupabase);
    vi.clearAllMocks();
  });

  describe('getPublishReference', () => {
    it('should return existing publish reference', async () => {
      const mockReference = {
        id: 'ref-123',
        article_id: 'article-123',
        platform: 'wordpress',
        platform_post_id: '123',
        platform_url: 'https://testsite.com/article',
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = { single: vi.fn().mockResolvedValue({ data: mockReference, error: null }) };
      const mockEq = vi.fn().mockReturnValue(mockSelect);
      const mockFrom = { select: vi.fn().mockReturnValue(mockEq) };
      mockSupabase.from.mockReturnValue(mockFrom);

      const result = await getPublishReference('article-123', 'wordpress');

      expect(result).toEqual(mockReference);
      expect(mockSupabase.from).toHaveBeenCalledWith('publish_references');
      expect(mockEq).toHaveBeenCalledWith('article_id', 'article-123');
      expect(mockEq).toHaveBeenCalledWith('platform', 'wordpress');
    });

    it('should return null when no reference exists', async () => {
      const mockSelect = { 
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } 
        }) 
      };
      const mockEq = vi.fn().mockReturnValue(mockSelect);
      const mockFrom = { select: vi.fn().mockReturnValue(mockEq) };
      mockSupabase.from.mockReturnValue(mockFrom);

      const result = await getPublishReference('article-123', 'wordpress');

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      const mockSelect = { 
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'OTHER_ERROR', message: 'Database error' } 
        }) 
      };
      const mockEq = vi.fn().mockReturnValue(mockSelect);
      const mockFrom = { select: vi.fn().mockReturnValue(mockEq) };
      mockSupabase.from.mockReturnValue(mockFrom);

      await expect(getPublishReference('article-123', 'wordpress')).rejects.toThrow('Database error');
    });
  });

  describe('createPublishReference', () => {
    it('should create new publish reference', async () => {
      const newReference = {
        article_id: 'article-123',
        platform: 'wordpress',
        platform_post_id: '123',
        platform_url: 'https://testsite.com/article',
        published_at: '2024-01-01T00:00:00Z',
      };

      const createdReference = {
        id: 'ref-123',
        ...newReference,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = { single: vi.fn().mockResolvedValue({ data: createdReference, error: null }) };
      const mockInsert = { select: vi.fn().mockReturnValue(mockSelect) };
      const mockFrom = { insert: vi.fn().mockReturnValue(mockInsert) };
      mockSupabase.from.mockReturnValue(mockFrom);

      const result = await createPublishReference(newReference);

      expect(result).toEqual(createdReference);
      expect(mockSupabase.from).toHaveBeenCalledWith('publish_references');
      expect(mockFrom.insert).toHaveBeenCalledWith(newReference);
    });

    it('should throw error when creation fails', async () => {
      const newReference = {
        article_id: 'article-123',
        platform: 'wordpress',
        platform_post_id: '123',
        platform_url: 'https://testsite.com/article',
        published_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = { 
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Insert failed' } 
        }) 
      };
      const mockInsert = { select: vi.fn().mockReturnValue(mockSelect) };
      const mockFrom = { insert: vi.fn().mockReturnValue(mockInsert) };
      mockSupabase.from.mockReturnValue(mockFrom);

      await expect(createPublishReference(newReference)).rejects.toThrow('Insert failed');
    });
  });

  describe('getPublishReferencesForArticle', () => {
    it('should return all publish references for an article', async () => {
      const mockReferences = [
        {
          id: 'ref-123',
          article_id: 'article-123',
          platform: 'wordpress',
          platform_post_id: '123',
          platform_url: 'https://testsite.com/article',
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'ref-456',
          article_id: 'article-123',
          platform: 'wordpress',
          platform_post_id: '456',
          platform_url: 'https://anothersite.com/article',
          published_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({ data: mockReferences, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue(mockEq);
      const mockFrom = { select: vi.fn().mockReturnValue(mockSelect) };
      mockSupabase.from.mockReturnValue(mockFrom);

      const result = await getPublishReferencesForArticle('article-123');

      expect(result).toEqual(mockReferences);
      expect(mockSelect.eq).toHaveBeenCalledWith('article_id', 'article-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no references exist', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue(mockEq);
      const mockFrom = { select: vi.fn().mockReturnValue(mockSelect) };
      mockSupabase.from.mockReturnValue(mockFrom);

      const result = await getPublishReferencesForArticle('article-123');

      expect(result).toEqual([]);
    });

    it('should throw error for database errors', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Query failed' } 
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue(mockEq);
      const mockFrom = { select: vi.fn().mockReturnValue(mockSelect) };
      mockSupabase.from.mockReturnValue(mockFrom);

      await expect(getPublishReferencesForArticle('article-123')).rejects.toThrow('Query failed');
    });
  });

  describe('deletePublishReference', () => {
    it('should delete publish reference successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = { delete: vi.fn().mockReturnValue(mockDelete) };
      mockSupabase.from.mockReturnValue(mockFrom);

      const result = await deletePublishReference('ref-123');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('publish_references');
      expect(mockDelete.eq).toHaveBeenCalledWith('id', 'ref-123');
    });

    it('should throw error when deletion fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ 
        error: { message: 'Delete failed' } 
      });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = { delete: vi.fn().mockReturnValue(mockDelete) };
      mockSupabase.from.mockReturnValue(mockFrom);

      await expect(deletePublishReference('ref-123')).rejects.toThrow('Delete failed');
    });
  });
});
