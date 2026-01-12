/**
 * Standalone Citation Cleanup Script
 * Run with: node scripts/run-citation-cleanup.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function cleanBrokenCitations(content) {
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

async function main() {
  try {
    console.log('Starting citation cleanup...')

    // Get all articles
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, sections')

    if (error) throw error
    if (!articles) {
      console.log('No articles found')
      return
    }

    console.log(`Found ${articles.length} articles`)

    let totalProcessed = 0
    let totalFixed = 0
    let totalBroken = 0

    // First pass: identify broken citations
    for (const article of articles) {
      if (!Array.isArray(article.sections)) continue

      for (const section of article.sections) {
        if (section.content && typeof section.content === 'string') {
          const content = section.content
          if (
            (content.match(/https?:\/\/[^\s)]*\s+[^\s)]*/) ||
            content.match(/https?:\/\/[^\s)]*\n[^\s)]*/) ||
            (content.includes('](https://') && !content.includes(')')))
          ) {
            totalBroken++
            console.log(`\nBroken citation found in article ${article.id}:`)
            console.log(`  Sample: ${content.substring(0, 150)}...`)
          }
        }
      }
    }

    console.log(`\nTotal broken citations found: ${totalBroken}`)

    // Second pass: fix citations
    console.log('\nFixing citations...')
    for (const article of articles) {
      if (!Array.isArray(article.sections)) continue

      let modified = false
      const cleanedSections = article.sections.map((section) => {
        if (section.content && typeof section.content === 'string') {
          const original = section.content
          const cleaned = cleanBrokenCitations(section.content)

          if (original !== cleaned) {
            modified = true
            totalFixed++
            console.log(`Fixed section in article ${article.id}`)
          }

          return {
            ...section,
            content: cleaned,
          }
        }
        return section
      })

      if (modified) {
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            sections: cleanedSections,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id)

        if (updateError) throw updateError
        totalProcessed++
      }
    }

    console.log(`\nCleanup complete:`)
    console.log(`  Articles processed: ${totalProcessed}`)
    console.log(`  Citations fixed: ${totalFixed}`)
    console.log(`  Total broken found: ${totalBroken}`)

    // Verify
    console.log('\nVerifying fixes...')
    let stillBroken = 0
    for (const article of articles) {
      if (!Array.isArray(article.sections)) continue

      for (const section of article.sections) {
        if (section.content && typeof section.content === 'string') {
          const content = section.content
          if (
            (content.match(/https?:\/\/[^\s)]*\s+[^\s)]*/) ||
            content.match(/https?:\/\/[^\s)]*\n[^\s)]*/) ||
            (content.includes('](https://') && !content.includes(')')))
          ) {
            stillBroken++
          }
        }
      }
    }

    console.log(`Still broken after fix: ${stillBroken}`)
    console.log(`Fix successful: ${stillBroken === 0 ? 'YES' : 'NO'}`)
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
