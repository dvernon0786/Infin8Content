// Section processing service for article generation
// Story 4a.2: Section-by-Section Architecture and Outline Generation

import { createServiceRoleClient } from '@/lib/supabase/server'
import { Outline } from './outline-generator'
import { summarizeSections, fitInContextWindow } from '@/lib/utils/token-management'

/**
 * Section structure matching database schema
 */
export interface Section {
  section_type: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
  section_index: number
  h2_index?: number
  h3_index?: number
  title: string
  content: string
  word_count: number
  generated_at: string
  research_sources?: Array<{ title: string; url: string }>
  tokens_used?: number
}

/**
 * Process a single section of an article
 * 
 * @param articleId - Article ID
 * @param sectionIndex - Current section index
 * @param outline - Article outline
 * @returns Generated section
 */
export async function processSection(
  articleId: string,
  sectionIndex: number,
  outline: Outline
): Promise<Section> {
  const supabase = createServiceRoleClient()

  // Load article to get previous sections
  const { data: article } = await supabase
    .from('articles' as any)
    .select('sections, keyword')
    .eq('id', articleId)
    .single()

  if (!article) {
    throw new Error(`Article ${articleId} not found`)
  }

  const previousSections = (article.sections || []) as Section[]

  // Determine section type and details based on index
  const sectionInfo = getSectionInfo(sectionIndex, outline)
  
  // Summarize previous sections for context (token management)
  const summaries = summarizeSections(previousSections, 1500) // ~1500 tokens for summaries

  // Generate section content (placeholder for Story 4a-5)
  const content = await generateSectionContent(
    article.keyword,
    sectionInfo,
    summaries
  )

  const section: Section = {
    section_type: sectionInfo.type,
    section_index: sectionIndex,
    h2_index: sectionInfo.h2Index,
    h3_index: sectionInfo.h3Index,
    title: sectionInfo.title,
    content,
    word_count: content.split(/\s+/).length,
    generated_at: new Date().toISOString(),
    tokens_used: undefined // Will be set by LLM call in Story 4a-5
  }

  // Update article with new section
  const updatedSections = [...previousSections, section]
  
  await supabase
    .from('articles' as any)
    .update({
      sections: updatedSections,
      current_section_index: sectionIndex
    })
    .eq('id', articleId)

  return section
}

/**
 * Get section information based on index and outline
 */
function getSectionInfo(
  sectionIndex: number,
  outline: Outline
): {
  type: Section['section_type']
  title: string
  h2Index?: number
  h3Index?: number
} {
  // Introduction: index 0
  if (sectionIndex === 0) {
    return {
      type: 'introduction',
      title: outline.introduction.title
    }
  }

  // H2 sections: indices 1 to N (where N = number of H2 sections)
  const h2Count = outline.h2_sections.length
  if (sectionIndex >= 1 && sectionIndex <= h2Count && Number.isInteger(sectionIndex)) {
    const h2Index = sectionIndex
    const h2Section = outline.h2_sections[h2Index - 1]
    
    return {
      type: 'h2',
      title: h2Section.title,
      h2Index
    }
  }

  // H3 subsections: decimal indices (e.g., 1.1, 1.2, 2.1, etc.)
  // Check if sectionIndex is a decimal (has fractional part)
  if (!Number.isInteger(sectionIndex) && sectionIndex > 1 && sectionIndex < h2Count + 1) {
    const h2Index = Math.floor(sectionIndex)
    const h3Index = Math.round((sectionIndex - h2Index) * 10) // Extract decimal part
    
    if (h2Index >= 1 && h2Index <= h2Count) {
      const h2Section = outline.h2_sections[h2Index - 1]
      const h3Subsection = h2Section?.h3_subsections?.[h3Index - 1]
      
      if (h3Subsection) {
        return {
          type: 'h3',
          title: h3Subsection,
          h2Index,
          h3Index
        }
      }
    }
  }

  // Conclusion: index N+1
  const conclusionIndex = h2Count + 1
  if (sectionIndex === conclusionIndex) {
    return {
      type: 'conclusion',
      title: outline.conclusion.title
    }
  }

  // FAQ: index N+2 (if included)
  if (outline.faq?.included) {
    const faqIndex = h2Count + 2
    if (sectionIndex === faqIndex) {
      return {
        type: 'faq',
        title: outline.faq.title
      }
    }
  }

  throw new Error(`Invalid section index: ${sectionIndex}`)
}

/**
 * Generate section content (placeholder for Story 4a-5)
 * 
 * TODO: Replace with OpenRouter API call in Story 4a-5
 */
async function generateSectionContent(
  keyword: string,
  sectionInfo: { type: string; title: string },
  previousSummaries: string
): Promise<string> {
  // PLACEHOLDER: Generate mock content
  // Story 4a-5 will implement actual LLM content generation
  
  return `This is placeholder content for the section "${sectionInfo.title}" about ${keyword}.\n\n` +
    `The section will be generated using an LLM in Story 4a-5. ` +
    `Previous sections summary:\n${previousSummaries.slice(0, 200)}...`
}

/**
 * Process all sections sequentially according to outline
 * 
 * NOTE: This function is kept for potential future use, but the Inngest worker
 * (generate-article.ts) implements its own section processing loop for better
 * control over retry logic and error handling per section.
 * 
 * If you need to process sections outside of the Inngest worker context,
 * you can use this function.
 */
export async function processAllSections(
  articleId: string,
  outline: Outline
): Promise<Section[]> {
  const sections: Section[] = []
  
  // Process Introduction (index 0)
  sections.push(await processSection(articleId, 0, outline))

  // Process H2 sections sequentially (one at a time)
  for (let h2Index = 1; h2Index <= outline.h2_sections.length; h2Index++) {
    // Process H2 section
    sections.push(await processSection(articleId, h2Index, outline))

    // Process H3 subsections within this H2 section (decimal indices: 1.1, 1.2, etc.)
    const h2Section = outline.h2_sections[h2Index - 1]
    if (h2Section?.h3_subsections && Array.isArray(h2Section.h3_subsections)) {
      for (let h3Index = 1; h3Index <= h2Section.h3_subsections.length; h3Index++) {
        const sectionIndex = parseFloat(`${h2Index}.${h3Index}`)
        sections.push(await processSection(articleId, sectionIndex, outline))
      }
    }
  }

  // Process Conclusion
  const conclusionIndex = outline.h2_sections.length + 1
  sections.push(await processSection(articleId, conclusionIndex, outline))

  // Process FAQ (if included)
  if (outline.faq?.included) {
    const faqIndex = outline.h2_sections.length + 2
    sections.push(await processSection(articleId, faqIndex, outline))
  }

  return sections
}

