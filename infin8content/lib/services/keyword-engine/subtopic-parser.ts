// Subtopic parser utility for DataForSEO responses
// Story 37.1: Generate Subtopic Ideas via DataForSEO

import { KeywordSubtopic } from './dataforseo-client'

export interface DataForSEOSubtopicResponse {
  status_code: number
  status_message: string
  tasks?: Array<{
    status_code: number
    status_message: string
    result?: Array<{
      title: string
      type: string
      keywords: string[]
    }>
  }>
}

/**
 * Validates the structure of a DataForSEO subtopic generation response
 * @param response The API response to validate
 * @throws Error if response structure is invalid
 */
export function validateSubtopicResponse(response: DataForSEOSubtopicResponse): void {
  // Check for API-level errors
  if (response.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${response.status_message}`)
  }

  // Validate response structure
  if (!response.tasks || response.tasks.length === 0) {
    throw new Error('Invalid DataForSEO response format: no tasks found')
  }

  const task = response.tasks[0]
  if (task.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${task.status_message}`)
  }

  if (!task.result || !Array.isArray(task.result)) {
    throw new Error('Invalid DataForSEO response format: no result array found')
  }
}

/**
 * Parses subtopics from DataForSEO API response
 * @param response The validated API response
 * @returns Array of parsed subtopics
 */
export function parseSubtopics(response: DataForSEOSubtopicResponse): KeywordSubtopic[] {
  if (!response.tasks || response.tasks.length === 0) {
    return []
  }

  const task = response.tasks[0]
  if (!task.result || !Array.isArray(task.result)) {
    return []
  }

  // Filter and parse subtopics
  const subtopics = task.result
    .filter(item => item.type === 'subtopic' && item.title && Array.isArray(item.keywords))
    .map(item => ({
      title: item.title.trim(),
      keywords: item.keywords
        .map(k => k.trim())
        .filter(k => k.length > 0)
    }))
    .filter(subtopic => 
      subtopic.title.length > 0 && 
      subtopic.keywords.length > 0
    )

  return subtopics
}
