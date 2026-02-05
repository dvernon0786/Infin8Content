/**
 * Progress Calculator Service
 * Story B-5: Article Status Tracking
 * 
 * Pure logic for calculating article generation progress
 * based on article sections data.
 */

import { SectionStatus, ArticleProgressResponse } from '@/types/article'

export interface ProgressCalculatorInput {
  article: {
    id: string
    status: 'queued' | 'generating' | 'completed' | 'failed'
    generation_started_at?: string
    organization_id: string
  }
  sections: Array<{
    id: string
    section_order: number
    section_header: string
    status: SectionStatus
    updated_at: string
  }>
}

export function calculateArticleProgress(input: ProgressCalculatorInput): ArticleProgressResponse {
  const { article, sections } = input

  // Sort sections by order to ensure consistent processing
  const sortedSections = [...sections].sort((a, b) => a.section_order - b.section_order)

  // Calculate completed sections
  const completedSections = sortedSections.filter(s => s.status === 'completed').length
  const totalSections = sortedSections.length

  // Calculate percentage (floor for clean integers)
  const percentage = totalSections > 0 ? Math.floor((completedSections / totalSections) * 100) : 0

  // Find current section (first non-completed, respects B-4 sequential semantics)
  const currentSection = sortedSections.find(s => s.status !== 'completed')
  const currentSectionData = currentSection ? {
    id: currentSection.id,
    section_order: currentSection.section_order,
    section_header: currentSection.section_header,
    status: currentSection.status
  } : undefined

  // Calculate ETA (average duration heuristic)
  let estimatedCompletionAt: string | undefined
  let averageSectionDurationSeconds: number | undefined

  if (completedSections >= 1 && article.status !== 'completed' && article.status !== 'failed' && article.generation_started_at) {
    const now = new Date()
    const startedAt = new Date(article.generation_started_at)
    const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000
    
    averageSectionDurationSeconds = elapsedSeconds / completedSections
    const remainingSections = totalSections - completedSections
    const estimatedRemainingSeconds = averageSectionDurationSeconds * remainingSections
    
    const etaTime = new Date(now.getTime() + estimatedRemainingSeconds * 1000)
    estimatedCompletionAt = etaTime.toISOString()
  }

  // Handle error details for failed articles
  let error: ArticleProgressResponse['error']
  if (article.status === 'failed') {
    const failedSection = sortedSections.find(s => s.status === 'failed')
    error = {
      message: 'Article generation failed',
      failedSectionOrder: failedSection?.section_order,
      failedAt: failedSection?.updated_at
    }
  }

  return {
    articleId: article.id,
    status: article.status,
    progress: {
      completedSections,
      totalSections,
      percentage,
      currentSection: currentSectionData
    },
    timing: {
      startedAt: article.generation_started_at,
      estimatedCompletionAt,
      averageSectionDurationSeconds
    },
    error
  }
}
