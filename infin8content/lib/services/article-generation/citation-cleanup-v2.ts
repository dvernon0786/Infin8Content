/**
 * Citation Cleanup Service V2
 * Purpose: Fix broken citations with better pattern matching
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
 * Clean broken citations from article content - V2 with better patterns
 */
function cleanBrokenCitations(content: string): string {
  let cleaned = content

  // Pattern 1: URLs with spaces in domain (https://www. igmguru.com)
  cleaned = cleaned.replace(/https?:\/\/([a-z0-9]+)\.\s+([a-z0-9.]+)/gi, 'https://$1.$2')

  // Pattern 2: URLs with newlines (https://www.\nigmguru.com)
  cleaned = cleaned.replace(/https?:\/\/([^\s)]*)\n([^\s)]*)/g, 'https://$1$2')

  // Pattern 3: URLs with spaces and dashes (sales - cloud - go)
  cleaned = cleaned.replace(/([a-z])\s+-\s+([a-z])/gi, '$1-$2')

  // Pattern 4: Broken markdown links with spaces in URL
  cleaned = cleaned.replace(/\]\(https?:\/\/([^\s)]*)\s+([^\s)]*)\)/g, '](https://$1$2)')

  // Pattern 5: Reference list formatting with spaces in URLs
  cleaned = cleaned.replace(/\]\s*\(https?:\/\/([^\s)]*)\s+([^\s)]*)\)/g, '](https://$1$2)')

  // Pattern 6: Remove extra spaces around dashes in URLs
  cleaned = cleaned.replace(/https?:\/\/([^\s)]*)\s+-\s+([^\s)]*)/g, 'https://$1-$2')

  // Pattern 7: Fix line breaks with spaces
  cleaned = cleaned.replace(/https?:\/\/([^\s)]*)\s*\n\s*([^\s)]*)/g, 'https://$1$2')

  // Pattern 8: Clean up multiple spaces in URLs
  cleaned = cleaned.replace(/https?:\/\/([^\s)]*)\s{2,}([^\s)]*)/g, 'https://$1$2')

  return cleaned
}

/**
 * Fix broken citations in all articles - V2
 */
export async function fixBrokenCitationsInDatabaseV2(): Promise<CleanupResult> {
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

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    if (!articles) {
      console.log('No articles found')
      return result
    }

    console.log(`Processing ${articles.length} articles...`)

    // Process each article
    for (const article of articles) {
      if (!Array.isArray(article.sections)) continue

      let sectionsModified = false
      let fixedCount = 0

      const cleanedSections = article.sections.map((section: any) => {
        if (section.content && typeof section.content === 'string') {
          const originalContent = section.content
          const cleanedContent = cleanBrokenCitations(section.content)

          if (originalContent !== cleanedContent) {
            sectionsModified = true
            fixedCount++
            result.brokenCitationsFixed++

            console.log(`Fixed section in article ${article.id}`)
            console.log(`  Before: ${originalContent.substring(0, 100)}...`)
            console.log(`  After:  ${cleanedContent.substring(0, 100)}...`)

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
        console.log(`Updating article ${article.id} with ${fixedCount} fixed sections...`)

        const { error: updateError } = await supabase
          .from('articles')
          .update({
            sections: cleanedSections,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError)
          throw updateError
        }

        result.articlesProcessed++
        result.sectionsFixed += fixedCount
      }
    }

    console.log('Cleanup complete:', result)
    return result
  } catch (error) {
    console.error('Error fixing broken citations:', error)
    throw error
  }
}

/**
 * Verify that citations are fixed - V2
 */
export async function verifyBrokenCitationsFixedV2(): Promise<number> {
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
        const content = section.content
        // Check for remaining broken patterns
        if (
          (content.match(/https?:\/\/[^\s)]*\s+[^\s)]*/) ||
          content.match(/https?:\/\/[^\s)]*\n[^\s)]*/) ||
          (content.includes('](https://') && !content.includes(')')))
        ) {
          brokenCount++
        }
      }
    }
  }

  return brokenCount
}
