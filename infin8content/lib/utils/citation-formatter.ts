/**
 * Citation Formatting Utilities
 * Story 4a.3: Real-Time Research Per Section (Tavily Integration)
 */

import type { TavilySource } from '@/lib/services/tavily/tavily-client'

export interface FormattedCitation {
  inText: string
  reference: string
  url: string
  isValid: boolean
}

/**
 * Format in-text citation
 * Format: "According to [Source Title](URL), ..."
 */
export function formatInTextCitation(source: TavilySource, context: string = 'According to'): string {
  const title = source.title || 'Source'
  const url = source.url || '#'
  
  return `${context} [${title}](${url}), `
}

/**
 * Format reference list entry
 * Format: "- [Source Title](URL) - Author Name (Date)"
 */
export function formatReference(source: TavilySource): string {
  const title = source.title || 'Source'
  const url = source.url || '#'
  const author = source.author || ''
  const date = source.published_date 
    ? new Date(source.published_date).getFullYear().toString()
    : ''
  
  let reference = `- [${title}](${url})`
  
  if (author) {
    reference += ` - ${author}`
  }
  
  if (date) {
    reference += ` (${date})`
  }
  
  return reference
}

/**
 * Format multiple citations for a section
 * Returns formatted citations with in-text and reference list formats
 */
export function formatCitations(sources: TavilySource[]): {
  inTextCitations: string[]
  referenceList: string[]
} {
  const inTextCitations: string[] = []
  const referenceList: string[] = []
  
  // Use top 5-10 sources (already ranked by relevance)
  const topSources = sources.slice(0, Math.min(sources.length, 10))
  
  for (const source of topSources) {
    // Generate in-text citation with variation
    const contexts = [
      'According to',
      'As noted in',
      'As reported by',
      'Research from',
      'Studies show'
    ]
    const context = contexts[Math.floor(Math.random() * contexts.length)]
    inTextCitations.push(formatInTextCitation(source, context))
    
    // Generate reference list entry
    referenceList.push(formatReference(source))
  }
  
  return {
    inTextCitations,
    referenceList
  }
}

/**
 * Validate URL format and accessibility (non-blocking)
 * Returns validation result without blocking execution
 */
export async function validateCitationUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return false
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    })
    
    clearTimeout(timeoutId)
    
    return response.ok
  } catch (error) {
    // URL validation failure shouldn't block citation inclusion
    console.warn(`Citation URL validation failed for ${url}:`, error)
    return false
  }
}

/**
 * Format citations for markdown content
 * Inserts in-text citations naturally and adds reference list at end
 */
export function formatCitationsForMarkdown(
  content: string,
  sources: TavilySource[],
  minCitations: number = 1,
  maxCitations: number = 3
): string {
  const { inTextCitations, referenceList } = formatCitations(sources)
  
  // Select citations to include (1-3 per section)
  const citationsToInclude = inTextCitations.slice(0, Math.min(maxCitations, inTextCitations.length))
  
  // Ensure minimum citations
  if (citationsToInclude.length < minCitations && inTextCitations.length >= minCitations) {
    citationsToInclude.push(...inTextCitations.slice(citationsToInclude.length, minCitations))
  }
  
  // Insert citations naturally into content (placeholder - Story 4a-5 will handle actual insertion)
  let contentWithCitations = content
  
  // Add reference list at end only if citations are actually included
  // Respect minCitations/maxCitations parameters
  const shouldIncludeReferences = citationsToInclude.length > 0 && maxCitations > 0
  if (shouldIncludeReferences && referenceList.length > 0) {
    // Only include references for citations that were actually included
    const referencesToInclude = referenceList.slice(0, citationsToInclude.length)
    contentWithCitations += '\n\n## References\n\n'
    contentWithCitations += referencesToInclude.join('\n')
  }
  
  return contentWithCitations
}

