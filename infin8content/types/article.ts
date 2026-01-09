/**
 * Article progress tracking types for real-time updates
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

export type ArticleProgressStatus = 
  | 'queued'
  | 'researching' 
  | 'writing'
  | 'generating'
  | 'completed'
  | 'failed';

export interface ArticleProgress {
  id: string;
  article_id: string;
  org_id: string;
  status: ArticleProgressStatus;
  current_section: number;
  total_sections: number;
  progress_percentage: number;
  current_stage: string;
  estimated_time_remaining: number | null; // seconds
  actual_time_spent: number; // seconds
  word_count: number;
  citations_count: number;
  api_cost: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleProgressParams {
  article_id: string;
  org_id: string;
  status: ArticleProgressStatus;
  total_sections: number;
  current_stage: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateArticleProgressParams {
  status?: ArticleProgressStatus;
  current_section?: number;
  progress_percentage?: number;
  current_stage?: string;
  estimated_time_remaining?: number | null;
  actual_time_spent?: number;
  word_count?: number;
  citations_count?: number;
  api_cost?: number;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProgressUpdate {
  article_id: string;
  status: ArticleProgressStatus;
  current_section: number;
  total_sections: number;
  progress_percentage: number;
  current_stage: string;
  estimated_time_remaining: number | null;
  word_count?: number;
  citations_count?: number;
  api_cost?: number;
  error_message?: string | null;
}

export interface GenerationStatistics {
  total_time: number; // seconds
  word_count: number;
  citations_count: number;
  api_cost: number;
  sections_completed: number;
  total_sections: number;
}
