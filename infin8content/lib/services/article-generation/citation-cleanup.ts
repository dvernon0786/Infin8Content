/**
 * Citation Cleanup Service
 * Purpose: Fix broken citations in existing articles
 * Story: Article Formatting Fix (2026-01-13)
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface CleanupResult {
  articlesProcessed: number
  sectionsFixed: number
  brokenCitationsFound: number
  brokenCitationsFixed: number
}

/**
 * Clean broken citations from article content
 */
function cleanBrokenCitations(content: string): string {
  let cleaned = content

  // Fix URLs with spaces: https://www. domain.com -> https://www.domain.com
  cleaned = cleaned.replace(/https?:\/\/([^\s]*)\s+([^\s]*)/g, 'https://$1$2')

  // Fix dashed words with spaces: sales - cloud -> sales-cloud
  cleaned = cleaned.replace(/([a-z])\s+-\s+([a-z])/g, '$1-$2')

  // Fix broken reference formatting: remove spaces in URLs within markdown
  cleaned = cleaned.replace(/(\]\(https?:\/\/[^\)]*)\s+([^\)]*\))/g, '$1$2')

  // Remove extra spaces in URLs
  cleaned = cleaned.replace(/https?:\/\/([^\s)]*)\s+/g, 'https://$1')

  return cleaned
}

/**
 * Identify articles with broken citations
 */
async function findBrokenArticles(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('id')
    .filter('sections', 'cs', 'https://')

  if (error) throw error
  return data?.map((row: any) => row.id) || []
}

/**
 * Fix broken citations in all articles
 */
export async function fixBrokenCitationsInDatabase(): Promise<CleanupResult> {
  const result: CleanupResult = {
    articlesProcessed: 0,
    sectionsFixed: 0,
    brokenCitationsFound: 0,
    brokenCitationsFixed: 0,
  }

  try {
    // Get all articles with sections
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, sections')

    if (error) throw error
    if (!articles) return result

    result.brokenCitationsFound = articles.length

    // Process each article
    for (const article of articles) {
      if (!Array.isArray(article.sections)) continue

      let sectionsModified = false
      const cleanedSections = article.sections.map((section: any) => {
        if (section.content && typeof section.content === 'string') {
          const originalContent = section.content
          const cleanedContent = cleanBrokenCitations(section.content)

          if (originalContent !== cleanedContent) {
            sectionsModified = true
            result.brokenCitationsFixed++
            return {
              ...section,
              content: cleanedContent,
            }
          }
        }
        return section
      })

      // Update article if sections were modified
      if (sectionsModified) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            sections: cleanedSections,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        if (updateError) throw updateError

        result.articlesProcessed++
        result.sectionsFixed += cleanedSections.length
      }
    }

    return result
  } catch (error) {
    console.error('Error fixing broken citations:', error)
    throw error
  }
}

/**
 * Verify that citations are fixed
 */
export async function verifyBrokenCitationsFixed(): Promise<number> {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, sections')

  if (error) throw error
  if (!articles) return 0

  let brokenCount = 0
  for (const article of articles) {
    if (!Array.isArray(article.sections)) continue
    for (const section of article.sections) {
      if (section.content && typeof section.content === 'string') {
        if (
          (section.content.includes('https://') && section.content.includes(' ')) ||
          (section.content.includes('](https://') && !section.content.includes(')'))
        ) {
          brokenCount++
        }
      }
    }
  }

  return brokenCount
}

