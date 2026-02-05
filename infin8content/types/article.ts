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

/**
 * Article sections data model types
 * Story B-1: Article Sections Data Model
 */

export type SectionStatus = 
  | 'pending'
  | 'researching' 
  | 'researched'
  | 'writing'
  | 'completed'
  | 'failed';

export interface PlannerPayload {
  section_header: string;
  section_type: string;
  instructions: string;
  context_requirements: string[];
  estimated_words: number;
}

export interface ResearchPayload {
  queries: string[];
  results: {
    query: string;
    answer: string;
    citations: string[];
  }[];
  total_searches: number;
  research_timestamp: string;
}

export interface ArticleSection {
  id: string;
  article_id: string;
  section_order: number;
  section_header: string;
  section_type: string;
  planner_payload: PlannerPayload;
  research_payload?: ResearchPayload;
  content_markdown?: string;
  content_html?: string;
  status: SectionStatus;
  error_details?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Research Agent Types (Story B-2)
export interface ResearchAgentInput {
  sectionHeader: string;
  sectionType: string;
  priorSections: ArticleSection[];
  organizationContext: {
    name: string;
    description: string;
    website?: string;
    industry?: string;
  };
}

export interface ResearchAgentOutput {
  queries: string[];
  results: {
    query: string;
    answer: string;
    citations: string[];
  }[];
  totalSearches: number;
}

export interface CreateArticleSectionParams {
  article_id: string;
  section_order: number;
  section_header: string;
  section_type: string;
  planner_payload: PlannerPayload;
}

export interface UpdateArticleSectionParams {
  research_payload?: ResearchPayload;
  content_markdown?: string;
  content_html?: string;
  status?: SectionStatus;
  error_details?: Record<string, unknown>;
}
