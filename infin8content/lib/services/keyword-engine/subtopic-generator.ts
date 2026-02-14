// Subtopic generator service
// Story 37.1: Generate Subtopic Ideas via DataForSEO

import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateSubtopics, KeywordSubtopic } from './dataforseo-client'
import { resolveLocationCode, resolveLanguageCode } from '@/lib/config/dataforseo-geo'

export interface KeywordRecord {
  id: string
  longtail_keyword: string
  organization_id: string
  longtail_status: string
  subtopics_status: string
}

export interface OrganizationSettings {
  locationCode: number
  languageCode: string
}

export class KeywordSubtopicGenerator {
  private supabase = createServiceRoleClient()

  /**
   * Generate subtopics for a keyword
   * @param keywordId The keyword ID to generate subtopics for
   * @returns Array of generated subtopics
   */
  async generate(keywordId: string): Promise<KeywordSubtopic[]> {
    // Validate input
    if (!keywordId) {
      throw new Error('Keyword ID is required')
    }

    // Get keyword record
    const keyword = await this.getKeyword(keywordId)
    
    // Validate keyword state
    this.validateKeywordForGeneration(keyword)

    // Get organization settings
    const settings = await this.getOrganizationSettings(keyword.organization_id)

    // Generate subtopics using DataForSEO
    const subtopics = await generateSubtopics(
      keyword.longtail_keyword,
      settings.languageCode,
      settings.locationCode,
      3 // Exactly 3 subtopics per story requirements
    )

    return subtopics
  }

  /**
   * Store subtopics and update keyword status
   * @param keywordId The keyword ID
   * @param subtopics The subtopics to store
   */
  async store(keywordId: string, subtopics: KeywordSubtopic[]): Promise<void> {
    // Validate input
    if (!keywordId) {
      throw new Error('Keyword ID is required')
    }

    if (!subtopics || subtopics.length === 0) {
      throw new Error('Subtopics are required')
    }

    // Update keyword record
    const { error } = await this.supabase
      .from('keywords')
      .update({
        subtopics: subtopics,
        subtopics_status: 'complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', keywordId)

    if (error) {
      console.error('Failed to store subtopics:', error)
      throw new Error(`Failed to store subtopics: ${error.message}`)
    }

    console.log(`Stored ${subtopics.length} subtopics for keyword ${keywordId}`)
  }

  /**
   * Get keyword record from database
   */
  private async getKeyword(keywordId: string): Promise<KeywordRecord> {
    const { data, error } = await this.supabase
      .from('keywords')
      .select('*')
      .eq('id', keywordId)
      .single()

    if (error || !data) {
      console.error('Failed to fetch keyword:', error)
      throw new Error('Keyword not found')
    }

    return data as unknown as KeywordRecord
  }

  /**
   * Validate that keyword is ready for subtopic generation
   */
  private validateKeywordForGeneration(keyword: KeywordRecord): void {
    if (keyword.subtopics_status === 'complete') {
      throw new Error('Subtopics already generated')
    }

    if (keyword.longtail_status !== 'complete') {
      throw new Error('Keyword must have longtail_status = complete')
    }
  }

  /**
   * Get organization settings for DataForSEO API
   */
  private async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings> {
    // Get organization settings from keyword_settings
    const { data: orgData } = await this.supabase
      .from('organizations')
      .select('keyword_settings')
      .eq('id', organizationId)
      .single()

    if (!orgData) {
      console.warn('Organization settings not found, using defaults')
      // Use defaults based on story requirements
      return {
        locationCode: 2840, // United States
        languageCode: 'en'
      }
    }

    const keywordSettings = (orgData as any)?.keyword_settings || {}

    const locationCode = resolveLocationCode(keywordSettings.target_region)
    const languageCode = resolveLanguageCode(keywordSettings.language_code)

    console.log(`[SubtopicGenerator] Using location ${locationCode} and language ${languageCode} for region "${keywordSettings.target_region}"`)

    return {
      locationCode,
      languageCode
    }
  }
}
