/**
 * Article-related TypeScript types
 * Shared types for article data structures
 */

import { ArticleStatus } from '@/types/article';
export type { ArticleStatus };

export interface ArticleMetadata {
  id: string
  title: string | null
  keyword: string
  status: ArticleStatus
  target_word_count: number
  writing_style: string | null
  target_audience: string | null
  created_at: string
  updated_at: string
  org_id: string
  intent_workflow_id?: string | null
  slug?: string | null
  cms_status?: string | null
}

export interface SnapshotSection {
  header: string
  markdown: string
  html: string
  order: number
  section_type?: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
}

export interface ArticleWithSections {
  sections: SnapshotSection[] | null
}

