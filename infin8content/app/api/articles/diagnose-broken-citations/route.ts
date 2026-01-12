/**
 * API Endpoint: Diagnose Broken Citations
 * Purpose: Show actual broken citation patterns in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  try {
    // Get all articles with sections
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, sections')

    if (error) throw error
    if (!articles) return NextResponse.json({ samples: [] })

    const samples: any[] = []
    let brokenCount = 0

    // Find broken citations and collect samples
    for (const article of articles) {
      if (!Array.isArray(article.sections)) continue

      for (let i = 0; i < article.sections.length; i++) {
        const section = article.sections[i]
        if (section.content && typeof section.content === 'string') {
          const content = section.content

          // Check for broken patterns
          if (
            (content.includes('https://') && content.includes(' ')) ||
            (content.includes('](https://') && !content.includes(')'))
          ) {
            brokenCount++

            // Collect sample
            if (samples.length < 5) {
              // Find the broken part
              const urlMatch = content.match(/https?:\/\/[^\s)]*[\s\n][^\s)]*/)
              const brokenPart = urlMatch ? urlMatch[0] : content.substring(0, 200)

              samples.push({
                articleId: article.id,
                sectionIndex: i,
                brokenSample: brokenPart,
                fullContent: content.substring(0, 500),
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalBrokenCitations: brokenCount,
      samples,
      message: `Found ${brokenCount} broken citations. Showing first ${Math.min(5, samples.length)} samples.`,
    })
  } catch (error) {
    console.error('Error diagnosing broken citations:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
