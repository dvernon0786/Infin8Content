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
  
  // Clean up the title and URL to prevent broken markdown
  const cleanTitle = title.replace(/[\[\]]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanUrl = url.replace(/[\[\]]/g, '').replace(/\s+/g, '').replace(/\n/g, '').trim()
  
  return `${context} [${cleanTitle}](${cleanUrl}), `
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
  
  // Clean up the title and URL to prevent broken markdown
  const cleanTitle = title.replace(/[\[\]]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanUrl = url.replace(/[\[\]]/g, '').replace(/\s+/g, '').replace(/\n/g, '').trim()
  const cleanAuthor = author.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim()
  
  let reference = `- [${cleanTitle}](${cleanUrl})`
  
  if (cleanAuthor) {
    reference += ` - ${cleanAuthor}`
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
  if (!sources || sources.length === 0) {
    return content
  }

  const { inTextCitations, referenceList } = formatCitations(sources)
  
  // Select citations to include (1-3 per section)
  let citationsToInclude = inTextCitations.slice(0, Math.min(maxCitations, inTextCitations.length))
  
  // Ensure minimum citations
  if (citationsToInclude.length < minCitations && inTextCitations.length >= minCitations) {
    citationsToInclude = inTextCitations.slice(0, minCitations)
  }

  if (citationsToInclude.length === 0) {
    return content
  }

  // Insert citations naturally into content
  let contentWithCitations = content
  
  // Find natural insertion points (after sentences, before paragraph breaks)
  // Split content into sentences and paragraphs for natural insertion
  const paragraphs = content.split(/\n\n+/)
  const insertionPoints: Array<{ paragraphIndex: number; position: number }> = []
  
  // Find good insertion points in each paragraph (after sentences)
  paragraphs.forEach((paragraph, pIndex) => {
    // Skip headings (lines starting with #)
    if (paragraph.trim().startsWith('#')) {
      return
    }
    
    // Find sentence endings (., !, ?) but not in URLs or markdown links
    const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s+(?=[\n\r]|$)/).filter(s => s.trim().length > 20)
    
    if (sentences.length > 0) {
      // Insert citations at natural breaks (after 1st, 2nd, etc. sentences)
      // Distribute citations throughout the paragraph
      const citationsPerParagraph = Math.ceil(citationsToInclude.length / Math.max(paragraphs.length, 1))
      const step = Math.max(1, Math.floor(sentences.length / (citationsPerParagraph + 1)))
      
      for (let i = step; i < sentences.length && insertionPoints.length < citationsToInclude.length; i += step) {
        const sentenceEnd = paragraph.indexOf(sentences[i]) + sentences[i].length
        insertionPoints.push({
          paragraphIndex: pIndex,
          position: sentenceEnd
        })
      }
    }
  })
  
  // If we didn't find enough insertion points, add them at paragraph breaks or end of content
  if (insertionPoints.length < citationsToInclude.length) {
    paragraphs.forEach((paragraph, pIndex) => {
      if (insertionPoints.length >= citationsToInclude.length) return
      if (paragraph.trim().startsWith('#')) return
      
      // Insert at end of paragraph if it's substantial
      if (paragraph.trim().length > 10) {
        insertionPoints.push({
          paragraphIndex: pIndex,
          position: paragraph.length
        })
      }
    })
    
    // If still not enough points, add at the end of the last paragraph
    if (insertionPoints.length < citationsToInclude.length && paragraphs.length > 0) {
      const lastParagraphIndex = paragraphs.length - 1
      if (!paragraphs[lastParagraphIndex].trim().startsWith('#')) {
        insertionPoints.push({
          paragraphIndex: lastParagraphIndex,
          position: paragraphs[lastParagraphIndex].length
        })
      }
    }
  }
  
  // Sort insertion points by position (reverse order to maintain indices when inserting)
  insertionPoints.sort((a, b) => {
    if (a.paragraphIndex !== b.paragraphIndex) {
      return b.paragraphIndex - a.paragraphIndex
    }
    return b.position - a.position
  })
  
  // Insert citations at identified points
  const citationsToInsert = citationsToInclude.slice(0, Math.min(insertionPoints.length, citationsToInclude.length))
  
  citationsToInsert.forEach((citation, index) => {
    const point = insertionPoints[index]
    if (point) {
      const paragraph = paragraphs[point.paragraphIndex]
      const before = paragraph.substring(0, point.position)
      const after = paragraph.substring(point.position)
      
      // Insert citation naturally (with proper spacing and punctuation)
      const citationText = citation.trim()
      // Remove trailing comma and add proper punctuation
      let cleanCitation = citationText.replace(/,$/, '')
      
      // Ensure proper spacing and punctuation
      if (before.trim().endsWith('.')) {
        // If sentence ends with period, add citation with comma
        cleanCitation = ` ${cleanCitation},`
      } else if (!before.trim().endsWith(' ')) {
        // Add space before citation if needed
        cleanCitation = ` ${cleanCitation},`
      } else {
        cleanCitation = `${cleanCitation},`
      }
      
      paragraphs[point.paragraphIndex] = before + cleanCitation + ' ' + after.trim()
    }
  })
  
  // Reconstruct content with citations
  contentWithCitations = paragraphs.join('\n\n')
  
  // Add reference list at end only if citations are actually included
  // Respect minCitations/maxCitations parameters
  const shouldIncludeReferences = citationsToInsert.length > 0 && maxCitations > 0
  if (shouldIncludeReferences && referenceList.length > 0) {
    // Only include references for citations that were actually included
    const referencesToInclude = referenceList.slice(0, citationsToInsert.length)
    
    // Check if content already has a References section
    if (!contentWithCitations.includes('## References')) {
      contentWithCitations += '\n\n## References\n\n'
      // Ensure proper formatting for reference list
      const formattedReferences = referencesToInclude.map(ref => {
        // Clean up reference formatting
        const cleanRef = ref.replace(/\s*-\s*/g, ' - ').replace(/\s*\(\s*/g, ' (').replace(/\s*\)\s*/g, ')')
        return cleanRef
      })
      contentWithCitations += formattedReferences.join('\n')
    }
  }
  
  return contentWithCitations
}

