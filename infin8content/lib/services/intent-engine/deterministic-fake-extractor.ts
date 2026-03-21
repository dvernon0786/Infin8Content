/**
 * Deterministic Fake Seed Extractor for E2E Testing
 * Returns predictable, repeatable data for enterprise-grade testing
 */

import type { SeedExtractor, ExtractSeedKeywordsRequest, ExtractSeedKeywordsResult, SeedKeywordData, CompetitorSeedExtractionResult } from './seed-extractor.interface'

export class DeterministicFakeExtractor implements SeedExtractor {
  private readonly deterministicKeywords: SeedKeywordData[] = [
    {
      seed_keyword: 'test keyword 1',
      search_volume: 1000,
      competition_level: 'medium',
      competition_index: 50,
      keyword_difficulty: 45,
      cpc: 1.5,
      detected_language: 'en',
      is_foreign_language: false,
      main_intent: 'informational',
      is_navigational: false,
      foreign_intent: ['commercial'],
      ai_suggested: true,
      user_selected: true,
      decision_confidence: 0.85,
      selection_source: 'ai',
      selection_timestamp: new Date().toISOString()
    },
    {
      seed_keyword: 'test keyword 2',
      search_volume: 800,
      competition_level: 'low',
      competition_index: 30,
      keyword_difficulty: 35,
      cpc: 1.2,
      detected_language: 'en',
      is_foreign_language: false,
      main_intent: 'commercial',
      is_navigational: false,
      foreign_intent: ['informational'],
      ai_suggested: true,
      user_selected: true,
      decision_confidence: 0.75,
      selection_source: 'ai',
      selection_timestamp: new Date().toISOString()
    }
  ]

  async extract(request: ExtractSeedKeywordsRequest): Promise<ExtractSeedKeywordsResult> {
    const competitorCount = request.competitors.length
    const keywordsPerCompetitor = Math.min(request.maxSeedsPerCompetitor || 2, 2)
    
    // Create deterministic results for each competitor
    const results: CompetitorSeedExtractionResult[] = request.competitors.map((competitor, index) => {
      const keywordStartIndex = (index * keywordsPerCompetitor) % this.deterministicKeywords.length
      const competitorKeywords = this.deterministicKeywords.slice(keywordStartIndex, keywordStartIndex + keywordsPerCompetitor)
      
      return {
        competitor_id: competitor.id,
        competitor_url: competitor.url,
        seed_keywords_created: competitorKeywords.length,
        keywords: competitorKeywords,
        error: undefined
      }
    })

    const totalKeywords = results.reduce((sum, result) => sum + result.seed_keywords_created, 0)

    return {
      total_keywords_created: totalKeywords,
      competitors_processed: competitorCount,
      competitors_failed: 0,
      results
    }
  }

  getExtractorType(): string {
    return 'deterministic-fake'
  }
}
