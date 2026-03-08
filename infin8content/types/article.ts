/**
 * Article progress tracking types for real-time updates
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

export type ArticleStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export const ARTICLE_STATUSES: ArticleStatus[] = [
  'draft',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
];

/**
 * Domain-aligned Article interface matching Supabase schema v2.2
 */
export interface Article {
  id: string;
  organization_id: string;
  workflow_id?: string;
  keyword_id?: string;
  title: string;
  slug?: string;
  content?: string;
  html_content?: string;
  word_count: number;
  reading_time_minutes: number;
  status: ArticleStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
  workflow_step?: string;
  generation_metadata: Record<string, any>;
  subtopic_id?: string;
  generation_queue_id?: string;

  // 🏗️ PIPELINE V2 FIELDS
  article_plan: ArticlePlannerOutput | null;
  generation_config: ContentDefaults | null;
  intent_workflow_id?: string;
  subtopic_data?: Array<{ title: string; type: string; keywords: string[] }> | null;
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

/**
 * Structured output from Content Planner Agent (Per Section)
 */
export interface SectionPlannerOutput {
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';
  header: string;
  supporting_points: string[];
  research_questions: string[];
  supporting_elements: string;
  estimated_words: number;
}

/**
 * Structured output from Content Planner Agent (Top Level)
 */
export interface ArticlePlannerOutput {
  article_title: string;
  content_style: 'informative' | 'listicle';
  target_keyword: string;
  semantic_keywords: string[];
  total_estimated_words: number;
  article_structure: SectionPlannerOutput[]; // 🆕 NEW: Stored for re-generation integrity
}

export interface ResearchPayload {
  queries: string[];
  results: {
    query: string;
    answer: string;
    citations: string[];
    source_urls?: string[]; // 🔗 NEW: Carry URLs through to the writer (Phase 6)
  }[];
  total_searches: number;
  research_timestamp: string;

  // 🏗️ PIPELINE V2 FIELDS
  consolidated_queries: string[];
  source_types_found: string[];
}

export interface ArticleSection {
  id: string;
  article_id: string;
  section_order: number;
  section_header: string;
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq';

  // 🏗️ PIPELINE V2 FIELD (Single source of truth)
  planner_output: SectionPlannerOutput | null;

  research_payload?: ResearchPayload;
  content_markdown?: string;
  content_html?: string;
  status: SectionStatus;
  error_details?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Research Agent Types (Story B-2)

export interface ResearchAgentOutput {
  queries: string[];
  results: {
    query: string;
    answer: string;
    citations: string[];
    source_urls?: string[];
  }[];
  total_searches: number;
  consolidated_queries: string[];
  source_types_found: string[];
}

export interface CreateArticleSectionParams {
  article_id: string;
  section_order: number;
  section_header: string;
  section_type: string;
  planner_output: SectionPlannerOutput;
}

export interface UpdateArticleSectionParams {
  research_payload?: ResearchPayload
  content_markdown?: string
  content_html?: string
  status?: SectionStatus
  error_details?: Record<string, unknown>
}

// Content Writing Agent Types (Story B-3)

export interface ContentWritingAgentOutput {
  markdown: string
  html: string
  wordCount: number
}

export interface ContentDefaults {
  // LEGACY BASE
  tone: string;
  language: string;
  style: string;
  target_word_count: number;
  auto_publish: boolean;

  // 🏗️ PIPELINE V2 CONFIG (ONBOARDING)
  brand_color: string;
  image_style: string;
  add_youtube_video: boolean;
  add_cta: boolean;
  add_infographics: boolean;
  add_emojis: boolean;
  internal_links: boolean;
  num_internal_links: number;

  // OPTIONAL EXTRAS
  global_instructions?: string;
  auto_publish_rules?: Record<string, any>;
}

// Article Progress Tracking Types (Story B-5)
export interface ArticleProgressResponse {
  articleId: string
  status: ArticleStatus

  progress: {
    completedSections: number
    totalSections: number
    percentage: number
    currentSection?: {
      id: string
      section_order: number
      section_header: string
      status: SectionStatus
    }
  }

  timing: {
    startedAt?: string
    estimatedCompletionAt?: string
    averageSectionDurationSeconds?: number
  }

  error?: {
    message: string
    failedSectionOrder?: number
    failedAt?: string
  }
}

export interface ProgressApiResponse {
  success: true
  data: ArticleProgressResponse
}

export interface ProgressApiErrorResponse {
  success: false
  error: string
  code?: 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_REQUEST' | 'DATABASE_ERROR' | 'INTERNAL_ERROR'
}

// Article Assembly Types (Story C-1)
export interface AssemblyInput {
  articleId: string
  organizationId: string
  allowReassembly?: boolean
}



export interface AssemblyOutput {
  wordCount: number
  readingTimeMinutes: number
}

export interface SnapshotSection {
  header: string
  markdown: string
  html: string
  order: number
}
