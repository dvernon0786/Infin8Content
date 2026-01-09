/**
 * Tests for ArticleProgressService
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { articleProgressService } from '@/lib/services/progress';
import type { CreateArticleProgressParams, UpdateArticleProgressParams } from '@/types/article';

// Mock Supabase client
const mockClient = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockClient),
  createServiceRoleClient: vi.fn(() => mockClient),
}));

describe('ArticleProgressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProgress', () => {
    it('should create a new progress record', async () => {
      const mockParams: CreateArticleProgressParams = {
        article_id: 'article-123',
        org_id: 'org-123',
        status: 'queued',
        total_sections: 8,
        current_stage: 'Queued for generation',
      };

      const mockProgress = {
        id: 'progress-123',
        ...mockParams,
        current_section: 1,
        progress_percentage: 0,
        estimated_time_remaining: null,
        actual_time_spent: 0,
        word_count: 0,
        citations_count: 0,
        api_cost: 0,
        error_message: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      });

      const result = await articleProgressService.createProgress(mockParams);

      expect(result).toEqual(mockProgress);
      expect(mockClient.from).toHaveBeenCalledWith('article_progress');
      expect(mockClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          article_id: mockParams.article_id,
          org_id: mockParams.org_id,
          status: mockParams.status,
          total_sections: mockParams.total_sections,
          current_stage: mockParams.current_stage,
        })
      );
    });

    it('should throw error when creation fails', async () => {
      const mockParams: CreateArticleProgressParams = {
        article_id: 'article-123',
        org_id: 'org-123',
        status: 'queued',
        total_sections: 8,
        current_stage: 'Queued for generation',
      };

      mockClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            }),
          }),
        }),
      });

      await expect(articleProgressService.createProgress(mockParams)).rejects.toThrow(
        'Failed to create progress: Database error'
      );
    });
  });

  describe('getProgress', () => {
    it('should return progress for existing article', async () => {
      const mockProgress = {
        id: 'progress-123',
        article_id: 'article-123',
        org_id: 'org-123',
        status: 'writing' as const,
        current_section: 3,
        total_sections: 8,
        progress_percentage: 37.5,
        current_stage: 'Writing Section 3',
        estimated_time_remaining: 120,
        actual_time_spent: 180,
        word_count: 1250,
        citations_count: 5,
        api_cost: 0.15,
        error_message: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      });

      const result = await articleProgressService.getProgress('article-123');

      expect(result).toEqual(mockProgress);
      expect(mockClient.from).toHaveBeenCalledWith('article_progress');
      expect(mockClient.from().select).toHaveBeenCalledWith('*');
      expect(mockClient.from().select().eq).toHaveBeenCalledWith('article_id', 'article-123');
    });

    it('should return null for non-existent article', async () => {
      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } // Not found error code
            }),
          }),
        }),
      });

      const result = await articleProgressService.getProgress('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('should update progress and calculate percentage', async () => {
      const existingProgress = {
        id: 'progress-123',
        article_id: 'article-123',
        total_sections: 8,
      };

      const mockUpdates: UpdateArticleProgressParams = {
        current_section: 4,
        current_stage: 'Writing Section 4',
      };

      const updatedProgress = {
        ...existingProgress,
        current_section: 4,
        progress_percentage: 50, // 4/8 * 100
        current_stage: 'Writing Section 4',
        updated_at: new Date().toISOString(),
      };

      // Mock getProgress call
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingProgress, error: null }),
          }),
        }),
      });

      // Mock update call
      mockClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedProgress, error: null }),
            }),
          }),
        }),
      });

      const result = await articleProgressService.updateProgress('article-123', mockUpdates);

      expect(result).toEqual(updatedProgress);
      expect(mockClient.from).toHaveBeenCalledTimes(2);
      
      // The second call should be the update operation
      const updateMock = mockClient.from.mock.results[1].value.update;
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          current_section: 4,
          progress_percentage: 50,
          current_stage: 'Writing Section 4',
        })
      );
    });

    it('should use provided progress percentage', async () => {
      const mockUpdates: UpdateArticleProgressParams = {
        progress_percentage: 75,
        current_stage: 'Almost done',
      };

      const updatedProgress = {
        id: 'progress-123',
        article_id: 'article-123',
        progress_percentage: 75,
        current_stage: 'Almost done',
        updated_at: new Date().toISOString(),
      };

      mockClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedProgress, error: null }),
            }),
          }),
        }),
      });

      const result = await articleProgressService.updateProgress('article-123', mockUpdates);

      expect(result).toEqual(updatedProgress);
      expect(mockClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          progress_percentage: 75,
        })
      );
    });
  });

  describe('markCompleted', () => {
    it('should mark article as completed with statistics', async () => {
      const existingProgress = {
        id: 'progress-123',
        article_id: 'article-123',
        total_sections: 8,
      };

      const statistics = {
        word_count: 3247,
        citations_count: 12,
        api_cost: 0.78,
        total_time_seconds: 272, // 4 minutes 32 seconds
      };

      const completedProgress = {
        ...existingProgress,
        status: 'completed' as const,
        progress_percentage: 100,
        current_section: 8,
        current_stage: 'Completed',
        estimated_time_remaining: 0,
        actual_time_spent: 272,
        word_count: 3247,
        citations_count: 12,
        api_cost: 0.78,
        error_message: null,
        updated_at: new Date().toISOString(),
      };

      // Mock getProgress call
      mockClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingProgress, error: null }),
          }),
        }),
      });

      // Mock update call
      mockClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: completedProgress, error: null }),
            }),
          }),
        }),
      });

      const result = await articleProgressService.markCompleted('article-123', statistics);

      expect(result).toEqual(completedProgress);
      expect(result.status).toBe('completed');
      expect(result.progress_percentage).toBe(100);
      expect(result.word_count).toBe(3247);
      expect(result.citations_count).toBe(12);
      expect(result.api_cost).toBe(0.78);
      expect(result.actual_time_spent).toBe(272);
    });

    it('should throw error when progress record not found', async () => {
      const statistics = {
        word_count: 1000,
        citations_count: 5,
        api_cost: 0.25,
        total_time_seconds: 120,
      };

      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      await expect(articleProgressService.markCompleted('article-123', statistics))
        .rejects.toThrow('Progress record not found');
    });
  });

  describe('markFailed', () => {
    it('should mark article as failed with error message', async () => {
      const errorMessage = 'API timeout exceeded';
      
      const failedProgress = {
        id: 'progress-123',
        article_id: 'article-123',
        status: 'failed' as const,
        current_stage: 'Failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      };

      mockClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: failedProgress, error: null }),
            }),
          }),
        }),
      });

      const result = await articleProgressService.markFailed('article-123', errorMessage);

      expect(result).toEqual(failedProgress);
      expect(result.status).toBe('failed');
      expect(result.error_message).toBe(errorMessage);
      expect(result.current_stage).toBe('Failed');
    });
  });
});
