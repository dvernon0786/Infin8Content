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
 * Feature flag for LLM-based outline generation
 * 
 * When enabled, uses OpenRouter to generate contextual outlines.
 * When disabled, uses placeholder logic for backward compatibility.
 * 
 * Default: false (uses placeholder)
 * Set FEATURE_LLM_OUTLINE=true to enable AI outline generation
 */
const useLLMOutline = process.env.FEATURE_LLM_OUTLINE === 'true'

/**
 * Generate article outline based on keyword research and SERP analysis
 * 
 * @param keyword - The target keyword for the article
 * @param keywordResearch - Keyword research data from keyword_researches table
 * @param serpAnalysis - SERP analysis results from DataForSEO
 * @returns Generated outline structure
 * 
 * Performance: Must complete in < 20 seconds (NFR-P1 breakdown)
 * 
 * Behavior:
 * - FEATURE_LLM_OUTLINE=false: Uses placeholder logic (default, safe)
 * - FEATURE_LLM_OUTLINE=true: Uses OpenRouter AI (when implemented)
 */
export async function generateOutline(
  keyword: string,
  keywordResearch: KeywordResearchData | null,
  serpAnalysis: SerpAnalysis
): Promise<Outline> {
  const startTime = Date.now()

  // Route to appropriate implementation based on feature flag
  let outline: Outline

  if (useLLMOutline) {
    // LLM-based outline generation (Story 4a-5)
    // TODO: Implement OpenRouter call here
    outline = await generatePlaceholderOutline(keyword, keywordResearch, serpAnalysis)
    console.log(`[Outline] Using LLM-based generation (FEATURE_LLM_OUTLINE=true)`)
  } else {
    // Placeholder outline generation (current default)
    outline = await generatePlaceholderOutline(keyword, keywordResearch, serpAnalysis)
    console.log(`[Outline] Using placeholder generation (FEATURE_LLM_OUTLINE=false)`)
  }

  // Validate outline against schema (enforces contract)
  // This validation is mandatory for both paths
  const validatedOutline = validateOutline(outline)

  const duration = Date.now() - startTime
  if (duration > 20000) {
    console.warn(`⚠️ Outline generation took ${duration}ms (exceeds 20s NFR-P1 threshold)`)
  }

  return validatedOutline
}

/**
 * Generate outline using placeholder logic
 * 
 * This is the default implementation used when FEATURE_LLM_OUTLINE=false.
 * Generates mock outline structure matching expected format.
 */
async function generatePlaceholderOutline(
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

