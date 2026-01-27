// Outline generation service for article generation
// Story 4a.2: Section-by-Section Architecture and Outline Generation

import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOutline } from './outline-schema'

/**
 * Outline structure matching the database schema
 */
export interface Outline {
  introduction: {
    title: string
    h3_subsections: string[]
  }
  h2_sections: Array<{
    title: string
    h3_subsections: string[]
  }>
  conclusion: {
    title: string
  }
  faq: {
    title: string
    included: boolean
  } | null
}

/**
 * Keyword research data structure (from keyword_researches table)
 */
export interface KeywordResearchData {
  keyword: string
  searchVolume: number
  keywordDifficulty: number
  trend: number[]
  cpc?: number
  competition: 'Low' | 'Medium' | 'High'
  relatedKeywords?: string[]
}

/**
 * SERP analysis data structure
 */
export interface SerpAnalysis {
  commonH2Topics: string[]
  h2Frequency: Record<string, number>
  contentGaps: string[]
  topStructures: Array<{
    url: string
    h2s: string[]
    h3s: Record<string, string[]>
  }>
}

/**
 * Generate article outline based on keyword research and SERP analysis
 * 
 * @param keyword - The target keyword for the article
 * @param keywordResearch - Keyword research data from keyword_researches table
 * @param serpAnalysis - SERP analysis results from DataForSEO
 * @returns Generated outline structure
 * 
 * Performance: Must complete in < 20 seconds (NFR-P1 breakdown)
 */
export async function generateOutline(
  keyword: string,
  keywordResearch: KeywordResearchData | null,
  serpAnalysis: SerpAnalysis
): Promise<Outline> {
  const startTime = Date.now()

  // PLACEHOLDER: Replace with OpenRouter API call in Story 4a-5
  // For now, generate outline based on SERP analysis and keyword research
  const outline = await generateOutlineWithLLM(keyword, keywordResearch, serpAnalysis)

  // Validate outline against schema (enforces contract)
  const validatedOutline = validateOutline(outline)

  const duration = Date.now() - startTime
  if (duration > 20000) {
    console.warn(`⚠️ Outline generation took ${duration}ms (exceeds 20s NFR-P1 threshold)`)
  }

  return validatedOutline
}

/**
 * Generate outline using LLM (placeholder for Story 4a-5)
 * 
 * TODO: Replace with actual OpenRouter API call in Story 4a-5
 * This placeholder must match the future API interface exactly
 */
async function generateOutlineWithLLM(
  keyword: string,
  keywordResearch: KeywordResearchData | null,
  serpAnalysis: SerpAnalysis
): Promise<Outline> {
  // PLACEHOLDER: Generate mock outline structure matching expected format
  // This will be replaced with OpenRouter API call in Story 4a-5
  
  // Use SERP analysis to inform outline structure
  const commonTopics = serpAnalysis.commonH2Topics.slice(0, 8) // Use top 8 topics (will generate 5-10 H2 sections)
  const h2Count = Math.max(5, Math.min(10, commonTopics.length || 7)) // Ensure 5-10 H2 sections
  
  const h2Sections = commonTopics.slice(0, h2Count).map((topic, index) => ({
    title: topic || `Section ${index + 1} about ${keyword}`,
    h3_subsections: [
      `Understanding ${topic || keyword}`,
      `Key Features and Benefits`,
      `Best Practices`,
      `Common Challenges`
    ].slice(0, Math.floor(Math.random() * 3) + 2) // 2-4 H3 subsections per H2
  }))

  // If we don't have enough topics from SERP, add generic sections
  while (h2Sections.length < 5) {
    h2Sections.push({
      title: `Important Aspects of ${keyword}`,
      h3_subsections: ['Overview', 'Details', 'Examples']
    })
  }

  const outline: Outline = {
    introduction: {
      title: `Introduction to ${keyword}`,
      h3_subsections: [
        `Why ${keyword} Matters`,
        `What You'll Learn`
      ]
    },
    h2_sections: h2Sections,
    conclusion: {
      title: `Conclusion: ${keyword} Summary`
    },
    faq: {
      title: 'Frequently Asked Questions',
      included: keywordResearch?.searchVolume ? keywordResearch.searchVolume > 1000 : true // Include FAQ for high-volume keywords
    }
  }

  return outline
}

