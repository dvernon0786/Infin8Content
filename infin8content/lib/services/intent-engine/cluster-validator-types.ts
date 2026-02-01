import { z } from 'zod'

// Validation configuration schema
export const ClusterValidationConfigSchema = z.object({
  minSpokes: z.number().min(1).default(2),
  maxSpokes: z.number().min(1).default(8),
  similarityThreshold: z.number().min(0).max(1).default(0.6)
})

export type ClusterValidationConfig = z.infer<typeof ClusterValidationConfigSchema>

// Validation result schema
export const ClusterValidationResultSchema = z.object({
  workflow_id: z.string().uuid(),
  hub_keyword_id: z.string().uuid(),
  validation_status: z.enum(['valid', 'invalid']),
  avg_similarity: z.number().min(0).max(1).optional(),
  spoke_count: z.number().min(0)
})

export type ClusterValidationResult = z.infer<typeof ClusterValidationResultSchema>

// Cluster data schema (from topic_clusters table)
export const TopicClusterSchema = z.object({
  id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  hub_keyword_id: z.string().uuid(),
  spoke_keyword_id: z.string().uuid(),
  similarity_score: z.number().min(0).max(1).optional(),
  created_at: z.string()
})

export type TopicCluster = z.infer<typeof TopicClusterSchema>

// Keyword data schema (from keywords table)
export const KeywordSchema = z.object({
  id: z.string().uuid(),
  keyword: z.string(),
  search_volume: z.number().min(0),
  competition_level: z.enum(['low', 'medium', 'high']),
  competition_index: z.number().min(0).max(100),
  keyword_difficulty: z.number().min(0).max(100),
  // Add other relevant fields as needed
})

export type Keyword = z.infer<typeof KeywordSchema>

// Validation error types
export class ValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Cluster validation summary
export interface ClusterValidationSummary {
  total_clusters: number
  valid_clusters: number
  invalid_clusters: number
  results: ClusterValidationResult[]
}
